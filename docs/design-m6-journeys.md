# System Design: Milestone 6 (Living Outcome Journeys & Outcome Discovery Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 6 — Revised Product Core)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `docs/Database,.md`, `docs/APIs.md`

---

## 1. Architectural Overview & Data Flow

Milestone 6 re-architects Eside around **Living Outcome Journeys**, eliminating fixed milestone constraints and enabling continuous longitudinal storytelling and discovery:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Living Outcome Journey Architecture                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ Contributor / Author ]                     [ Reader / Community ]  │
│              │                                           │             │
│   Clicks "Add Journey Update"                  Browses Discovery Feed  │
│              │                                           │             │
│              ▼                                           ▼             │
│   ┌──────────────────────────────┐             ┌────────────────────┐  │
│   │ Auto-Elapsed Calculation     │             │ Discovery Engine   │  │
│   │   • Story Start: Aug 15      │             │   • Latest Stories │  │
│   │   • Today: Aug 29            │             │   • 🔥 Updated     │  │
│   │   • Auto-detected: Day 14    │             │   • 90d+ Journeys  │  │
│   │   • Optional custom override │             └─────────┬──────────┘  │
│   └──────────────┬───────────────┘                       │             │
│                  │                                       │             │
│                  ▼                                       ▼             │
│   ┌──────────────────────────────┐             ┌────────────────────┐  │
│   │ POST /api/v1/.../outcomes    │             │ GET /experiences   │  │
│   │ (Unlimited updates, 0-3650d) │             │ (Enriched Journeys)│  │
│   └──────────────┬───────────────┘             └─────────┬──────────┘  │
│                  │                                       │             │
│                  ▼                                       ▼             │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      Supabase PostgreSQL                        │  │
│   │                                                                 │  │
│   │  • public.experiences                                          │  │
│   │  • public.outcomes (Relaxed constraints, recency index)         │  │
│   │  • public.categories & public.tags                              │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Schema Migration Diff & Impact Analysis (Phase B)

### A. Exact SQL Migration Script

To support free-form timeline updates, the restrictive database check and unique constraint from M2 must be modified via a clean migration script:

```sql
-- ============================================================================
-- Migration: 00013_unlock_freeform_outcome_journeys.sql
-- Description: Unlocks free-form days_after range (0-3650) and removes 1-update limit
-- ============================================================================

BEGIN;

-- 1. Drop existing discrete milestone check constraint (was restricted to 30, 90, 180)
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS chk_outcomes_days_after;

-- 2. Drop unique constraint that prevented multiple updates on the same day
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS uq_experience_days_after;

-- 3. Add generalized valid day range constraint (0 to 3650 days / 10 years)
ALTER TABLE public.outcomes 
ADD CONSTRAINT chk_outcomes_days_after 
CHECK (days_after >= 0 AND days_after <= 3650);

-- 4. Create composite index to optimize "Recently Updated" feed queries
CREATE INDEX IF NOT EXISTS idx_outcomes_experience_recency 
ON public.outcomes (experience_id, created_at DESC);

COMMIT;
```

### B. Impact on Milestone 5 Implementation Files

| File | Current Implementation (M5) | Required Change (M6 Journeys) |
| :--- | :--- | :--- |
| [`src/lib/validations/outcome.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/lib/validations/outcome.ts) | `days_after` required number ($0$–$3650$) | Make `days_after` optional in `createOutcomeSchema`. If omitted, computed on backend. |
| [`src/app/api/v1/experiences/[id]/outcomes/route.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/api/v1/experiences/%5Bid%5D/outcomes/route.ts) | Reads explicit `days_after` from request body | Auto-calculates `days_after = Math.max(0, Math.floor((Date.now() - new Date(experience.created_at).getTime()) / (1000 * 60 * 60 * 24)))` if omitted. |
| [`src/components/outcomes/AddOutcomeModal.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/outcomes/AddOutcomeModal.tsx) | Preset buttons for 30d, 90d, 180d, 1y | Displays auto-detected elapsed badge: `Posting update for Day 14 (Today)`, with optional custom day override. |
| [`src/components/outcomes/OutcomeTimeline.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/outcomes/OutcomeTimeline.tsx) | Fixed checkpoint copy (`"Day 30/90/180 Checkpoint"`) | Renamed to Living Journey Timeline; renders arbitrary day progression (`Day 2`, `Day 11`, `Day 103`). |
| [`src/components/outcomes/OutcomeMilestoneCard.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/outcomes/OutcomeMilestoneCard.tsx) | Hardcoded `getMilestoneLabel` formatting for 30/90/180 | Dynamic label: `Day X (N days/weeks/months after decision)` with relative delta badges. |
| [`src/lib/supabase/database.types.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/lib/supabase/database.types.ts) | `export type OutcomeDays = 30 \| 90 \| 180;` | `export type OutcomeDays = number;` |

### C. Backwards Compatibility Verification
- Existing records with `days_after = 30`, `90`, or `180` in `public.outcomes` comply with the new constraint ($0 \le \text{days\_after} \le 3650$).
- All existing outcome data is preserved and will render seamlessly as `Day 30`, `Day 90`, and `Day 180` nodes.

---

## 3. API Contracts & Endpoint Specifications

### A. `POST /api/v1/experiences/[id]/outcomes`
Appends a living journey update to an owned experience.

- **Access**: Authenticated Story Author Only
- **Rate Limit**: 20 updates / hour

#### Request Body
```json
{
  "content": "Received the offer today after 3 rounds of technical interviews. The preparation strategy paid off."
}
```
*Optional retroactive override:*
```json
{
  "days_after": 14,
  "content": "Retroactive reflection on what occurred on Day 14..."
}
```

#### Auto-Calculation Algorithm:
```typescript
let daysAfter = body.days_after;
if (daysAfter === undefined || daysAfter === null) {
  const storyStartMs = new Date(experience.created_at).getTime();
  const nowMs = Date.now();
  daysAfter = Math.max(0, Math.floor((nowMs - storyStartMs) / (1000 * 60 * 60 * 24)));
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "90e12345-6789-4abc-def0-1234567890ab",
    "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
    "days_after": 14,
    "content": "Received the offer today after 3 rounds of technical interviews...",
    "created_at": "2026-08-31T14:30:00.000Z"
  }
}
```

---

### B. `GET /api/v1/experiences` (Enriched Discovery Feed)
Returns a paginated list of experiences with journey metadata and rich discovery filters.

#### Query Parameters:
| Parameter | Type | Default | Options / Description |
| :--- | :--- | :--- | :--- |
| `sort` | `string` | `'latest'` | `'latest'` (story creation date) \| `'recently_updated'` (latest outcome update date) |
| `journey` | `string` | `'all'` | `'all'` \| `'active'` ($\ge 1$ updates) \| `'long_running'` ($\ge 90\text{d}$ journey) |
| `category` | `string` | `null` | Category slug or UUID |
| `tag` | `string` | `null` | Tag name filter |
| `page` | `integer`| `1` | Page number |
| `limit` | `integer`| `20` | Items per page (max 50) |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "f8a12b34-5678-49ab-9012-3456789abcde",
        "title": "Leaving Big Tech for an early-stage startup",
        "story_preview": "Six months ago, I made the decision to step away from...",
        "is_anonymous": true,
        "author": {
          "username": "HorizonChaser"
        },
        "category": {
          "id": "a3b8d4e2-9f1c-4b5a-8e2d-3c4b5a6f7e8d",
          "name": "Career"
        },
        "tags": ["career-change", "startup", "risk"],
        "journey": {
          "total_updates": 4,
          "latest_days_after": 103,
          "latest_update_at": "2026-08-31T12:00:00.000Z",
          "is_long_running": true
        },
        "comments_count": 8,
        "created_at": "2026-05-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 64,
      "total_pages": 4
    }
  }
}
```

---

## 4. Outcome Discovery Engine & UI Component Architecture (Phase C)

```text
src/components/
  ├── outcomes/
  │     ├── AddJourneyUpdateModal.tsx    # Modal with auto-detected Day X and retroactive toggle
  │     ├── OutcomeTimeline.tsx          # Connected vertical progression track
  │     ├── OutcomeMilestoneCard.tsx     # Dynamic Day X card with delta badges
  │     └── JourneyProgressBadge.tsx     # Compact pill for feed cards [Day 0 → Day 103 • 4 updates]
  └── feed/
        ├── FeedTabs.tsx                 # [Latest Stories] vs [🔥 Recently Updated]
        ├── JourneyFilterPills.tsx       # [All Stories] [Active Journeys (1+)] [Long-running (90d+)]
        └── ExperienceCard.tsx           # Enriched with JourneyProgressBadge & recency tag
```

### Visual Representation of Journey Progress Indicators:

1. **Card Header Badge (Feed Preview)**:
   ```text
   ┌─────────────────────────────────────────────────────────────────┐
   │ Career  •  [🚀 Day 0 → Day 103 • 4 updates]   Updated 2h ago   │
   │ Leaving Big Tech for an early-stage startup                     │
   │ Six months ago, I made the decision to step away from...       │
   └─────────────────────────────────────────────────────────────────┘
   ```
2. **Timeline Visual Progression (Detail View)**:
   ```text
   ● Day 0 (Initial Decision)
   │  "Resigned from corporate position."
   │
   ├─► (+2 days later)
   ● Day 2: First Wave of Doubt
   │  "Initial panic when access was revoked..."
   │
   ├─► (+9 days later)
   ● Day 11: First Product Deployment
   │  "Shipped initial prototype to 50 test users..."
   │
   ├─► (+92 days later)
   ● Day 103: Hindsight & Long-term Outcome
   │  "Product-market fit validated. Best decision I made."
   ```

---

## 5. Performance & Query Optimization

1. **Efficient Feed Journey Enrichment**:
   - Rather than executing $N$ queries for each story's outcome list, feed queries compute journey stats using Supabase sub-relation aggregation:
     ```sql
     SELECT 
       e.*,
       COUNT(o.id) AS total_outcomes,
       MAX(o.days_after) AS max_days_after,
       MAX(o.created_at) AS last_outcome_created_at
     FROM experiences e
     LEFT JOIN outcomes o ON o.experience_id = e.id
     GROUP BY e.id
     ```
2. **Indexing Strategy**:
   - `idx_outcomes_experience_recency`: Index on `outcomes(experience_id, created_at DESC)` ensures instantaneous aggregation.
   - Total feed response time stays strictly $< 500\text{ms}$ under load.
