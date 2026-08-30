# Eside - Changelog

All notable changes across development milestones are documented in this file.

---

## [Milestone 1] - 2026-08-30

### Added
- **Project Monolith Initialization**: Next.js 14 App Router setup with React 18, strict TypeScript (`strict: true`, `noImplicitAny: true`), and module aliases (`@/*`).
- **Design System & Theme Tokens**: Tailwind CSS configuration integrated with shadcn/ui and custom Eside color palette:
  - Primary: `#4F46E5` (Indigo)
  - Secondary: `#06B6D4` (Cyan)
  - Dark Surface & Backgrounds: `#0F172A` (Slate 900) and `#1E293B` (Slate 800)
  - High Contrast Text: `#F8FAFC` (Slate 50) and `#CBD5E1` (Slate 300)
- **Typography & Font Optimization**: Configured Google Fonts `Inter` for body/headings and `JetBrains Mono` for analytics/mono elements with zero layout shift.
- **Supabase SSR Foundation**:
  - `src/lib/supabase/client.ts`: Browser client for Client Components.
  - `src/lib/supabase/server.ts`: Server client with Next.js cookie handling.
  - `src/lib/supabase/middleware.ts`: Middleware session refresh helper.
  - `src/middleware.ts`: Edge middleware to refresh authentication tokens seamlessly across incoming requests.
- **Authentication & Validation**:
  - `src/lib/validations/auth.ts`: Zod schemas for registration, login, and profile updates.
  - `src/app/api/v1/auth/callback/route.ts`: Auth code exchange endpoint for Supabase Auth.
  - `src/app/(auth)/login/page.tsx`: Anonymous login screen.
  - `src/app/(auth)/register/page.tsx`: Anonymous registration screen with username handling.
- **UI Components & Layout**:
  - `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`.
  - `src/components/shared/Header.tsx`: Responsive top header with brand and auth state.
  - `src/app/(main)/page.tsx`: Minimal, fast-loading landing page explaining Eside in under 10 seconds.
- **Documentation**:
  - `project-state.md`: Progress tracking for completed milestones.
  - `knowledge/M1-foundation-and-auth-setup.md`: Comprehensive rebuild guide and architectural breakdown.
