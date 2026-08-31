# Eside - Changelog

All notable changes across development milestones are documented in this file.

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
