# Eside - Project State

## Project Overview
- **Project Name**: Eside
- **Architecture**: Monolithic Next.js (App Router) + Supabase (PostgreSQL) + Tailwind CSS + shadcn/ui
- **Current Milestone**: M3 — Auth Integration & User Profiles
- **Repository**: [https://github.com/complex-day/Eside.git](https://github.com/complex-day/Eside.git)

---

# Current Status

## Completed
- M1 Foundation & Auth
- M2 Database Schema
- RLS Policies
- Seed Data
- Constraint Verification

## Current Milestone
M3 — Auth Integration & User Profiles

## Next Milestone
M4 — Experiences Lifecycle, Category Filter & Discovery

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
| **M3** | Auth Integration & User Profiles | **In Progress** | Current |
| **M4** | Experiences Lifecycle, Category Filter & Discovery | Pending | - |
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

---

## Current Milestone Focus: M3
### Goals:
1. **Authentication Flow**:
   - Complete anonymous user registration and credential login with Supabase Auth.
   - Session recovery and route protection via Next.js Middleware.
   - Seamless username check API and error mapping.
2. **User Profile Management**:
   - Public profile lookup and update endpoints (`/api/v1/profile`).
   - Profile view/edit screens with anonymous avatar and bio customization.
3. **Automated Tests**:
   - End-to-end auth flow validation, session refresh tests, and profile mutation tests.

---

## Deployment Status
- **Target Hosting**: Vercel (Next.js App Router) + Supabase Cloud (PostgreSQL + Auth)
- **Local Verification**: All checks passing (`type-check: 0 errors`, `lint: 0 errors`, `build: successful`)
- **Git Branch**: `main` (synchronized with remote origin)
