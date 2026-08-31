# Eside — Contributor & Developer Guide

Welcome to the Eside contributor handbook. This guide outlines the project setup, architectural conventions, database workflows, component patterns, and documentation rules.

---

## 1. Project Setup & Local Development

### Prerequisites
- **Node.js**: `v18.18+` or `v20.x`
- **Package Manager**: `npm`
- **Database**: Supabase PostgreSQL project (Cloud or local via Supabase CLI)

### Installation
```bash
# Clone repository
git clone https://github.com/complex-day/Eside.git
cd Eside

# Install dependencies
npm install

# Copy environment variable template
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running Locally
```bash
# Start Next.js App Router dev server
npm run dev

# Run TypeScript strict type verification
npm run type-check

# Run linter
npm run lint
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Database & Migrations Workflow

Eside maintains version-controlled SQL migrations in `supabase/migrations/`.

### Migration File Convention
Format: `000XX_action_name.sql` (sequential 5-digit prefix)
Example: `00014_add_experience_views_counter.sql`

### How to Create a New Migration
1. Create a new SQL file under `supabase/migrations/`.
2. Write reversible, idempotent DDL (use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
3. Follow the strict naming and check constraint guidelines:
   ```sql
   -- Migration: 00014_example_migration.sql
   -- Description: Adds a new feature column with check constraints
   
   ALTER TABLE public.experiences 
   ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
   ```
4. Update the consolidated `supabase/schema.sql` and down-migration `supabase/migrations/00000_down_all.sql`.
5. Update TypeScript database definitions in `src/lib/supabase/database.types.ts` to reflect schema additions.
6. Apply the migration in your Supabase SQL Editor or via CLI:
   ```bash
   npx supabase db push
   ```

---

## 3. How to Add a New API Route

All API route handlers live in `src/app/api/v1/[resource]/route.ts`.

### Rules for API Routes
- Always use the standard response envelopes (`{ success: true, data: ... }` / `{ success: false, error: ... }`).
- Validate incoming JSON payloads with **Zod**.
- Authenticate via `src/lib/supabase/server.ts`.
- Enforce strict error codes from `docs/api-contract.md`.

### Example Route Handler
```typescript
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// 1. Zod Validation Schema
const CreateBookmarkSchema = z.object({
  experience_id: z.string().uuid("Invalid experience UUID"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 2. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Login required." } },
        { status: 401 }
      );
    }

    // 3. Body Parsing & Validation
    const body = await request.json();
    const parsed = CreateBookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    // 4. Database Query (Protected by RLS)
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        experience_id: parsed.data.experience_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // Unique violation
        return NextResponse.json(
          { success: false, error: { code: "CONFLICT", message: "Already bookmarked." } },
          { status: 409 }
        );
      }
      throw error;
    }

    // 5. Standard Success Response
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}
```

---

## 4. How to Add a UI Component

### Rules for Frontend UI
- **Mobile First**: Design for `360px–430px` first; enhance for desktop second.
- **Design Tokens**: Use defined Tailwind theme tokens (Indigo `#4F46E5`, Cyan `#06B6D4`, Slate-900 `#0F172A`, Slate-800 `#1E293B`).
- **Primitives**: Place reusable primitives in `src/components/ui/` and feature components in `src/components/features/`.
- **Accessibility**: Include visible focus rings, ARIA labels, semantic elements (`<main>`, `<article>`, `<header>`), and proper keyboard navigation.

### Example Reusable Component
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface CategoryChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  isSelected?: boolean;
}

export function CategoryChip({ name, isSelected = false, className, ...props }: CategoryChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-surface-card text-muted-foreground border border-slate-700 hover:border-slate-500 hover:text-foreground",
        className
      )}
      {...props}
    >
      {name}
    </button>
  );
}
```

---

## 5. Deployment Guide

Eside is architected for deployment on **Vercel** with **Supabase Cloud**.

### Vercel Deployment Steps
1. Push your changes to GitHub:
   ```bash
   git push origin main
   ```
2. Connect your GitHub repository in the [Vercel Dashboard](https://vercel.com).
3. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your production Supabase anonymous key
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g., `https://eside.vercel.app`)
4. Click **Deploy**.
5. Ensure Supabase Auth redirect URLs include `https://your-domain.vercel.app/api/v1/auth/callback`.

---

## 6. How to Update `project-state.md`

Whenever a milestone is completed or updated:
1. Open `project-state.md`.
2. Update the **Current Status** section:
   - Move completed items to the `## Completed` list.
   - Update `## Current Milestone` and `## Next Milestone`.
   - Update `## Milestones Progress` table with the completion date.
3. Add a concise bulleted summary of completed deliverables under `## Completed Milestones Summary`.
4. Document any known issues or deployment blockers under `## Known Issues & Notes`.

---

## 7. How to Update Knowledge Documents

Per repository rules, every completed milestone must have a corresponding document in `knowledge/` (e.g., `knowledge/M1-foundation-and-auth-setup.md`, `knowledge/M2-database-schema-and-rls.md`).

### Required Knowledge Document Structure
Each document must enable the project owner to understand and rebuild the milestone without AI assistance:

```markdown
# Milestone X: [Milestone Title]

## 1. What Was Built
- Detailed list of all implemented features, modules, and configurations.

## 2. Why It Was Built
- Justifications tied directly to PRD goals, agent rules, and performance requirements.

## 3. Architecture Decisions
- Key technical decisions made and why alternatives were rejected.

## 4. Alternatives Considered
- Comparison table of candidate technologies or patterns vs the selected approach.

## 5. Failure Scenarios & Troubleshooting
- Common error messages, causes, and step-by-step resolution instructions.

## 6. Common Bugs to Avoid
- Gotchas, edge cases, and patterns to prevent future regressions.

## 7. Files Created
- ASCII directory tree of all files added or modified in the milestone.

## 8. Future Learning Topics
- Relevant concepts or advanced techniques for upcoming milestones.
```
