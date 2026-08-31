# Eside - Project State

## Project Overview
- **Project Name**: Eside
- **Architecture**: Monolithic Next.js (App Router) + Supabase (PostgreSQL) + Tailwind CSS + shadcn/ui
- **Current Milestone**: M4 — Experiences Lifecycle, Category Filter & Discovery
- **Repository**: [https://github.com/complex-day/Eside.git](https://github.com/complex-day/Eside.git)

---

# Current Status

## Completed
- M1 Foundation & Auth Setup
- M2 Database Schema, RLS Policies & Seed Data
- M3 Auth Integration & User Profiles

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
| **M4** | Experiences Lifecycle, Category Filter & Discovery | **In Progress** | Current |
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

### M3: Auth Integration & User Profiles (Completed 2026-08-31)
- End-to-end authentication lifecycle (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/callback`).
- Case-insensitive username collision handling mapping PostgreSQL error `23505` to `409 Conflict`.
- Reserved username validation blocking `admin`, `moderator`, `support`, `official`, `system`.
- Edge Middleware route protection redirecting unauthenticated users to `/login?next=...` and authenticated users away from auth pages.
- Profile auto-provisioning and sync between `auth.users` and `public.users`.
- Profile Dashboard (`/profile`) organizing content across 5 lifecycle tabs: **Published**, **Drafts**, **Archived**, **My Outcomes**, and **Bookmarks**.
- Profile Editor (`/profile/edit`) with live bio character counter (max 300 chars) and avatar preview.
- Public anonymous author view (`/u/[username]`) isolating published experiences from private drafts.
- Deterministic gradient anonymous avatar component (`UserAvatar.tsx`) and dynamic navigation header.

---

## Current Milestone Focus: M4
### Goals:
1. **Experience Creation Lifecycle**:
   - Rich experience submission form (`/experiences/new`) with title, story, category selector, and tag input.
   - Status management: Publish (`active`) or Save as Draft (`hidden`).
   - Server-side validation and rate limiting (10 posts/hr).
2. **Experience Feed & Discovery**:
   - Paginated public feed with sorting (`latest`, `outcomes`).
   - Category filtering (Education, Career, Finance, etc.) with sub-300ms index support.
   - Tag exploration and experience preview cards.
3. **Experience Detail View**:
   - Full story display (`/experiences/[id]`) with author badge, category pill, and outcome timeline teaser.
