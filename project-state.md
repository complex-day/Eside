# Eside - Project State

## Project Overview
- **Project Name**: Eside
- **Architecture**: Monolithic Next.js (App Router) + Supabase (PostgreSQL) + Tailwind CSS + shadcn/ui
- **Current Milestone**: M4 — Experiences Lifecycle, Category Filter & Discovery (Completed & Verified)
- **Repository**: [https://github.com/complex-day/Eside.git](https://github.com/complex-day/Eside.git)

---

# Current Status

## Completed
- M1 Foundation & Auth Setup
- M2 Database Schema, RLS Policies & Seed Data
- M3 Auth Integration & User Profiles
- M4 Experiences Lifecycle, Category Filter & Discovery
- M5 Outcome Timeline & Comments
- M6 Living Outcome Journeys & Outcome Discovery

## Current Milestone
M6 — Living Outcome Journeys & Outcome Discovery (Completed & Verified)

## Next Milestone
M7 — Content Moderation, Reporting & Safety Engine

## Database Version
v1

## Known Issues
None

---

## Milestones Progress

| Milestone | Title | Status | Completion Date |
| :--- | :--- | :--- | :--- |
| **M1** | Foundation & Auth Setup | **Completed** | 2026-08-30 |
| **M2** | Database Schema, RLS Policies & Seed Data | **Completed** | 2026-08-31 |
| **M3** | Auth Integration & User Profiles | **Completed** | 2026-08-31 |
| **M4** | Experiences Lifecycle, Category Filter & Discovery | **Completed** | 2026-08-31 |
| **M5** | Outcome Timeline & Comments | **Completed** | 2026-08-31 |
| **M6** | Living Outcome Journeys & Outcome Discovery | **Completed** | 2026-09-01 |
| **M7** | Content Moderation, Reporting & Safety Engine | Pending | - |
| **M8** | Analytics Event Tracking, Performance Tuning & Polish | Pending | - |

---

## Completed Milestones Summary

### M1: Foundation & Auth Setup (Completed 2026-08-30)
- Next.js 14 App Router monolith with strict TypeScript mode (`strict: true`, `noImplicitAny: true`, `noPropertyAccessFromIndexSignature: true`).
- Tailwind CSS custom design system with dark theme tokens (`#4F46E5` Indigo, `#06B6D4` Cyan, `#0F172A` Slate-900, `#1E293B` Slate-800).
- shadcn/ui base primitives (`Button`, `Card`, `Input`, `Label`).
- Supabase SSR integration with browser client, server client, and Edge Middleware session refresh.
- Auth validation schemas (Zod) and initial auth routes (`/login`, `/register`, `/api/v1/auth/callback`).
- Git repository initialized and pushed to `main` branch.

### M2: Database Schema, RLS Policies & Seed Data (Completed 2026-08-31)
- 10 PostgreSQL tables matching `docs/Database,.md` (`users`, `categories`, `tags`, `experiences`, `experience_tags`, `comments`, `outcomes`, `bookmarks`, `reports`, `analytics_events`).
- Case-insensitive username uniqueness (`idx_users_username_lower`).
- Soft-delete support on experiences (`deleted_at` timestamp + partial feed index).
- Mutually exclusive single-target check constraint on moderation reports (`chk_reports_single_target`).
- 20 fine-grained Row Level Security (RLS) policies for complete multi-tenant isolation.
- Core seed data for 8 platform categories and 12 foundational tags.
- Type-safe database definitions generated in `src/lib/supabase/database.types.ts` and integrated across Supabase client helpers.
- Live database verification and automated constraint assertion test suite (`supabase/test_constraints.sql`).
- Deterministic atomic rollback script (`supabase/migrations/00000_down_all.sql`).
- Architecture Decision Records (`ADR-001` through `ADR-004`), API contract (`docs/api-contract.md`), and Contributor guide (`docs/contributor-guide.md`).

### M3: Auth Integration & User Profiles (Completed 2026-08-31)
- End-to-end authentication lifecycle (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/callback`).
- Case-insensitive username collision handling mapping PostgreSQL error `23505` to `409 Conflict`.
- Reserved username validation blocking `admin`, `moderator`, `support`, `official`, `system`, `root`, `eside`.
- Edge Middleware route protection redirecting unauthenticated users to `/login?next=...` and authenticated users away from auth pages.
- Profile auto-provisioning and sync between `auth.users` and `public.users`.
- Profile Dashboard (`/profile`) organizing content across 5 lifecycle tabs: **Published**, **Drafts**, **Archived**, **My Outcomes**, and **Bookmarks**.
- Profile Editor (`/profile/edit`) with live bio character counter (max 300 chars) and avatar preview.
- Public anonymous author view (`/u/[username]`) isolating published experiences from private drafts.
- Deterministic gradient anonymous avatar component (`UserAvatar.tsx`) and dynamic navigation header.
- Module augmentation (`src/types/supabase-ssr.d.ts`) resolving upstream 5-parameter generic arity for `@supabase/ssr` with zero `any`, zero `@ts-ignore`, and zero type assertions.

### M4: Experiences Lifecycle, Category Filter & Discovery (Completed 2026-08-31)
- **Experience Submission & State Machine**:
  - `/experiences/new` creation interface with Title, Story Narrative, Category selector, Tag input, and Publish (`active`) vs. Save as Draft (`hidden`) actions.
  - `/experiences/[id]/edit` author editing page with soft-delete/archive action (`status = 'deleted'`, `deleted_at = NOW()`).
  - Database-backed sliding-window rate limiter enforcing max 10 submissions/hour per authenticated user (`src/lib/rate-limit.ts`).
- **Public Feed & Discovery Engine**:
  - `/` public feed with category horizontal pill switcher (`CategoryFilter`), tag pills (`TagBadge`), sub-500ms partial index queries, and accessible pagination (`PaginationControls`).
  - Deep-linkable query parameter filtering (`/?category=slug`, `/?tag=slug`).
  - Rich `ExperienceCard` preview cards with author avatar, username, category pill, story excerpt, tags, outcome badge, and relative timestamps.
- **Story Detail & Bookmarking**:
  - `/experiences/[id]` full narrative story reader with whitespace formatting, author header, tag list, and outcome progress badge indicator.
  - Lightweight bookmarking toggle API (`POST /api/v1/bookmarks`) and interactive `BookmarkButton` on feed cards and detail views.
- **Documentation**:
  - `knowledge/M4-experiences-and-discovery.md` containing architecture decisions, state machine diagrams, failure scenarios, and learning topics for milestone rebuilding.

### M5: Outcome Timeline & Comments Engine (Completed 2026-08-31)
- **Outcome Timeline Visualizer & Milestone Tracking**:
  - Generic integer milestone tracking (`days_after`: 0–3650 days) supporting quick presets (30d, 90d, 180d, 1y) and custom day offsets.
  - Connected vertical timeline component (`OutcomeTimeline.tsx` + `OutcomeMilestoneCard.tsx`) starting at Day 0 baseline.
  - Author-only milestone logging modal (`AddOutcomeModal.tsx`) with multi-paragraph reflection textarea (10–5000 chars).
  - Chronological sorting guarantee (`ORDER BY days_after ASC, created_at ASC`).
- **Comments & Discussion Engine**:
  - Linear constructive discussion thread (`CommentSection.tsx` + `CommentCard.tsx` + `CommentInput.tsx`).
  - Rate-limited comment submissions (20 comments/hour) via `src/lib/rate-limit.ts`.
  - Full CRUD operations with author inline editing and soft-deletion (`deleted_at = NOW()`).
- **Documentation**:
  - `knowledge/M5-outcomes-and-comments.md` documenting architecture, security matrix, and rebuild guide.

### M6: Living Outcome Journeys & Outcome Discovery (Completed 2026-09-01)
- **Living Outcome Journey Architecture**:
  - Unlocked free-form longitudinal outcome tracking ($0 \le \text{days\_after} \le 3650$) via migration `00014_unlock_freeform_outcome_journeys.sql`.
  - Removed duplicate day limitations to allow multiple updates on the same day.
  - Implemented automatic elapsed-day calculation from story creation date on client and server (`days_after` optional in `createOutcomeSchema`).
  - Added optional custom day offset toggle for documenting retroactive journey checkpoints.
  - Integrated dynamic delta duration badges (`+2 days later`, `+3 weeks later`, `+2 months later`) on `OutcomeMilestoneCard`.
- **Multi-Dimensional Discovery Feed**:
  - `FeedTabs`: Smooth switching between **Latest Stories** (`sort=latest`) and **🔥 Recently Updated Journeys** (`sort=recently_updated`).
  - `JourneyFilterPills`: Deep-linkable journey depth filter chips (`All Stories`, `🚀 Active Journeys (1+)`, `⏳ Long-running (90d+)`).
  - `JourneyProgressBadge`: Visual journey progress indicators on `ExperienceCard` items in public feeds.
  - Optimized composite index `idx_outcomes_experience_recency` for sub-500ms feed query performance.
- **Documentation**:
  - `knowledge/M6-living-outcome-journeys.md` containing full architecture decisions, migration diffs, and rebuild guide.

---

## Next Milestone Focus: M7 — Content Moderation, Reporting & Safety Engine
### Goals:
1. **Content Reporting Workflows**:
   - Report submission modal for experiences and comments (`public.reports`).
   - Moderation categories: Harassment, hate speech, spam, misinformation, privacy violations.
2. **Abuse Prevention & Rate Limiting**:
   - Deduplication of reports per user/target.
   - Author restriction preventing reporting own content.
   - Automated rate limiting on report submissions.
3. **Admin Moderation Queue**:
   - Moderation status lifecycle (`pending`, `reviewing`, `resolved`, `dismissed`).

