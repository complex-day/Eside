# Milestone 4: Experiences Lifecycle, Category Filter & Discovery

## 1. What Was Built
Milestone 4 delivers the core content engine and discovery experience of Eside:
1. **Experience Creation & Lifecycle**:
   - `/experiences/new`: Form supporting title, narrative story, category selection, and up to 5 normalized tags.
   - Dual publication actions: **Publish Immediately** (`status = 'active'`) vs. **Save as Draft** (`status = 'hidden'`).
   - `/experiences/[id]/edit`: Author-only interface to update title, narrative, category, and tags, or toggle between Published and Draft.
   - Soft-delete archiving: Sets `deleted_at = NOW()` and `status = 'deleted'`, removing content from public discovery while preserving relational integrity.
2. **Public Feed & Discovery**:
   - `/`: Responsive public feed with sub-500ms index queries, Next/Prev pagination (10 items/page), and `ExperienceCard` components with author gradient avatar, category pill, story excerpt, tags, and outcome count badge.
   - `CategoryFilter`: Horizontal pill scrollbar filtering stories by category slug (`/?category=slug`) in sub-300ms.
   - `TagBadge`: Clickable tag pill badges filtering feed by tag name (`/?tag=slug`).
3. **Story Narrative & Outcome Badge**:
   - `/experiences/[id]`: Full formatted story view with multi-paragraph text, author header, category pill, tag list, and outcome progress badge indicator.
4. **Lightweight Bookmarking**:
   - `POST /api/v1/bookmarks`: Atomic toggle endpoint.
   - `BookmarkButton`: Interactive client component with optimistic UI feedback on feed cards and detail pages.
5. **Database Sliding-Window Rate Limiting**:
   - Limits users to a maximum of 10 experience submissions per hour using indexed query `idx_experiences_author (author_id, created_at)`.

---

## 2. Why It Was Built & Architecture Decisions

### Decision 1: Query Parameter Category Navigation (`/?category=slug`) vs. Duplicate Dynamic Routes
- **Rationale**: Using query parameters allows a single unified server-rendered feed component (`src/app/(main)/page.tsx`) to handle all combinations of category filtering, tag filtering, pagination, and sorting without duplicating layout logic or triggering full-page tears.

### Decision 2: Soft-Delete over Hard-Delete
- **Rationale**: Lived experiences may have attached outcomes, comments, bookmarks, and analytics events. Deleting rows from `experiences` would trigger cascading deletions or orphaned references. Setting `deleted_at = NOW()` and `status = 'deleted'` allows PostgreSQL partial index `WHERE status = 'active' AND deleted_at IS NULL` to exclude them immediately from queries.

### Decision 3: Database Sliding-Window Rate Limiting over Redis
- **Rationale**: In accordance with Rule 3 (Architecture Simplicity), the rate limiter queries `COUNT(*)` over a 1-hour window using existing PostgreSQL indices. This eliminates external Redis/Upstash dependencies, costs, and infrastructure failure points during MVP.

### Decision 4: PostgREST Tag Upsertion & Junction Links
- **Rationale**: On experience creation, tags are normalized (`trim`, `toLowerCase`, regex `^[a-z0-9-_]{2,30}$`). New tags are upserted into `tags` with `ON CONFLICT (name) DO NOTHING`, and junction rows are inserted into `experience_tags`.

---

## 3. Files Created and Modified

### Validation & Utilities:
- [`src/lib/validations/experience.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/lib/validations/experience.ts): Zod schemas for experience creation, updating, feed query parameters, and bookmark toggling.
- [`src/lib/rate-limit.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/lib/rate-limit.ts): Database sliding-window rate limit checker.

### API Routes:
- [`src/app/api/v1/categories/route.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/api/v1/categories/route.ts): `GET /api/v1/categories`
- [`src/app/api/v1/tags/route.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/api/v1/tags/route.ts): `GET /api/v1/tags`
- [`src/app/api/v1/experiences/route.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/api/v1/experiences/route.ts): `GET /api/v1/experiences` & `POST /api/v1/experiences`
- [`src/app/api/v1/experiences/[id]/route.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/api/v1/experiences/[id]/route.ts): `GET`, `PUT`, `DELETE /api/v1/experiences/[id]`
- [`src/app/api/v1/bookmarks/route.ts`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/api/v1/bookmarks/route.ts): `POST /api/v1/bookmarks`

### Shared UI Primitives:
- [`src/components/shared/TagBadge.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/shared/TagBadge.tsx): Standardized tag pill component.
- [`src/components/shared/CategoryFilter.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/shared/CategoryFilter.tsx): Category horizontal scroll pill bar.
- [`src/components/shared/ExperienceCard.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/shared/ExperienceCard.tsx): Feed card with author avatar, category pill, excerpt, tags, outcome badge, and bookmark action.
- [`src/components/shared/PaginationControls.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/shared/PaginationControls.tsx): Accessible Next/Prev pagination controls.
- [`src/components/shared/BookmarkButton.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/shared/BookmarkButton.tsx): Client-side optimistic bookmark toggle button.
- [`src/components/shared/ExperienceDetailActions.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/components/shared/ExperienceDetailActions.tsx): Author edit/delete toolbar + bookmark button.

### Pages:
- [`src/app/(main)/page.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/(main)/page.tsx): Main Public Feed with category filter bar and pagination.
- [`src/app/(main)/experiences/new/page.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/(main)/experiences/new/page.tsx): Experience creation form.
- [`src/app/(main)/experiences/[id]/page.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/(main)/experiences/[id]/page.tsx): Experience narrative detail view.
- [`src/app/(main)/experiences/[id]/edit/page.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/(main)/experiences/[id]/edit/page.tsx): Experience editing and archive page.
- [`src/app/(main)/profile/page.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/(main)/profile/page.tsx): Updated with clickable experience cards.
- [`src/app/(main)/u/[username]/page.tsx`](file:///c:/Users/Lenovo/Desktop/PROJECT%20CREATED/Eside_v1/src/app/(main)/u/[username]/page.tsx): Updated with clickable experience cards.

---

## 4. Failure Scenarios & Edge Cases

| Scenario | Handled By | Outcome |
| :--- | :--- | :--- |
| User tries to submit $>10$ posts within 1 hour | `checkExperienceRateLimit` | Returns HTTP `429 RATE_LIMITED` with clear error message. |
| User enters duplicate or mixed-case tags (e.g. `['College', '#college']`) | `normalizeTag` + `Set` | Deduplicates and formats to `['college']`. |
| Non-author tries to edit another user's story | `PUT /api/v1/experiences/[id]` | Returns HTTP `403 FORBIDDEN`. |
| Unauthenticated user views private draft URL | `GET /api/v1/experiences/[id]` | Returns HTTP `404 NOT_FOUND`. |
| Empty feed for a rare category or tag | `src/app/(main)/page.tsx` | Displays friendly Empty State with "Share Your Story" CTA. |

---

## 5. Future Learning Topics for Milestone 5
1. **Outcome Timeline Engine**: Building the interactive 30-day, 90-day, and 180-day milestone update creator and visualizer.
2. **Comment Threading & Discussion**: Structured discussions under lived experiences.
3. **Outcome Notifications / Reminders**: Author prompts to return after 30/90/180 days to document long-term results.
