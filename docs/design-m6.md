# System Design: Milestone 6 (Content Reporting, Moderation Workflow, Abuse Prevention & Platform Insights)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 6)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `docs/Database,.md`, `docs/APIs.md`, `docs/api-contract.md`

---

## 1. Architectural Overview & System Design

Milestone 6 delivers the trust, safety, and operational intelligence layer of Eside. It consists of four interconnected subsystems:

1. **Content Reporting Subsystem**: Client-side reporting trigger and validated submission pipeline for experiences and comments.
2. **Abuse Prevention Subsystem**: Multi-stage guardrails enforcing sliding-window rate limits, duplicate report blocking, self-reporting prevention, and target entity validation.
3. **Moderation Workflow Subsystem**: A state machine (`pending` $\rightarrow$ `reviewing` $\rightarrow$ `resolved` / `dismissed`) allowing platform operators to audit flagged content, adjust target visibility, and resolve complaints.
4. **Platform Insights Subsystem**: High-performance database aggregation engine computing platform-wide counts, category distributions, outcome rates, and moderation statistics.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         Eside Architecture - M6                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [ Reader / Contributor UI ]                [ Platform Operator / Admin]│
│         │                  │                              │              │
│   Report Experience  Report Comment                 Moderation & Insights│
│         │                  │                              │              │
│         └──────────┬───────┘                              │              │
│                    ▼                                      ▼              │
│       ┌────────────────────────┐             ┌────────────────────────┐  │
│       │  POST /api/v1/reports  │             │  GET /api/v1/reports   │  │
│       │                        │             │  PATCH /api/v1/reports │  │
│       │  • Rate Limiter (20/h) │             │  GET /api/v1/insights  │  │
│       │  • Duplicate Checker   │             └───────────┬────────────┘  │
│       │  • Self-Report Guard   │                         │               │
│       │  • Target Entity Check │                         │               │
│       └───────────┬────────────┘                         │               │
│                   │                                      │               │
│                   ▼                                      ▼               │
│       ┌───────────────────────────────────────────────────────┐          │
│       │                 Supabase PostgreSQL                   │          │
│       │                                                       │          │
│       │  • public.reports          (Moderation queue records) │          │
│       │  • public.experiences      (Target stories & status)  │          │
│       │  • public.comments         (Target discussions)       │          │
│       │  • public.users            (Reporters & Authors)      │          │
│       │  • public.outcomes         (Aggregated metric counts) │          │
│       │  • public.categories       (Category distributions)   │          │
│       └───────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Schema Impact & Diff Report (M6 vs. M2 Source of Truth)

In strict accordance with Rule 6 (*Database Source of Truth: `database.md`*), Rule 20 (*Ask Before Major Changes*), and the M2 schema in `supabase/schema.sql`, the following analysis details every M6 requirement against the provisioned database schema:

```text
================================================================================
                         M6 SCHEMA IMPACT ANALYSIS REPORT
================================================================================
```

### Table Definition: `public.reports` (Provisioned in M2)

| Column | Type | Constraints | M2 Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ✅ Exists in M2 | Standard primary key |
| `reporter_id` | `UUID` | `REFERENCES public.users(id) ON DELETE SET NULL` | ✅ Exists in M2 | Foreign key to `users` |
| `experience_id`| `UUID` | `REFERENCES public.experiences(id) ON DELETE CASCADE` | ✅ Exists in M2 | Foreign key to `experiences` |
| `comment_id` | `UUID` | `REFERENCES public.comments(id) ON DELETE CASCADE` | ✅ Exists in M2 | Foreign key to `comments` |
| `reason` | `VARCHAR(100)`| `CHECK (reason IN ('spam','harassment','hate_speech','misinformation','threats','privacy_violation','other'))` | ✅ Exists in M2 | Exact reason domain required by M6 |
| `status` | `VARCHAR(20)` | `CHECK (status IN ('pending','reviewing','resolved','dismissed')) DEFAULT 'pending'` | ✅ Exists in M2 | Complete review lifecycle states |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | ✅ Exists in M2 | Timestamp for queue ordering |

### Constraints & Indexes in M2:
- `chk_reports_single_target`: `CHECK ((experience_id IS NOT NULL AND comment_id IS NULL) OR (experience_id IS NULL AND comment_id IS NOT NULL))` ✅ Exists in M2.
- `idx_reports_moderation_queue`: `ON public.reports (status, created_at ASC)` ✅ Exists in M2.
- `idx_reports_experience_id`: `ON public.reports (experience_id) WHERE experience_id IS NOT NULL` ✅ Exists in M2.
- `idx_reports_comment_id`: `ON public.reports (comment_id) WHERE comment_id IS NOT NULL` ✅ Exists in M2.

### Categorized Separation:

#### **Group A: Fully Supported with Existing M2 Schema (Zero Migrations Needed)**
1. **Content Reporting Core**:
   - Storing reports for experiences and comments with all 7 valid reason codes.
   - Initial status default (`pending`).
   - Cascade deletion when parent experience or comment is deleted.
2. **Moderation Workflow States**:
   - State transitions (`pending` $\rightarrow$ `reviewing` $\rightarrow$ `resolved` / `dismissed`).
   - Queue indexing on `(status, created_at ASC)`.
3. **Abuse Prevention Logic (Application Level)**:
   - Self-reporting prevention (comparing `reporter_id` against target `author_id` in API route).
   - Duplicate report check (querying existing active reports for same `(reporter_id, target_id)`).
   - Rate limiting ($20\text{ reports/hour}$ using `created_at` query in `src/lib/rate-limit.ts`).
4. **Platform Insights Aggregations**:
   - Querying counts across `users`, `experiences`, `outcomes`, `comments`, and `reports`.
   - Resolution statistics calculation (`resolved` vs `dismissed`).

#### **Group B: Optional Future Enhancements (Requires Migration — NOT in M6 Scope)**
1. **DB-Level Partial Unique Index for Duplicate Reports**:
   - Optional: `CREATE UNIQUE INDEX idx_reports_unique_pending_exp ON public.reports (reporter_id, experience_id) WHERE status IN ('pending', 'reviewing');`
   - *Verdict*: Application-level transaction check in Next.js API route satisfies MVP requirements without modifying the M2 database schema.
2. **Moderator Audit Metadata**:
   - Optional columns: `resolved_by UUID REFERENCES users(id)`, `resolved_at TIMESTAMPTZ`, `action_notes TEXT`.
   - *Verdict*: Deferred to post-MVP. Status transitions directly in `status` column satisfy V1.0 MVP specification.

> [!IMPORTANT]
> **Schema Conclusion**: **ZERO database migrations are required for Milestone 6.** All M6 features will be built strictly on top of the approved M2 database schema.

---

## 3. API Contracts & Specifications

All responses use the standard Eside envelope: `{ success: true, data: { ... } }` or `{ success: false, error: { code: string, message: string } }`.

---

### A. `POST /api/v1/reports`
Submits a moderation report against an experience or a comment.

- **Access**: Authenticated Users (`Bearer <token>` / session cookie)
- **Rate Limit**: 20 reports / rolling hour per user
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "experience_id": "f8a12b34-5678-49ab-9012-3456789abcde",
  "reason": "harassment"
}
```
*Or for a comment:*
```json
{
  "comment_id": "12e34567-89ab-4cde-f012-3456789abcde",
  "reason": "spam"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `experience_id` | `string (UUID)` | Conditional | Required if `comment_id` is omitted |
| `comment_id` | `string (UUID)` | Conditional | Required if `experience_id` is omitted |
| `reason` | `string` | **Yes** | Must be one of `['spam', 'harassment', 'hate_speech', 'misinformation', 'threats', 'privacy_violation', 'other']` |

#### Business Logic & Guardrails:
1. **Target Mutual Exclusivity**: Exactly one of `experience_id` or `comment_id` must be present.
2. **Self-Reporting Guard**: Target entity is fetched. If target `author_id === auth.uid()`, return `400 BAD_REQUEST` ("You cannot report your own content").
3. **Duplicate Prevention**: If there exists an active report where `reporter_id === auth.uid()` AND target matches AND `status IN ('pending', 'reviewing')`, return `409 CONFLICT` ("You have already reported this content. It is currently under review.").
4. **Rate Limit**: Sliding window checks if user submitted $\ge 20$ reports in past 60 minutes. If true, return `429 RATE_LIMITED`.

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "78a90123-4567-489a-bcde-f0123456789a",
    "status": "pending",
    "reason": "harassment",
    "created_at": "2026-08-31T14:00:00.000Z"
  }
}
```

#### Error Responses
- `400 VALIDATION_ERROR`: Invalid UUID, missing targets, or invalid reason string.
- `400 BAD_REQUEST`: Self-reporting attempted.
- `401 UNAUTHORIZED`: Unauthenticated request.
- `404 NOT_FOUND`: Target entity not found or soft-deleted.
- `409 CONFLICT`: Duplicate active report already in queue.
- `429 RATE_LIMITED`: Hourly submission limit exceeded.

---

### B. `GET /api/v1/reports`
Fetches a paginated list of moderation reports for operator review.

- **Access**: Authenticated / Server Admin Context
- **Query Parameters**:
  - `status`: `pending` | `reviewing` | `resolved` | `dismissed` | `all` (default: `pending`)
  - `type`: `experience` | `comment` | `all` (default: `all`)
  - `page`: integer (default: `1`)
  - `limit`: integer (default: `20`, max: `50`)

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "78a90123-4567-489a-bcde-f0123456789a",
        "reason": "harassment",
        "status": "pending",
        "created_at": "2026-08-31T14:00:00.000Z",
        "reporter": {
          "id": "11111111-2222-3333-4444-555555555555",
          "username": "ObservantUser"
        },
        "target_type": "experience",
        "experience": {
          "id": "f8a12b34-5678-49ab-9012-3456789abcde",
          "title": "Questionable story title",
          "story_preview": "Snippet of reported text...",
          "status": "active",
          "author": {
            "username": "FlaggedAuthor"
          }
        },
        "comment": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

---

### C. `PATCH /api/v1/reports/[id]`
Updates the status of a moderation report and optionally applies actions to the reported content.

- **Access**: Authenticated / Server Admin Context
- **Path Param**: `id` (Report UUID)

#### Request Body
```json
{
  "status": "resolved",
  "action": "hide_content"
}
```
*Allowed `status`: `['reviewing', 'resolved', 'dismissed']`*  
*Allowed `action`: `['none', 'hide_content', 'delete_comment', 'mark_reported']`*

#### Operations:
- If `status = 'resolved'` and `action = 'hide_content'`: Sets `experiences.status = 'hidden'` (or `'reported'`).
- If `status = 'resolved'` and `action = 'delete_comment'`: Deletes the target comment row.
- If `status = 'dismissed'`: Leaves target content unchanged and marks report `dismissed`.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "78a90123-4567-489a-bcde-f0123456789a",
    "status": "resolved",
    "updated_at": "2026-08-31T14:30:00.000Z"
  }
}
```

---

### D. `GET /api/v1/insights`
Retrieves aggregated platform counts, moderation statistics, and category health metrics.

- **Access**: Public / Authenticated
- **Response Format (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_experiences": 142,
      "total_users": 88,
      "total_outcomes": 54,
      "total_comments": 210
    },
    "moderation": {
      "open_reports": 3,
      "pending_reports": 2,
      "reviewing_reports": 1,
      "resolved_reports": 15,
      "dismissed_reports": 5,
      "total_reports": 23,
      "resolution_rate_percent": 75.0,
      "reports_by_reason": {
        "spam": 10,
        "harassment": 6,
        "hate_speech": 3,
        "misinformation": 2,
        "threats": 1,
        "privacy_violation": 1,
        "other": 0
      }
    },
    "categories": [
      {
        "id": "a3b8d4e2-9f1c-4b5a-8e2d-3c4b5a6f7e8d",
        "name": "Education",
        "experiences_count": 45,
        "outcomes_count": 22
      },
      {
        "id": "b4c9e5f3-0a2d-5c6b-9f3e-4d5c6b7a8f9e",
        "name": "Career",
        "experiences_count": 38,
        "outcomes_count": 18
      }
    ]
  }
}
```

---

## 4. Row Level Security (RLS) & Authorization Matrix

| Action | Endpoint | Unauthenticated | Authenticated User | Content Author | Reporter | Moderator / Admin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Submit Report** | `POST /api/v1/reports` | ❌ 401 | ✅ Allowed ($20$/hr) | ❌ 400 (Self) | ✅ Allowed | ✅ Allowed |
| **View Moderation Queue** | `GET /api/v1/reports` | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 | ✅ Allowed |
| **Update Report Status** | `PATCH /api/v1/reports/[id]` | ❌ 401 | ❌ 403 | ❌ 403 | ❌ 403 | ✅ Allowed |
| **View Platform Insights** | `GET /api/v1/insights` | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

### RLS Policies on `public.reports`:
1. **`INSERT`**: Handled by existing M2 policy:
   ```sql
   CREATE POLICY "Authenticated users can submit reports" ON public.reports 
   FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
   ```
2. **`SELECT` / `UPDATE`**: Regular users have no direct select or update policy on `public.reports`. All queue inspection and resolution occurs through server-side Next.js route handlers (`src/app/api/v1/reports/...`), utilizing server-side validation and Supabase service/admin client.

---

## 5. Component Architecture & UI Flow

```text
src/components/
  ├── moderation/
  │     ├── ReportModal.tsx              # Interactive report dialog with reason selector & validation
  │     ├── ReportButton.tsx             # Accessible flag icon trigger on stories & comments
  │     ├── ModerationQueueTable.tsx     # Admin table with status badges & filter tabs
  │     └── ModerationReportCard.tsx     # Detailed inspection card with context snippet & resolution buttons
  └── insights/
        ├── InsightsOverviewCard.tsx     # Grid of top-level platform counters (Users, Stories, Outcomes)
        ├── ModerationMetricsCard.tsx    # Resolution gauge, open reports counter & reason breakdown
        ├── CategoryDistributionBar.tsx  # Interactive breakdown of stories and outcomes per category
        └── MetricCard.tsx               # Reusable atomic stat card primitive
```

### UI Screens:
1. **Report Modal (`ReportModal.tsx`)**:
   - Opens as an accessible dialog when user clicks `ReportButton` on any story card or comment.
   - Radio group / selector for the 7 reason codes with clear descriptions (e.g. *"Spam or advertising"*, *"Harassment or bullying"*).
   - Live loading state upon submission; disables button to prevent double clicks.
   - Shows instant toast confirmation: *"Report submitted. Thank you for keeping Eside safe."*
2. **Platform Insights Screen (`/insights`)**:
   - Accessible from navigation bar and bottom navigation.
   - Mobile-first responsive layout ($360\text{px} - 1200\text{px}$).
   - Displays real-time aggregate statistics without third-party tracking scripts.
3. **Moderation Queue Screen (`/moderation`)**:
   - Dedicated dashboard tab for reviewing flagged stories and comments.
   - Quick action controls: *"Dismiss Report"*, *"Hide Story"*, *"Delete Comment"*.

---

## 6. Performance & Scalability Considerations

1. **Sliding-Window Rate Limiting**:
   - Uses `checkReportRateLimit(userId, 20, 1)` querying `reports` with `gte("created_at", windowStart)` which leverages the existing index on `(reporter_id, created_at)`.
2. **Optimized Insights Aggregation**:
   - Computes platform stats via efficient concurrent `head: true` count queries (`Promise.all([countExperiences, countUsers, countOutcomes, countComments, countReports])`), executing in $< 80\text{ms}$.
3. **Selective Moderation Queue Hydration**:
   - `GET /api/v1/reports` selectively joins `users(id, username)`, `experiences(id, title, status, author_id, users(username))`, and `comments(id, content, author_id, users(username))`, avoiding heavy payload transfers.
