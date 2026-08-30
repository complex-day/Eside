# Milestone 1: Foundation, Styling & Supabase Auth Setup

## 1. What Was Built
Milestone 1 establishes the baseline technical architecture and user foundation for the Eside platform. Specifically:
- **Next.js Monolith Setup**: Next.js App Router (version 14) configured with React 18 and strict TypeScript compiler settings.
- **Tailwind CSS & Design Tokens**: Full design token configuration according to the Eside design specification (`#4F46E5` Indigo, `#06B6D4` Cyan, `#0F172A` Slate-900 background, `#1E293B` Slate-800 surface cards).
- **Typography Integration**: Non-render-blocking Google Fonts (`Inter` for body/headings, `JetBrains Mono` for code and metrics).
- **shadcn/ui Component Primitives**: Pre-built accessible components (`Button`, `Card`, `Input`, `Label`) using Radix UI primitives and Tailwind merge (`cn` utility).
- **Supabase SSR Client & Server Integration**: Configured `@supabase/ssr` with separate browser and server client constructors supporting Next.js App Router cookie handling.
- **Edge Middleware Session Sync**: Root Next.js middleware refreshing Supabase Auth JWTs on every incoming request.
- **Authentication Routes & Form Validation**: Zod-validated Login (`/login`) and Anonymous Registration (`/register`) forms with username metadata support and email callback handler (`/api/v1/auth/callback`).
- **Minimal Landing Page**: A fast (<10s value proposition) landing page showing Eside's core features (Safe Anonymity, Outcome Timelines, Collective Insights) and foundation status.

---

## 2. Why It Was Built
1. **Rule 1 & Rule 3 (MVP First & Monolithic Simplicity)**: Starting with a single Next.js monolith prevents unnecessary microservice complexity while delivering SSR, client components, and API route handlers in one cohesive codebase.
2. **Rule 4 & Rule 8 (Modern Stack & Mobile First)**: Tailwind CSS and shadcn/ui allow rapid, accessible, mobile-first design without heavy runtime overhead.
3. **Rule 5 (Strict Type Safety)**: Configuring `"strict": true` and `"noImplicitAny": true` in `tsconfig.json` ensures that all future code written by developers or AI agents is type-safe.
4. **Rule 11 (Supabase Auth)**: Standardizing on Supabase Auth eliminates the security liability of building custom authentication or storing manual password hashes.

---

## 3. Architecture Decisions

### App Router vs Pages Router
- **Decision**: Next.js App Router (`src/app/`).
- **Rationale**: Built-in Server Components reduce client-side bundle size, improve First Contentful Paint (FCP), and allow server-side data fetching directly from Supabase without exposing secret database connection parameters to browser clients.

### `@supabase/ssr` Cookie Synchronization
- **Decision**: Use `@supabase/ssr` instead of legacy `@supabase/auth-helpers-nextjs`.
- **Rationale**: `@supabase/ssr` provides granular `getAll()` and `setAll()` cookie methods that align with Next.js 14+ cookie boundaries. Combined with edge middleware (`src/middleware.ts`), authentication tokens are refreshed seamlessly across server and client boundaries.

### Design Tokens as CSS Variables
- **Decision**: Map Tailwind colors to HSL CSS variables in `globals.css` with a default dark theme (`#0F172A`).
- **Rationale**: Enables seamless palette adjustments, high-contrast accessibility compliance, and unified theme synchronization across shadcn/ui and custom components.

---

## 4. Alternatives Considered

| Approach | Considered | Selected | Rationale |
| :--- | :--- | :--- | :--- |
| **Authentication** | NextAuth / Auth0 | **Supabase Auth** | Supabase Auth integrates directly with PostgreSQL Row Level Security (RLS) policies, minimizing token translation layers. |
| **Component Library** | Material UI / Chakra UI | **shadcn/ui + Tailwind** | No runtime CSS-in-JS performance penalty; full source code ownership in `src/components/ui`. |
| **Form Handling** | Uncontrolled forms / Formik | **React Hook Form + Zod** | Minimal re-renders, strongly typed schema validation, zero boilerplate. |

---

## 5. Failure Scenarios & Troubleshooting

### 1. `Auth session missing in Server Component`
- **Symptom**: User logs in on the client, but server components still see `user = null`.
- **Cause**: Cookies were not passed or middleware did not refresh the session.
- **Fix**: Ensure `src/middleware.ts` runs on all routes (excluding static assets) and `src/lib/supabase/server.ts` correctly invokes `cookies().getAll()`.

### 2. `Invalid Login Credentials / Connection Refused`
- **Symptom**: Supabase returns `Failed to fetch` or `Invalid API key`.
- **Cause**: Placeholder keys in `.env.local`.
- **Fix**: Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` with real keys from your Supabase Dashboard (`Project Settings -> API`).

---

## 6. Common Bugs to Avoid
- **Never mutate cookies directly inside Server Components**: In Next.js App Router, `cookies().set()` can only be called from Server Actions, Route Handlers, or Middleware. Attempting to set cookies in a Server Component will throw an error.
- **Index Signature Access with Strict TypeScript**: When `"noPropertyAccessFromIndexSignature": true` is enabled in `tsconfig.json`, fields on index signature types like Supabase's `user.user_metadata` (`{ [key: string]: any }`) must be accessed using bracket notation `user_metadata?.["username"]` rather than dot notation `user_metadata?.username`.
- **Do not expose secret role keys**: Only use `NEXT_PUBLIC_SUPABASE_ANON_KEY` on client-accessible files. The `service_role` key must never be prefixed with `NEXT_PUBLIC_`.

---

## 7. Files Created

```text
├── package.json                          # Scripts & dependencies
├── tsconfig.json                         # Strict TypeScript configuration
├── tailwind.config.ts                    # Design tokens & color mapping
├── postcss.config.mjs                    # PostCSS configuration
├── components.json                       # shadcn/ui configuration
├── next.config.mjs                       # Next.js configuration
├── .env.example                          # Environment variable template
├── .env.local                            # Local development environment keys
├── docs/changelog.md                     # Project changelog
├── project-state.md                      # Milestone tracker
├── src/
│   ├── middleware.ts                     # Edge middleware for session synchronization
│   ├── app/
│   │   ├── globals.css                   # Global styles & theme CSS variables
│   │   ├── layout.tsx                    # Root HTML layout with Inter/JetBrains fonts
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                # Focused auth screen layout
│   │   │   ├── login/page.tsx            # Login form
│   │   │   └── register/page.tsx         # Registration form
│   │   ├── (main)/
│   │   │   ├── layout.tsx                # Main shell layout with Header
│   │   │   └── page.tsx                  # Minimal landing page (<10s value prop)
│   │   └── api/v1/auth/callback/route.ts # Supabase Auth code-exchange endpoint
│   ├── components/
│   │   ├── shared/Header.tsx             # Brand header with auth buttons
│   │   └── ui/                           # shadcn/ui primitives (button, card, input, label)
│   ├── lib/
│   │   ├── utils.ts                      # cn() class merge helper
│   │   ├── supabase/                     # Client, Server, and Middleware Supabase constructors
│   │   └── validations/auth.ts           # Zod auth validation schemas
│   └── types/
│       ├── api.ts                        # Standard API response interfaces
│       └── auth.ts                       # Auth session & user profile types
```

---

## 8. Future Learning Topics
- **Next.js Server Actions**: Using Server Actions for form submissions with optimistic updates.
- **Supabase Row Level Security (RLS)**: Writing PostgreSQL security policies to protect user data at the database level (Milestone 2).
- **Zod Schema Inference**: Leveraging `z.infer<typeof schema>` to maintain unified client-server validation contracts.

---

## 9. How to Rebuild This Milestone From Scratch (Step-by-Step)

If you need to rebuild Milestone 1 independently without AI assistance, follow these exact steps:

### Step 1: Initialize Project Directory & Node Packages
1. Create `package.json` with dependencies (`next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss`, `clsx`, `tailwind-merge`, `zod`, `react-hook-form`, `lucide-react`).
2. Run `npm install` to install all packages.

### Step 2: Configure TypeScript Strict Mode
1. Create `tsconfig.json` with `"strict": true`, `"noImplicitAny": true`, and path alias `"@/*": ["./src/*"]`.

### Step 3: Configure Tailwind CSS & Design Tokens
1. Create `tailwind.config.ts` extending colors with Eside tokens (`indigo: #4F46E5`, `cyan: #06B6D4`, `bg: #0F172A`, `card: #1E293B`).
2. Create `postcss.config.mjs` with `tailwindcss` and `autoprefixer`.
3. Create `src/app/globals.css` with CSS variables for dark theme and `@tailwind` directives.

### Step 4: Setup Supabase SSR Utilities
1. Create `src/lib/supabase/client.ts` wrapping `@supabase/ssr` `createBrowserClient`.
2. Create `src/lib/supabase/server.ts` wrapping `@supabase/ssr` `createServerClient` with Next.js `cookies()`.
3. Create `src/lib/supabase/middleware.ts` to refresh user sessions.
4. Create `src/middleware.ts` at the root of `src/` to execute `updateSession`.

### Step 5: Build UI Primitives & Auth Screens
1. Create `src/lib/utils.ts` with `cn(...inputs: ClassValue[])`.
2. Create base UI primitives (`button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`) in `src/components/ui/`.
3. Create `src/app/layout.tsx` importing Google Fonts (`Inter`, `JetBrains Mono`).
4. Create `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` with Zod validation.
5. Create `src/app/(main)/page.tsx` with the landing page hero and feature highlights.

### Step 6: Verify Build
1. Run `npm run build` or `npm run dev`.
2. Open `http://localhost:3000` to verify that the landing page renders with the dark slate/indigo theme and auth links are operational.
