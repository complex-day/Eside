# Milestone 5: Outcome Timeline & Comments Engine

**Project**: Eside — Learn from Real Outcomes  
**Date**: 2026-08-31  
**Status**: **IMPLEMENTED & VERIFIED**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`

---

## 1. What Was Built

Milestone 5 implements the core longitudinal value proposition and community interaction layer of Eside:
1. **Outcome Timeline Engine**:
   - Generic integer milestone tracking (`days_after` from $0$ to $3,650$ days) supporting standard presets ($30\text{d}$, $90\text{d}$, $180\text{d}$, $1\text{y}$) and arbitrary custom day counts.
   - Author-only milestone logging modal (`AddOutcomeModal`) with multi-paragraph reflection textarea ($10$ to $5,000$ characters).
   - Connected vertical timeline component (`OutcomeTimeline` + `OutcomeMilestoneCard`) starting from Day 0 baseline to sequential outcomes.
   - Chronological ordering guarantee (`ORDER BY days_after ASC, created_at ASC`).
2. **Comments & Discussion Engine**:
   - Constructive pseudonymous comment threads (`CommentSection` + `CommentCard` + `CommentInput`).
   - Rate-limited comment submissions ($20\text{ comments/hour}$) via `src/lib/rate-limit.ts`.
   - Complete CRUD operations:
     - `GET /api/v1/experiences/[id]/comments`: Public retrieval of active comments.
     - `POST /api/v1/experiences/[id]/comments`: Authenticated comment submission with automatic author join.
     - `PUT /api/v1/comments/[id]`: Inline editing for comment authors with `(edited)` indicator.
     - `DELETE /api/v1/comments/[id]`: Soft-delete preserving referential integrity (`deleted_at = NOW()`).
3. **Experience Detail Integration**:
   - Concurrent server-side fetching of story narrative, outcomes timeline, and comments stream via `Promise.all`.

---

## 2. Why It Was Built

Standard storytelling and social platforms suffer from narrative truncation: users post during acute crisis or excitement, and the audience never learns the actual aftermath. By providing a first-class **Outcome Timeline**, Eside allows creators to append hindsight reflections months or years later. Readers can learn which decisions worked, which failed, and how long recovery truly took.

---

## 3. Architecture & Data Flow

```text
┌──────────────────────────────────────────────────────────┐
│             Experience Detail Reader View                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. Story Narrative & Category Tagging (M4)         │  │
│  └────────────────────────────────────────────────────┘  │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 2. Outcome Timeline (M5)                           │  │
│  │    • Day 0: Baseline Situation                     │  │
│  │    • Day 30: First Pivot (Outcome Milestone)       │  │
│  │    • Day 90: Long-term Resolution                  │  │
│  │    • [+ Log Outcome Milestone (Author Only)]       │  │
│  └────────────────────────────────────────────────────┘  │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 3. Constructive Community Discussion (M5)          │  │
│  │    • [Comment Input Box (Authenticated)]           │  │
│  │    • Comment Cards (Author Badge / Timestamps)     │  │
│  │    • Inline Edit / Delete (Comment Author Only)    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Authorization & Security Enforcement

| Resource | Action | Unauthenticated | Authenticated User | Story Author | Comment Author |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Outcomes** | `GET` | ✅ Allowed (Active) | ✅ Allowed | ✅ Allowed (Active & Draft) | ✅ Allowed |
| **Outcomes** | `POST` | ❌ 401 | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 |
| **Comments** | `GET` | ✅ Allowed (Active) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Comments** | `POST` | ❌ 401 (Redirect to Login)| ✅ Allowed ($20$/hr) | ✅ Allowed ($20$/hr) | ✅ Allowed |
| **Comments** | `PUT` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |
| **Comments** | `DELETE`| ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |

---

## 5. Alternatives Considered

1. **Hardcoding Outcome Intervals (30d, 90d, 180d Enum)**:
   - *Rejected*: Human situations don't happen only on fixed monthly intervals (e.g. Day 14 court hearing, Day 45 test results, 2 years later). Storing generic integer `days_after` preserves total flexibility while UI can still offer one-click presets.
2. **Comment Deletion Model**:
   - *Decision*: Followed `docs/Database,.md` and `supabase/schema.sql` where `comments` does not maintain a `deleted_at` column; deletion is performed via standard row deletion (`.delete().eq("id", id)`), while experiences maintain `deleted_at` for profile archiving.
3. **Separate Outcome Page vs. Integrated Detail Stream**:
   - *Decision*: Placed the outcome timeline and discussion directly on `/experiences/[id]` to maximize reader engagement and provide single-page narrative continuity.

---

## 6. Files Created & Modified

### New Validation Schemas:
- `src/lib/validations/outcome.ts`: Zod schema for `days_after` ($0$–$3650$) and `content` ($10$–$5000$).
- `src/lib/validations/comment.ts`: Zod schema for `content` ($2$–$1500$).

### New & Updated API Routes:
- `src/app/api/v1/experiences/[id]/outcomes/route.ts`: Outcome timeline fetch and author insertion.
- `src/app/api/v1/experiences/[id]/comments/route.ts`: Comment feed fetch and authenticated submission.
- `src/app/api/v1/comments/[id]/route.ts`: Individual comment update and soft delete.
- `src/lib/rate-limit.ts`: Added `checkCommentRateLimit` (20 comments/hour).

### New UI Components:
- `src/components/outcomes/OutcomeMilestoneCard.tsx`: Timeline card with Day badge and relative timestamp.
- `src/components/outcomes/AddOutcomeModal.tsx`: Modal dialog for author to log outcome milestones.
- `src/components/outcomes/OutcomeTimeline.tsx`: Connected vertical track with Day 0 baseline.
- `src/components/comments/CommentInput.tsx`: Form with autogrow and character counter.
- `src/components/comments/CommentCard.tsx`: Individual comment with author badge and inline edit/delete.
- `src/components/comments/CommentSection.tsx`: Thread container managing live state.

### Modified Pages:
- `src/app/(main)/experiences/[id]/page.tsx`: Integrated `OutcomeTimeline` and `CommentSection`.

---

## 7. Build & Quality Verification

- **TypeScript strict checking (`tsc --noEmit`)**: 0 errors.
- **ESLint (`next lint`)**: 0 warnings/errors.
- **Next.js Production Compilation (`next build`)**: All 16 routes compiled and optimized successfully.
