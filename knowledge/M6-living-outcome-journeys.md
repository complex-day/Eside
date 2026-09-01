# Milestone 6: Living Outcome Journeys & Outcome Discovery Engine

## 1. What Was Built
Milestone 6 evolved Eside's core outcome tracking mechanism from a rigid milestone system (30d, 90d, 180d) into a **Living Outcome Journey** model, alongside a multi-dimensional discovery feed:

1. **Free-Form Living Outcome Journeys**:
   - Removed legacy constraints requiring fixed 30/90/180 day milestones.
   - Allowed authors to post updates whenever meaningful events occur (Day 2, Day 5, Day 14, Day 103, Day 450).
   - Allowed multiple updates on the same day without unique constraint collisions.
   - Auto-calculated elapsed days from the story's `created_at` timestamp on both client and server if omitted, with an optional custom day override for logging retroactive history.
   - Preserved all existing outcome data (e.g. Day 30, 90, 180 records remain valid and rendered seamlessly).

2. **Outcome Journey Progression & Delta Visualizer**:
   - `OutcomeTimeline.tsx` and `OutcomeMilestoneCard.tsx` render a connected vertical path from Day 0 baseline to latest updates.
   - Visual delta badges dynamically calculate elapsed duration between updates (`+2 days later`, `+3 weeks later`, `+2 months later`).
   - Clean, encouraging author empty states and dynamic `AddOutcomeModal` displaying `"Posting update for Day X (Today)"`.

3. **Multi-Dimensional Discovery Engine**:
   - **Feed Tabs (`FeedTabs.tsx`)**: Easily toggles the public feed between **Latest Stories** (`sort=latest`) and **🔥 Recently Updated Journeys** (`sort=recently_updated`).
   - **Journey Depth Filter Pills (`JourneyFilterPills.tsx`)**: Filter stories by journey maturity:
     - `All Stories` (`journey=all`)
     - `🚀 Active Journeys (1+)` (`journey=active`)
     - `⏳ Long-running (90d+)` (`journey=long_running`)
   - **Journey Progress Badges (`JourneyProgressBadge.tsx`)**: Displays journey depth directly on feed `ExperienceCard` items (e.g., `[🚀 Day 0 → Day 103 • 4 updates]` or `[⏳ Deep Journey: Day 180]`).
   - Full search parameter deep linking (`/?sort=recently_updated&journey=active&category=career`).

---

## 2. Why It Was Built
Eside's fundamental value proposition is answering:
> *"I made a decision / faced a dilemma → here is what actually happened over time."*

A rigid 30/90/180-day milestone model created artificial friction:
- Real-world consequences do not follow rigid 30-day schedules (some decisions produce immediate feedback in 48 hours; others evolve over 8 months).
- Forcing milestone schedules discouraged users from posting real-time turning points and gave readers a static impression.
- By auto-calculating elapsed days and prioritizing recently updated journeys in the discovery feed, authors are incentivized to return naturally whenever progress happens, and readers can find living, evolving wisdom.

---

## 3. Architecture Decisions

### 3.1 Database Migration (`00014_unlock_freeform_outcome_journeys.sql`)
- **Dropped Constraints**: `chk_outcomes_days_after` and `uq_experience_days_after`.
- **Added Constraints**: `CHECK (days_after >= 0 AND days_after <= 3650)` and `CHECK (char_length(content) >= 5 AND char_length(content) <= 5000)`.
- **Added Index**: `idx_outcomes_experience_recency ON public.outcomes (experience_id, created_at DESC)` for efficient retrieval of recently updated stories.

### 3.2 Server-Side Auto-Calculation
In `POST /api/v1/experiences/[id]/outcomes`:
```typescript
let computedDaysAfter = parsed.data.days_after;
if (computedDaysAfter === undefined || computedDaysAfter === null) {
  const storyStartMs = new Date(experience.created_at).getTime();
  const nowMs = Date.now();
  computedDaysAfter = Math.max(0, Math.floor((nowMs - storyStartMs) / (1000 * 60 * 60 * 24)));
}
```

### 3.3 Efficient Multi-Dimensional Feed Query Builder
In `GET /api/v1/experiences` and `src/app/(main)/page.tsx`:
- Leveraged indexed lookups on `outcomes` to resolve candidate `experience_id`s for `journey=active`, `journey=long_running`, and `sort=recently_updated`.
- Enriched each experience payload with a computed `journey` metadata object:
  ```json
  {
    "total_updates": 3,
    "latest_days_after": 45,
    "latest_update_at": "2026-09-01T12:00:00Z",
    "is_long_running": false
  }
  ```

---

## 4. Alternatives Considered

| Alternative | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **Fixed Milestone Notifications (30d/90d)** | Clear reminder schedule | Creates artificial pressure; ignores real-life pace | **Rejected** |
| **Materialized Views for Feed Sorting** | Fast aggregation | Complex cache invalidation; overkill for MVP scale | **Rejected** (Used direct composite indexed queries) |
| **Client-Only Elapsed Calculation** | Offloads server work | Unreliable across timezones; inconsistent API responses | **Rejected** (Server is single source of truth) |

---

## 5. Failure Scenarios & Mitigations

1. **Negative Elapsed Time / Future Timestamps**:
   - Clamped with `Math.max(0, ...)` to prevent negative days if system clocks drift.
2. **Empty Journey Queries**:
   - Filter queries that yield zero matching IDs gracefully return empty paginated item arrays (`{ items: [], pagination: { total: 0 } }`) rather than failing with 500 errors.
3. **Legacy Backwards Compatibility**:
   - Existing records with `days_after = 30, 90, 180` continue to display with their exact day labels and calculate relative deltas accurately.

---

## 6. Files Created & Modified

### New Files Created:
- `supabase/migrations/00014_unlock_freeform_outcome_journeys.sql`
- `src/components/outcomes/JourneyProgressBadge.tsx`
- `src/components/feed/FeedTabs.tsx`
- `src/components/feed/JourneyFilterPills.tsx`
- `docs/prd-m6-v2.md`
- `docs/design-m6-v2.md`
- `docs/tests-m6-v2.md`
- `knowledge/M6-living-outcome-journeys.md`

### Existing Files Modified:
- `supabase/schema.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/validations/outcome.ts`
- `src/lib/validations/experience.ts`
- `src/app/api/v1/experiences/[id]/outcomes/route.ts`
- `src/app/api/v1/experiences/route.ts`
- `src/components/outcomes/AddOutcomeModal.tsx`
- `src/components/outcomes/OutcomeMilestoneCard.tsx`
- `src/components/outcomes/OutcomeTimeline.tsx`
- `src/components/shared/ExperienceCard.tsx`
- `src/app/(main)/page.tsx`
- `src/app/(main)/experiences/[id]/page.tsx`
- `project-state.md`

---

## 7. Future Learning Topics
- **Longitudinal Trend Analytics**: Aggregating sentiment shift across Day 0 vs Day 90 across specific categories.
- **Milestone Version History**: Allowing authors to edit journey updates with audit trails.
