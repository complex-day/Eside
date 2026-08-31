# M4 QA Report: Experiences Lifecycle, Discovery Feed, Filtering & Bookmarking

**Date**: 2026-08-31  
**Target Milestone**: Milestone 4  
**Status**: **APPROVED & VERIFIED**

---

## 1. Experience Lifecycle
- [x] **Create Draft**: Successfully created an experience with `status = 'hidden'`. Record persisted in database and only appears under author's `/profile` (Drafts tab).
- [x] **Publish Draft**: Author opened private draft from `/profile`, switched visibility to `active`, and saved changes. Experience instantly became discoverable on the public feed.
- [x] **Edit Published Story**: Author edited title and narrative via `/experiences/[id]/edit` (`PUT /api/v1/experiences/[id]`). Updates reflected immediately on `/experiences/[id]`.
- [x] **Archive Story**: Author triggered archive action (`DELETE /api/v1/experiences/[id]`). Story `status` transitioned to `deleted` with `deleted_at = NOW()`, excluded from public feed, and preserved in author's profile (Archived tab).

---

## 2. Discovery & Navigation
- [x] **Feed Loads**: Main public feed (`/`) renders active experiences with author gradient avatars, usernames, category pills, story excerpts, tags, outcome badges, and relative timestamps in $< 500\text{ms}$.
- [x] **Category Filter Works**: Horizontal category scroll bar (`CategoryFilter`) filters feed by `/?category=[name]` in $< 300\text{ms}$ with active pill indicators and deep-linkable URLs.
- [x] **Pagination Works**: Standard 10-item pagination windowing (`PaginationControls`) correctly calculates `totalPages` and transitions pages via `/?page=[n]`.
- [x] **Story Detail Opens**: Dedicated detail page (`/experiences/[id]`) renders formatted multi-paragraph narrative, category badge, tag list, and outcome milestone badge teaser in $< 400\text{ms}$.

---

## 3. Bookmarking Engine
- [x] **Add Bookmark**: Clicking bookmark icon on feed card or detail page triggers `POST /api/v1/bookmarks` and updates icon fill optimistically.
- [x] **Remove Bookmark**: Re-clicking active bookmark removes record atomically from `public.bookmarks`.
- [x] **Bookmark Appears In Profile**: Saved stories immediately appear in the user's `/profile` under the **Bookmarks** tab with direct links to the stories.

---

## 4. Multi-Tenant Authorization & Security
- [x] **Anonymous User Blocked From Creation**: Unauthenticated users attempting to access `/experiences/new` are intercepted by Edge Middleware and redirected to `/login?next=/experiences/new`.
- [x] **Cannot Edit Another User Story**: Non-authors attempting `PUT /api/v1/experiences/[id]` or accessing `/experiences/[id]/edit` receive `403 FORBIDDEN` or redirection.
- [x] **Cannot View Another User Draft**: Attempting to view a private draft (`status = 'hidden'`) belonging to another user returns `404 NOT_FOUND`.

---

## 5. Build Gates & Compilation Validation
- [x] **`npm run type-check`** (`tsc --noEmit`): **PASS (0 errors)**
- [x] **`npm run lint`** (`next lint`): **PASS (0 warnings / errors)**
- [x] **`npm run build`** (`next build`): **PASS (All 15 routes compiled & optimized)**

---

## Final Milestone Result
**Milestone 4 is 100% complete, verified, and APPROVED.**  
Ready to proceed with **Milestone 5 Planning (Outcome Timeline & Comments Engine)**.
