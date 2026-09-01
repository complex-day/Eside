# System Design: Milestone 6 V2 (Living Outcome Journeys & Longitudinal Discovery Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 2.0 (Milestone 6 — Core Journey Pivot)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `docs/Database,.md`, `docs/APIs.md`

---

## 1. Architectural Overview & System Flow

The Living Outcome Journey architecture decouples updates from rigid time checkpoints, transforming Eside into a real-time longitudinal storytelling network:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   Living Outcome Journey Architecture                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ Contributor / Author ]                     [ Reader / Community ]  │
│              │                                           │             │
│   Opens Experience (/experiences/[id])         Opens Home Discovery    │
│              │                                           │             │
│              ▼                                           ▼             │
│   ┌──────────────────────────────┐             ┌────────────────────┐  │
│   │ Auto-Elapsed Calculator      │             │ Discovery Engine   │  │
│   │   • Story Start: T_0         │             │   • [Latest]       │  │
│   │   • Today: T_now             │             │   • [🔥 Updated]   │  │
│   │   • Auto Day = (T_now - T_0) │             │   • [90d+ Depth]   │  │
│   │   • Optional custom override │             └─────────┬──────────┘  │
│   └──────────────┬───────────────┘                       │             │
│                  │                                       │             │
│                  ▼                                       ▼             │
│   ┌──────────────────────────────┐             ┌────────────────────┐  │
│   │ POST /experiences/:id/outcomes│            │ GET /experiences   │  │
│   │ (0-3650d, unlimited updates) │             │ (Enriched Journey) │  │
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

## 2. Exact Schema Diff & Migration Requirements

### Current M5 Database Schema (`supabase/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS public.outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    days_after INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_outcomes_days_after CHECK (days_after IN (30, 90, 180)),
    CONSTRAINT chk_outcomes_content_length CHECK (char_length(content) >= 5 AND char_length(content) <= 3000),
    CONSTRAINT uq_experience_days_after UNIQUE (experience_id, days_after)
);
```

### Proposed M6 Database Schema
```sql
CREATE TABLE IF NOT EXISTS public.outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    days_after INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_outcomes_days_after CHECK (days_after >= 0 AND days_after <= 3650),
    CONSTRAINT chk_outcomes_content_length CHECK (char_length(content) >= 5 AND char_length(content) <= 5000)
    -- UNIQUE constraint dropped to allow unlimited updates
);
```

### Exact Schema Migration Script (`supabase/migrations/00013_unlock_freeform_outcome_journeys.sql`):
```sql
-- ============================================================================
-- Migration: 00013_unlock_freeform_outcome_journeys.sql
-- Description: Unlocks free-form days_after range (0-3650), removes single-update
--              cap, and adds recency index for discovery ranking.
-- ============================================================================

BEGIN;

-- 1. Drop discrete milestone check constraint (was restricted to 30, 90, 180)
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS chk_outcomes_days_after;

-- 2. Drop unique constraint that prevented multiple updates on the same day
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS uq_experience_days_after;

-- 3. Add generalized valid day range constraint (0 to 3650 days / 10 years)
ALTER TABLE public.outcomes 
ADD CONSTRAINT chk_outcomes_days_after 
CHECK (days_after >= 0 AND days_after <= 3650);

-- 4. Increase max content length to 5,000 characters
ALTER TABLE public.outcomes 
DROP CONSTRAINT IF EXISTS chk_outcomes_content_length;

ALTER TABLE public.outcomes 
ADD CONSTRAINT chk_outcomes_content_length 
CHECK (char_length(content) >= 5 AND char_length(content) <= 5000);

-- 5. Create composite index to optimize "Recently Updated" discovery feed queries
CREATE INDEX IF NOT EXISTS idx_outcomes_experience_recency 
ON public.outcomes (experience_id, created_at DESC);

COMMIT;
```

### Backwards Compatibility Verification:
- **Zero Data Loss**: All existing records with `days_after = 30, 90, 180` satisfy `days_after >= 0 AND days_after <= 3650`.
- Existing outcomes will continue to render as `Day 30`, `Day 90`, and `Day 180` in their exact chronological order.

---

## 3. API Contract Changes

### A. `POST /api/v1/experiences/[id]/outcomes`

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

#### Validation Rules:
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `content` | `string` | **Yes** | Min 10 characters, Max 5,000 characters |
| `days_after` | `integer` | No | If provided: $0 \le \text{days\_after} \le 3650$. If omitted: computed automatically. |

#### Auto-Calculation Server Logic:
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

### B. `GET /api/v1/experiences` (Feed Discovery Contract)

#### Query Parameters:
| Parameter | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `sort` | `string` | `'latest'` | `'latest'` (story date) \| `'recently_updated'` (latest outcome update date) |
| `journey` | `string` | `'all'` | `'all'` \| `'active'` ($\ge 1$ updates) \| `'long_running'` ($\ge 90\text{d}$ journey) |
| `category` | `string` | `null` | Category slug / UUID |
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

## 4. Feed Ranking & Discovery Strategy

### A. Sorting Strategies:
1. **`sort=latest`**:
   - Queries `experiences WHERE status = 'active' AND deleted_at IS NULL ORDER BY created_at DESC`.
   - Surfaces new decisions posted by the community.
2. **`sort=recently_updated`**:
   - Joins latest outcome `created_at` timestamp.
   - Orders by `COALESCE(MAX(outcomes.created_at), experiences.created_at) DESC`.
   - Stories that receive a fresh outcome update instantly bounce to the top of the feed.

### B. Journey Depth Filtering:
1. **`journey=all`**: All active stories.
2. **`journey=active`**: Only experiences having $\ge 1$ outcome row.
3. **`journey=long_running`**: Only experiences having at least one outcome with $\text{days\_after} \ge 90$.

---

## 5. UI Component Architecture

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

---

## 6. Performance Budget & Verification

- **Feed Aggregation Latency**: $< 350\text{ms}$ through PostgreSQL indexed joins.
- **Story Detail Latency**: $< 300\text{ms}$ loading story narrative and full outcome stream concurrently.
