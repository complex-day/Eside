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

## Current Milestone
M4 — Experiences Lifecycle, Category Filter & Discovery

## Next Milestone
M5 — Outcome Timeline (30d, 90d, 180d) & Comments

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
| **M5** | Outcome Timeline (30d, 90d, 180d) & Comments | Pending | - |
| **M6** | Insights Dashboard, Content Reporting & Rate Limiting | Pending | - |
| **M7** | Analytics Event Tracking, Performance Tuning & Polish | Pending | - |

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

---

## Current Milestone Focus: M5
### Goals:
1. **Outcome Timeline Engine**:
   - Interactive milestone update submission for Day 30, Day 90, and Day 180 outcomes.
   - Chronological outcome visualizer cards attached to parent experiences.
2. **Comment Threading & Discussion**:
   - Comment submission form and threaded discussion cards under experiences.
   - Rate limiting and author attribution.
