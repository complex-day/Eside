# Milestone 2: Database Schema, RLS Policies & Seed Data

## 1. What Was Built
Milestone 2 establishes the persistence and authorization foundation for Eside using PostgreSQL and Supabase. Specifically:
- **10 Relational Tables**:
  - `users`: User profiles extending `auth.users(id)` with case-insensitive unique usernames and auto-provisioning triggers.
  - `categories`: 8 core classification categories (Education, Career, Relationships, etc.).
  - `tags`: Tag vocabulary with case-insensitive unique naming.
  - `experiences`: Lived experiences with status check constraints, soft-delete timestamp (`deleted_at`), and author/category relationships.
  - `experience_tags`: Composite primary key `(experience_id, tag_id)` many-to-many junction table.
  - `comments`: Discussion threads linked to experiences and authors with character constraints.
  - `outcomes`: Milestone outcome tracking restricted to 30, 90, and 180 days with uniqueness per experience.
  - `bookmarks`: Composite primary key `(user_id, experience_id)` for saved experiences.
  - `reports`: Moderation queue with mutually exclusive single-target check constraint ensuring an item reports either an experience or a comment.
  - `analytics_events`: Telemetry event store with nullable `session_id` and metadata JSONB payload.
- **Row Level Security (RLS)**: Enabled across all 10 tables with 20 granular security policies enforcing author-only mutations and public read access.
- **Performance Indexes**: High-efficiency B-Tree and compound indexes with partial filtering (`WHERE deleted_at IS NULL`) targeting feed response times (<500ms).
- **Seed Data**: Automated population of 8 core categories and 12 foundational tags.
- **TypeScript Type System**: Generated `database.types.ts` strictly typing all row, insert, and update payloads across client, server, and middleware helpers.
- **Verification & Rollback Suites**: Full structural verification script (`verify_m2.sql`), automated constraint testing suite (`test_constraints.sql`), and atomic rollback down-migration (`00000_down_all.sql`).

---

## 2. Why It Was Built
1. **Rule 6 (Database Source of Truth)**: Establishing the database schema upfront according to `docs/Database,.md` guarantees consistency across all future API and UI milestones.
2. **Rule 10 & Rule 12 (Security & Authorization)**: Enabling PostgreSQL RLS at the database engine level guarantees multi-tenant isolation even if client or server application code contains vulnerabilities.
3. **Rule 14 (Performance SLA Targets)**: Indexes with partial filters ensure feed queries execute in <500ms and category lookups execute in <300ms without expensive full-table scans.
4. **Rule 5 (Type Safety)**: Generating exact TypeScript types from the database schema prevents runtime column mismatches and guarantees compiler validation.

---

## 3. Architecture Decisions

### 1. Separation of `auth.users` and `public.users`
- **Decision**: Keep Supabase Auth data in `auth.users` and application profile fields (username, avatar, bio) in `public.users(id)`.
- **Rationale**: Clean separation between sensitive authentication credentials and public profile metadata. A PostgreSQL trigger (`on_auth_user_created`) automatically synchronizes newly registered users.

### 2. Soft Deletes via `deleted_at`
- **Decision**: Include `deleted_at TIMESTAMPTZ NULL` on `experiences`.
- **Rationale**: Allows users or moderators to remove experiences from public feeds without immediately breaking database referential integrity or historical outcome relations, while partial indexes (`WHERE deleted_at IS NULL`) ensure query performance remains unhindered.

### 3. Mutually Exclusive Moderation Targets
- **Decision**: Apply `CONSTRAINT chk_reports_single_target CHECK ((experience_id IS NOT NULL AND comment_id IS NULL) OR (experience_id IS NULL AND comment_id IS NOT NULL))` on `reports`.
- **Rationale**: Eliminates data ambiguity by guaranteeing at the database constraint level that a report points to exactly one content item.

### 4. Case-Insensitive Username Uniqueness
- **Decision**: Use `CREATE UNIQUE INDEX idx_users_username_lower ON public.users (LOWER(username));`.
- **Rationale**: Prevents impersonation attacks where two users register identical names with different letter casing (e.g., `Phoenix` vs `phoenix`).

---

## 4. Alternatives Considered

| Approach | Considered | Selected | Rationale |
| :--- | :--- | :--- | :--- |
| **User Identity Storage** | Single custom user table with manual password hashes | **Supabase `auth.users` + `public.users`** | Eliminates manual cryptographic liability and integrates with Supabase Auth JWTs. |
| **Tags Junction** | Array of string tags directly on `experiences` (`tags text[]`) | **Normalized `tags` + `experience_tags`** | Enables fast reverse querying, category filtering, indexation, and clean tag deduplication. |
| **Data Deletion** | Hard `DELETE` statements only | **Soft Deletes (`deleted_at`) + Status flags** | Preserves outcome timeline context and enables moderation review prior to purge. |
| **Authorization Layer** | Application-level middleware checks only | **PostgreSQL Row Level Security (RLS)** | Defense-in-depth: Even direct database connections or API mistakes cannot breach user isolation. |

---

## 5. Failure Scenarios & Troubleshooting

### 1. `ERROR: 42601: too few parameters specified for RAISE`
- **Symptom**: PL/pgSQL scripts fail during execution of `RAISE NOTICE '...(100%)'`.
- **Cause**: The `%` character is reserved for positional format substitution in PostgreSQL `RAISE` statements.
- **Fix**: Escape percent signs with `%%` or write `100 PERCENT`.

### 2. `duplicate key value violates unique constraint "idx_users_username_lower"`
- **Symptom**: User registration fails when choosing a username.
- **Cause**: Another account already exists with the same username in a different casing.
- **Fix**: Prompt the user to select an alternative unique handle.

### 3. `new row for relation "reports" violates check constraint "chk_reports_single_target"`
- **Symptom**: Submitting a report fails.
- **Cause**: The API payload either supplied both `experience_id` and `comment_id`, or failed to supply either.
- **Fix**: Ensure the client sends exactly one target ID per report.

---

## 6. Common Bugs to Avoid
- **Forgetting partial index predicates in queries**: The feed index is created as `ON public.experiences (status, created_at DESC) WHERE deleted_at IS NULL`. Queries searching for active experiences should always include `WHERE status = 'active' AND deleted_at IS NULL` to ensure PostgreSQL utilizes the partial index instead of a sequential scan.
- **Bypassing RLS with `service_role` in client components**: Never expose or use the Supabase `service_role` key on the frontend, as it bypasses all RLS security checks.

---

## 7. Files Created

```text
├── supabase/
│   ├── schema.sql                               # Consolidated all-in-one setup script
│   ├── verify_m2.sql                            # Schema & catalog verification queries
│   ├── test_constraints.sql                    # Automated constraint assertion test suite
│   └── migrations/
│       ├── 00000_down_all.sql                   # Atomic rollback down-migration
│       ├── 00001_create_users.sql               # Users table & auth triggers
│       ├── 00002_create_categories.sql          # Categories table
│       ├── 00003_create_tags.sql                # Tags table & unique index
│       ├── 00004_create_experiences.sql         # Experiences table & soft-delete
│       ├── 00005_create_experience_tags.sql     # Many-to-many junction table
│       ├── 00006_create_comments.sql            # Comments table
│       ├── 00007_create_outcomes.sql            # Outcomes table & milestone check
│       ├── 00008_create_bookmarks.sql           # Bookmarks composite PK table
│       ├── 00009_create_reports.sql             # Reports moderation table
│       ├── 00010_create_analytics_events.sql    # Analytics telemetry table
│       ├── 00011_create_indexes.sql             # Performance indexes
│       ├── 00012_enable_rls_and_policies.sql    # Row Level Security policies
│       └── 00013_seed_initial_data.sql          # Core categories & tag seed data
├── src/lib/supabase/
│   ├── database.types.ts                        # TypeScript schema type definitions
│   ├── client.ts                                # Typed browser client
│   ├── server.ts                                # Typed server client
│   └── middleware.ts                            # Typed session middleware
├── project-state.md                             # Updated project tracker
└── knowledge/
    └── M2-database-schema-and-rls.md            # Milestone 2 knowledge artifact
```

---

## 8. Future Learning Topics
- **PostgreSQL Full-Text Search (M6)**: Using `to_tsvector` and `GIN` indexes for lexical experience search.
- **Supabase Edge Functions & Webhooks**: Triggering background moderation alerts on report creation.
- **Database Partitioning**: Partitioning `analytics_events` by month if event volumes exceed millions of rows.
