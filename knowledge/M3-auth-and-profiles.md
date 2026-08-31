# Milestone 3: Authentication Flow, Session Synchronization & Anonymous User Profiles

## 1. What Was Built
Milestone 3 implements the complete authentication lifecycle, Edge session synchronization, route access protection, and anonymous profile management for Eside. Specifically:
- **Authentication Lifecycle**:
  - `POST /api/v1/auth/register`: Anonymous account registration with case-insensitive uniqueness and reserved username checks.
  - `POST /api/v1/auth/login`: Credential validation against Supabase Auth with encrypted HTTP-only session cookie issuance.
  - `POST /api/v1/auth/logout`: Clean session invalidation and cookie clearance.
  - `GET /api/v1/auth/callback`: Supabase PKCE authorization code exchange for email verification and OAuth.
- **Edge Route Protection & Session Refresh**:
  - `src/middleware.ts` & `src/lib/supabase/middleware.ts`: Middleware that transparently refreshes expired session tokens and redirects unauthenticated users away from protected routes (`/profile`, `/experiences/new`, `/bookmarks`) to `/login?next=...`, while redirecting logged-in users away from auth pages.
- **Anonymous Profile Management**:
  - `GET /api/v1/profile` & `PUT /api/v1/profile`: Authenticated user profile lookup and bio/avatar customization.
  - `GET /api/v1/users/[username]`: Public anonymous profile lookup by username.
- **Profile Dashboard with 5 Lifecycle Tabs**:
  - `src/app/(main)/profile/page.tsx`: Displays **Published** (`status = 'active'`), **Drafts** (`status = 'hidden'`), **Archived** (`status = 'deleted'`), **My Outcomes** (Day 30/90/180 milestones), and **Bookmarks** (saved experiences).
  - `src/app/(main)/profile/edit/page.tsx`: Bio editor with live character counter (up to 300 characters) and avatar preview.
  - `src/app/(main)/u/[username]/page.tsx`: Public view for anonymous authors showing their shared stories and timeline updates.
- **UI Primitives & Shared Components**:
  - `src/components/ui/badge.tsx` (active, draft, archived variants).
  - `src/components/ui/tabs.tsx` (accessible profile tab navigation).
  - `src/components/ui/avatar.tsx` & `src/components/ui/skeleton.tsx`.
  - `src/components/shared/UserAvatar.tsx` (deterministic gradient silhouette renderer).
  - `src/components/shared/Header.tsx` (dynamic authenticated user menu, avatar, and logout action).

---

## 2. Why It Was Built
1. **Rule 11 (Supabase Auth)**: Standardizing on Supabase Auth eliminates custom password management risks while seamlessly binding to PostgreSQL Row Level Security (`auth.uid()`).
2. **Rule 10 & Rule 12 (Security & Authorization)**: Edge middleware prevents unauthorized access to private dashboards, and PostgreSQL RLS guarantees that only owners can update their bio or view private drafts.
3. **Rule 8 (Mobile First)**: All auth forms, tabbed dashboards, and profile views are optimized for `360px–430px` viewports first.
4. **ADR-003 (Anonymous Identity Model)**: User emails are kept strictly in `auth.users` and never stored in `public.users` or exposed in public profile responses.

---

## 3. Architecture Decisions

### 1. Database Unique Constraint as Source of Truth
- **Decision**: Avoided pre-flight username availability polling (`GET /api/v1/auth/check-username`).
- **Rationale**: Eliminates race conditions (Time-of-Check to Time-of-Use) and minimizes unnecessary database traffic. Registration handles PostgreSQL error `23505` (`idx_users_username_lower`) directly and returns a clean `409 CONFLICT` response.

### 2. Reserved Username Blocking
- **Decision**: Enforce reserved handle validation (`admin`, `moderator`, `support`, `official`, `system`, `root`, `eside`) in Zod schemas and API handlers.
- **Rationale**: Prevents malicious users from registering impersonation handles to mislead community members.

### 3. Separation of Public vs Private Profile Views
- **Decision**: Distinct routes for the user's private dashboard (`/profile`) and the public author view (`/u/[username]`).
- **Rationale**: `/profile` displays private drafts, archived items, and saved bookmarks, whereas `/u/[username]` only queries published active experiences.

---

## 4. Alternatives Considered

| Approach | Considered | Selected | Rationale |
| :--- | :--- | :--- | :--- |
| **Username Availability** | Debounced polling endpoint on keystroke | **Database constraint check on submit** | Eliminates race conditions and reduces unnecessary API load. |
| **Avatar Storage** | Mandatory file upload to Supabase Storage | **Deterministic gradient avatars** | Preserves anonymity, removes image moderation liability, and eliminates storage costs for MVP. |
| **Session Handling** | LocalStorage JWT tokens | **HTTP-only cookies via `@supabase/ssr`** | Immune to client-side XSS token theft. |

---

## 5. Failure Scenarios & Troubleshooting

### 1. `409 Conflict: Username is already taken`
- **Symptom**: Registration form displays "Username is already taken. Please choose another handle."
- **Cause**: Another account exists with the same username in a different letter casing.
- **Fix**: User selects a different anonymous handle.

### 2. `Redirect loop on /profile`
- **Symptom**: User logs in but gets immediately redirected back to `/login?next=/profile`.
- **Cause**: Middleware failed to refresh session cookies or `.env.local` Supabase keys are mismatched.
- **Fix**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` match the active Supabase project.

---

## 6. Common Bugs to Avoid
- **Never expose user emails in API responses**: When querying `public.users`, ensure the query explicitly selects only `id, username, avatar_url, bio, created_at`.
- **Remember the `next` search parameter on login redirect**: When unauthenticated users attempt to access a protected page, capture `next=${encodeURIComponent(pathname)}` so they return to their intended destination immediately after signing in.

---

## 7. Files Created

```text
├── src/
│   ├── lib/
│   │   └── validations/
│   │       └── auth.ts                          # Updated with reserved username rules
│   ├── components/
│   │   ├── ui/
│   │   │   ├── badge.tsx                        # [NEW] Status badge primitive
│   │   │   ├── tabs.tsx                         # [NEW] Tab navigation primitive
│   │   │   ├── avatar.tsx                       # [NEW] Avatar primitive
│   │   │   └── skeleton.tsx                     # [NEW] Skeleton loading primitive
│   │   └── shared/
│   │       ├── Header.tsx                       # Dynamic auth menu & logout
│   │       └── UserAvatar.tsx                   # [NEW] Deterministic avatar component
│   └── app/
│       ├── (auth)/
│       │   ├── login/page.tsx                   # Login form with next param
│       │   ├── register/page.tsx                # Registration form with conflict handling
│       │   └── verify-email/page.tsx            # [NEW] Verification pending view
│       ├── (main)/
│       │   ├── layout.tsx                       # Main layout with user session injection
│       │   ├── page.tsx                         # Landing page updated for M3
│       │   ├── profile/
│       │   │   ├── page.tsx                     # [NEW] Profile dashboard with 5 tabs
│       │   │   └── edit/page.tsx                # [NEW] Bio editor
│       │   └── u/[username]/page.tsx            # [NEW] Public anonymous author view
│       └── api/
│           └── v1/
│               ├── auth/
│               │   ├── register/route.ts        # [NEW] Registration API handler
│               │   ├── login/route.ts           # [NEW] Login API handler
│               │   └── logout/route.ts          # [NEW] Logout API handler
│               ├── profile/route.ts             # [NEW] Current user profile GET/PUT
│               └── users/[username]/route.ts    # [NEW] Public profile GET
├── docs/changelog.md                            # Updated with M3 changes
├── project-state.md                             # Updated with M3 completion
└── knowledge/
    └── M3-auth-and-profiles.md                  # Milestone 3 knowledge artifact
```

---

## 8. Future Learning Topics
- **OAuth / Social Logins (Post-MVP)**: Adding Google / GitHub OAuth while preserving anonymous handle selection on first sign-in.
- **Multi-Factor Authentication (MFA)**: Supabase Auth TOTP for administrative accounts.
