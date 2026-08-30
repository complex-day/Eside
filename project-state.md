# Eside - Project State

## Project Overview
- **Project Name**: Eside
- **Architecture**: Monolithic Next.js (App Router) + Supabase (PostgreSQL) + Tailwind CSS + shadcn/ui
- **Current Milestone**: M2 — Database Migrations, RLS Policies & Seed Data
- **Repository**: [https://github.com/complex-day/Eside.git](https://github.com/complex-day/Eside.git)

---

## Milestones Progress

| Milestone | Title | Status | Completion Date |
| :--- | :--- | :--- | :--- |
| **M1** | Foundation & Auth Setup | **Completed** | 2026-08-30 |
| **M2** | Database Migrations, RLS Policies & Seed Data | **In Progress** | Current |
| **M3** | Authentication Flow & Anonymous Profile Management | Pending | - |
| **M4** | Experiences Lifecycle, Category Filter & Discovery | Pending | - |
| **M5** | Outcome Timeline (30d, 90d, 180d) & Comments | Pending | - |
| **M6** | Insights Dashboard, Content Reporting & Rate Limiting | Pending | - |
| **M7** | Analytics Event Tracking, Performance Tuning & Polish | Pending | - |

---

## Completed Milestones
### M1: Foundation & Auth Setup (Completed 2026-08-30)
- Next.js 14 App Router monolith with strict TypeScript mode (`strict: true`, `noImplicitAny: true`, `noPropertyAccessFromIndexSignature: true`).
- Tailwind CSS custom design system with dark theme tokens (`#4F46E5` Indigo, `#06B6D4` Cyan, `#0F172A` Slate-900, `#1E293B` Slate-800).
- shadcn/ui base primitives (`Button`, `Card`, `Input`, `Label`).
- Supabase SSR integration with browser client, server client, and Edge Middleware session refresh.
- Auth validation schemas (Zod) and initial auth routes (`/login`, `/register`, `/api/v1/auth/callback`).
- Git repository initialized and pushed to `main` branch.

---

## Current Milestone Focus: M2
### Goals:
1. **Database Migrations**: Sequential SQL migration scripts matching `docs/Database,.md`:
   - `users` (profiles extending `auth.users`)
   - `categories` (8 core categories)
   - `experiences` (with status, category, author foreign keys, and indexes)
   - `tags` and `experience_tags` (many-to-many relationship)
   - `comments` (hierarchical discussion support)
   - `outcomes` (30d, 90d, 180d outcome updates)
   - `reports` (moderation queue)
   - `bookmarks` (saved experiences)
   - `analytics_events` (event telemetry storage)
2. **Row Level Security (RLS)**: Fine-grained PostgreSQL security policies for data protection and author-only modifications.
3. **Seed Data**: Baseline data for 8 core categories and foundational tags.
4. **Type Generation**: Create `src/lib/supabase/database.types.ts` reflecting exact database contracts.

---

## Database Version
- **Schema Version**: `v0.1.0-draft` -> transitioning to `v1.0.0` in M2
- **Migration Engine**: Supabase SQL Migrations (`supabase/migrations/`)

---

## Deployment Status
- **Target Hosting**: Vercel (Next.js App Router) + Supabase Cloud (PostgreSQL + Auth)
- **Local Verification**: All checks passing (`type-check: 0 errors`, `lint: 0 errors`, `build: successful`)
- **Git Branch**: `main` (synchronized with remote origin)

---

## Known Issues & Notes
- Supabase credentials in `.env.local` are set to development placeholders; connect to live Supabase project before applying migrations.
