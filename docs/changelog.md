# Eside - Changelog

All notable changes across development milestones are documented in this file.

---

## [Milestone 5] - 2026-08-31

### Added
- **Outcome Timeline Engine**:
  - `POST /api/v1/experiences/[id]/outcomes`: Author-only milestone creation endpoint supporting generic `days_after` (0–3650 days) and multi-paragraph reflections.
  - `GET /api/v1/experiences/[id]/outcomes`: Public outcome milestone retrieval ordered chronologically (`days_after ASC, created_at ASC`).
  - `src/components/outcomes/OutcomeTimeline.tsx`: Connected vertical progression visualizer starting from Day 0 baseline to sequential outcomes.
  - `src/components/outcomes/OutcomeMilestoneCard.tsx`: Individual milestone card with Day label badge and relative timestamp.
  - `src/components/outcomes/AddOutcomeModal.tsx`: Modal dialog for author to log milestone outcomes with preset shortcuts (30d, 90d, 180d, 1y) and custom day inputs.
  - `src/lib/validations/outcome.ts`: Zod validation schemas for outcome creation and updates.
- **Comments & Discussion Engine**:
  - `GET /api/v1/experiences/[id]/comments`: Public discussion thread endpoint with author details join.
  - `POST /api/v1/experiences/[id]/comments`: Authenticated comment submission with database sliding-window rate limiting.
  - `PUT /api/v1/comments/[id]`: Inline comment editor for comment authors.
  - `DELETE /api/v1/comments/[id]`: Deletion endpoint for comment authors.
  - `src/components/comments/CommentSection.tsx`: Thread container managing live comment states.
  - `src/components/comments/CommentCard.tsx`: Individual comment card with author avatar, username, author badge, relative timestamp, and inline edit/delete actions.
  - `src/components/comments/CommentInput.tsx`: Comment submission input with character countdown and unauthenticated sign-in CTA.
  - `src/lib/validations/comment.ts`: Zod validation schemas for comments.
  - `src/lib/rate-limit.ts`: Added `checkCommentRateLimit` (20 comments/hr).
- **Story Detail Integration**:
  - `src/app/(main)/experiences/[id]/page.tsx`: Integrated `OutcomeTimeline` and `CommentSection` with concurrent `Promise.all` server-side data fetching.
- **Documentation**:
  - `knowledge/M5-outcomes-and-comments.md`: Comprehensive architecture and rebuild guide for Milestone 5.

---

## [Milestone 4] - 2026-08-31

### Added
- **Experience Creation & Publication Lifecycle**:
  - `POST /api/v1/experiences`: Authenticated experience submission with tag auto-creation, tag junction linking, and database sliding-window rate limiting.
  - `src/app/(main)/experiences/new/page.tsx`: Full-featured creation form supporting title, story narrative, category picker, tag inputs, and Publish vs. Save as Draft actions.
  - `src/app/(main)/experiences/[id]/edit/page.tsx`: Author story editor allowing title, narrative, category, tag updates, and publication visibility toggle.
  - `DELETE /api/v1/experiences/[id]`: Soft-delete/archiving endpoint setting `deleted_at = NOW()` and `status = 'deleted'`.
- **Public Feed & Discovery**:
  - `GET /api/v1/experiences`: Paginated public feed endpoint supporting category filtering, tag filtering, pagination, and bookmark indicators.
  - `src/app/(main)/page.tsx`: Responsive public feed with sub-500ms index queries, hero introduction, category pill bar, and pagination controls.
  - `src/components/shared/CategoryFilter.tsx`: Horizontal scrolling category filter pill bar with deep-link query parameter support (`/?category=slug`).
  - `src/components/shared/TagBadge.tsx`: Tag pill badges with deep-link tag query filtering (`/?tag=slug`).
  - `src/components/shared/ExperienceCard.tsx`: Rich experience preview cards displaying author avatar, username, category pill, excerpt, tags, outcome badge, and relative timestamps.
  - `src/components/shared/PaginationControls.tsx`: Accessible pagination navigation.
- **Experience Detail & Story View**:
  - `GET /api/v1/experiences/[id]`: Full story detail endpoint with access control for private drafts.
  - `src/app/(main)/experiences/[id]/page.tsx`: Dedicated narrative reading page with multi-paragraph whitespace rendering, author header, tag list, and outcome count badge.
  - `src/components/shared/ExperienceDetailActions.tsx`: Author edit/archive buttons and interactive bookmark button.
- **Lightweight Bookmarking Engine**:
  - `POST /api/v1/bookmarks`: Atomic toggle endpoint.
  - `src/components/shared/BookmarkButton.tsx`: Client-side optimistic bookmark toggle button.
- **Validation & Rate Limiting**:
  - `src/lib/validations/experience.ts`: Zod validation schemas for experience creation, updating, feed queries, and bookmarks.
  - `src/lib/rate-limit.ts`: Database-backed sliding-window rate limiter enforcing max 10 submissions/hr per user.

---

## [Milestone 3] - 2026-08-31

### Added
- **Authentication & Authorization Lifecycle**:
  - `POST /api/v1/auth/register`: Anonymous registration with case-insensitive uniqueness and reserved username checks.
  - `POST /api/v1/auth/login`: Credential validation and session token generation.
  - `POST /api/v1/auth/logout`: Session clearance and cookie invalidation.
  - `GET /api/v1/auth/callback`: Supabase PKCE authorization code exchange.
- **Edge Route Protection**:
  - `src/lib/supabase/middleware.ts` & `src/middleware.ts`: Automated route guards redirecting unauthenticated users from `/profile`, `/experiences/new`, and `/bookmarks` to `/login?next=...`, and redirecting logged-in users away from auth pages.
- **Anonymous Profile Management**:
  - `GET /api/v1/profile`: Fetches current user profile from `public.users`.
  - `PUT /api/v1/profile`: Updates anonymous bio (up to 300 chars) and avatar identifier.
  - `GET /api/v1/users/[username]`: Public anonymous author profile lookup for `/u/[username]`.
- **Profile Dashboard & Lifecycle Tabs**:
  - `src/app/(main)/profile/page.tsx`: Tabbed dashboard organizing experiences into **Published**, **Drafts**, **Archived**, **My Outcomes**, and **Bookmarks**.
  - `src/app/(main)/profile/edit/page.tsx`: Profile customization page with bio editor and character counter.
  - `src/app/(main)/u/[username]/page.tsx`: Public view for anonymous authors showing published experiences and outcomes.
- **UI Primitives & Shared Components**:
  - `src/components/ui/badge.tsx`: Status badges with active, draft, and archived variants.
  - `src/components/ui/tabs.tsx`: Accessible tab switcher for profile navigation.
  - `src/components/ui/avatar.tsx` & `src/components/ui/skeleton.tsx`.
  - `src/components/shared/UserAvatar.tsx`: Deterministic gradient avatar renderer.
  - `src/components/shared/Header.tsx`: Dynamic auth state with anonymous avatar dropdown, profile link, and logout button.

---

## [Milestone 2] - 2026-08-31

### Added
- **PostgreSQL Database Schema**: 10 relational tables matching `docs/Database,.md` (`users`, `categories`, `tags`, `experiences`, `experience_tags`, `comments`, `outcomes`, `bookmarks`, `reports`, `analytics_events`).
- **Database Constraints & Triggers**:
  - Case-insensitive unique username index (`idx_users_username_lower`).
  - Soft-delete timestamp support (`deleted_at`) on experiences.
  - Single-target mutually exclusive check constraint on reports (`chk_reports_single_target`).
  - Auto-updating `updated_at` trigger and `on_auth_user_created` profile sync trigger.
- **Row Level Security (RLS)**: 20 fine-grained policies enforcing multi-tenant isolation.
- **Performance Indexes**: Compound & partial indexes optimized for sub-500ms feed and sub-300ms category filtering.
- **Seed Data**: 8 core categories and 12 foundational tags.
- **Verification & Rollback**: `supabase/verify_m2.sql`, `supabase/test_constraints.sql`, and `supabase/migrations/00000_down_all.sql`.
- **Architecture Decision Records**: `ADR-001` through `ADR-004` in `docs/architecture-decision-records/`.
- **API Contract & Contributor Guide**: `docs/api-contract.md` and `docs/contributor-guide.md`.

---

## [Milestone 1] - 2026-08-30

### Added
- **Project Monolith Initialization**: Next.js 14 App Router setup with React 18, strict TypeScript (`strict: true`, `noImplicitAny: true`), and module aliases (`@/*`).
- **Design System & Theme Tokens**: Tailwind CSS configuration integrated with shadcn/ui and custom Eside color palette (`#4F46E5` Indigo, `#06B6D4` Cyan, `#0F172A` Slate 900, `#1E293B` Slate 800).
- **Typography & Font Optimization**: Configured Google Fonts `Inter` and `JetBrains Mono`.
- **Supabase SSR Foundation**: Browser, server, and middleware client wrappers with `@supabase/ssr`.
- **Authentication & Validation**: Zod validation schemas, login and registration UI prototypes.
- **Documentation**: `project-state.md` and `knowledge/M1-foundation-and-auth-setup.md`.
