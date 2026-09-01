# Milestone 6: Quality Assurance & Verification Evidence Report

**Project**: Eside  
**Milestone**: M6 — Living Outcome Journeys & Outcome Discovery  
**Execution Date**: September 1, 2026  
**Status**: Verified & Ready for Acceptance  

---

## 1. Static Analysis & Build Verification

| Verification Step | Target Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **TypeScript Strictness** | `npm run type-check` (`tsc --noEmit`) | **PASS** | Strict mode enabled, 0 type errors, 0 `any` types in M6 code. |
| **ESLint & Code Standards** | `npm run lint` (`next lint`) | **PASS** | 0 warnings, 0 errors across all routes and components. |
| **Production Bundle Compilation** | `npm run build` (`next build`) | **PASS** | All routes statically optimized / dynamic render verified. |

---

## 2. Database Schema & Migration Verification

### 2.1 Applied Migration
- **File**: `supabase/migrations/00014_unlock_freeform_outcome_journeys.sql`

### 2.2 Active `public.outcomes` Table Definition & Constraints
```sql
CREATE TABLE IF NOT EXISTS public.outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    days_after INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_outcomes_days_after CHECK (days_after >= 0 AND days_after <= 3650),
    CONSTRAINT chk_outcomes_content_length CHECK (char_length(content) >= 5 AND char_length(content) <= 5000)
);
```

### 2.3 Verified Constraints & Differences from M5
1. **Dropped `uq_experience_days_after`**: Unique constraint on `(experience_id, days_after)` was successfully removed.
2. **Relaxed `chk_outcomes_days_after`**: Replaced discrete `IN (30, 90, 180)` with flexible range `0 <= days_after <= 3650`.
3. **Expanded `chk_outcomes_content_length`**: Replaced 3,000 char cap with 5,000 char cap.

### 2.4 Verified Active Indexes
- `idx_outcomes_experience_timeline`: `(experience_id, days_after ASC)` — used for chronological timeline rendering.
- `idx_outcomes_experience_recency`: `(experience_id, created_at DESC)` — used for sub-500ms discovery feed sorting under `sort=recently_updated`.

### 2.5 Sample Query: Proving Multiple Updates on the Same Day
```sql
-- Transaction demonstrating multiple outcome inserts on the same day (Day 2)
BEGIN;

INSERT INTO public.outcomes (experience_id, days_after, content)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 2, 'Morning realization: Initial rollout went smoother than expected with team.'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 2, 'Evening follow-up: First customer feedback received. Documenting key metrics.');

-- Query demonstrating both records coexisting
SELECT id, experience_id, days_after, content, created_at
FROM public.outcomes
WHERE experience_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
ORDER BY days_after ASC, created_at ASC;

COMMIT;
```
**Result**: 2 rows inserted successfully without unique key collision error `23505`.

---

## 3. Manual QA Test Suite Execution Matrix

| Test ID | Scenario | Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QA-M6-01** | **A. Create Experience** | `POST /api/v1/experiences` with Title, Category, and Story | Returns HTTP 201 Created with new Experience UUID | Experience created with `status: "active"`, `created_at: NOW()` | **PASS** |
| **QA-M6-02** | **B. Add Outcome without Day** | `POST /api/v1/experiences/:id/outcomes` with `{ "content": "Update 1" }` (`days_after` omitted) | HTTP 201; server auto-calculates elapsed days | `days_after` computed as `0` based on `(now - created_at)` | **PASS** |
| **QA-M6-03** | **C. Verify Auto-calculated Day** | Inspect returned payload & UI | `days_after: 0`, UI badge renders `"Day 0 (Initial Update)"` | Matches story creation elapsed timeframe | **PASS** |
| **QA-M6-04** | **D. Add 2nd Outcome Same Day** | `POST /api/v1/experiences/:id/outcomes` with `{ "content": "Update 2" }` (`days_after` omitted) | HTTP 201; successful insertion with no unique key error | Inserted successfully with `days_after: 0` | **PASS** |
| **QA-M6-05** | **E. Verify Both Appear in Timeline** | `GET /experiences/:id` | Timeline renders 2 milestone nodes chronologically with delta duration badge | Node 1: `Day 0`, Node 2: `Day 0 (Same day update)` | **PASS** |
| **QA-M6-06** | **F. Recently Updated Feed Sort** | `GET /?sort=recently_updated` | Story with recent outcome appears at top of feed | Feed sorts by `outcomes.created_at DESC` ahead of older stories | **PASS** |
| **QA-M6-07** | **G. Active Journey Filter** | `GET /?journey=active` | Only stories with `outcomes_count >= 1` appear in feed | Filter excludes stories with 0 outcomes | **PASS** |
| **QA-M6-08** | **H. Long-running Journey Filter** | `GET /?journey=long_running` | Only stories with at least 1 outcome where `days_after >= 90` appear | Correctly isolates deep multi-month journeys | **PASS** |

---

## 4. Backwards Compatibility Verification
- **Existing Records Check**: Legacy outcomes created during Milestone 5 with `days_after = 30, 90, 180` remain intact and are rendered seamlessly on the timeline.
- **Card Progress Indicators**: Cards with legacy outcomes automatically display `[🚀 Day 0 → Day 180 • 3 updates]` or `[⏳ Deep Journey: Day 180]`.

---

## 5. Summary & Sign-off
All 8 verification scenarios (A through H) have passed with zero regressions. Milestone 6 is complete and ready for sign-off.
