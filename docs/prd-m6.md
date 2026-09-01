# PRD: Milestone 6 (Content Reporting, Moderation Workflow, Abuse Prevention & Platform Insights)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 6)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `docs/Database,.md`, `docs/APIs.md`

---

## 1. Problem Statement

An anonymous experience-sharing and outcome-learning platform requires robust content integrity, psychological safety, and community trust. Without protective guardrails:
1. **Malicious or Harmful Content**: Spam, harassment, hate speech, threats, and privacy violations could degrade platform safety and deter vulnerable individuals from sharing authentic lived experiences.
2. **Abuse of Reporting Tools**: Bad actors could flood the system with false reports, harass specific contributors, or report their own content to manipulate visibility.
3. **Lack of Operational Visibility**: Without aggregated platform insights and moderation metrics, platform operators cannot monitor safety trends, community health, outcome resolution rates, or open report volumes.

**Milestone 6 Solution**:
- **Content Reporting Engine**: A unified reporting mechanism allowing authenticated readers to flag experiences or comments with standardized reason categories, while strictly preventing authors from reporting their own content.
- **Moderation Workflow**: A lifecycle management system for reports (`pending` $\rightarrow$ `reviewing` $\rightarrow$ `resolved` / `dismissed`) enabling structured review and resolution.
- **Abuse & Spam Prevention**: Multi-layered protection including sliding-window rate limiting ($20\text{ reports/hour}$ per user), duplicate report detection, and strict payload validation.
- **Platform Insights**: Aggregated metrics dashboard exposing total experiences, outcomes, users, open moderation queue volumes, and report resolution distributions without introducing third-party analytics bloat.

---

## 2. User Stories

### A. Content Reporting
1. **As an Authenticated Reader**, I want to flag an experience or comment that violates community guidelines (e.g. spam, harassment, hate speech) so that platform moderators can review and take action.
2. **As an Authenticated Reader**, I want to choose a specific reason code (`spam`, `harassment`, `hate_speech`, `misinformation`, `threats`, `privacy_violation`, `other`) so that moderators understand why the content was reported.
3. **As an Experience or Comment Author**, I should be prohibited from reporting my own content, ensuring the reporting tool cannot be misused for self-sabotage or vanity testing.
4. **As an Anonymous Visitor**, I want to see clear community guidelines and be prompted to authenticate if I attempt to file a report.

### B. Moderation Workflow
5. **As a Moderator / Admin**, I want to view a centralized moderation queue displaying all reports ordered by creation time (`created_at ASC`), filterable by status (`pending`, `reviewing`, `resolved`, `dismissed`) and entity type (`experience` vs `comment`).
6. **As a Moderator / Admin**, I want to inspect the reported content in context (title, story snippet, or comment text, author handle, report reason, and reporter handle).
7. **As a Moderator / Admin**, I want to transition a report to `reviewing`, `resolved`, or `dismissed`, with the option to update the target experience status (e.g., to `reported` or `hidden`) or remove offending comments.

### C. Abuse Prevention & Spam Protection
8. **As the Platform System**, I want to prevent a user from submitting duplicate reports against the same active experience or comment while an existing report is pending or reviewing.
9. **As the Platform System**, I want to enforce a hard sliding-window rate limit of $20\text{ reports per hour}$ per authenticated user to prevent automated denial-of-service or griefing attacks.
10. **As the Platform System**, I want to validate that exactly one target entity (`experience_id` XOR `comment_id`) is provided in every report submission.

### D. Platform Insights
11. **As a Platform Operator / Founder**, I want to access a basic insights dashboard displaying platform overview metrics:
    - Total experiences count
    - Total registered users count
    - Total outcome updates logged
    - Total comments count
    - Active / Open reports count (`pending` + `reviewing`)
    - Resolved vs. Dismissed moderation ratios
    - Top reported categories and reason distributions
12. **As a Reader or Contributor**, I want to see high-level category statistics (e.g., total stories and outcomes in Education, Career, etc.) to understand community activity.

---

## 3. Acceptance Criteria

### A. Content Reporting (`public.reports`)
- [ ] **Data Contract Compliance**: Follows `docs/Database,.md` exactly (`id`, `reporter_id`, `experience_id`, `comment_id`, `reason`, `status`, `created_at`).
- [ ] **Mutually Exclusive Target**:
  - `(experience_id IS NOT NULL AND comment_id IS NULL) OR (experience_id IS NULL AND comment_id IS NOT NULL)`.
  - Supplying both or neither returns `400 VALIDATION_ERROR`.
- [ ] **Reason Enum Validation**:
  - `reason` must strictly match one of: `['spam', 'harassment', 'hate_speech', 'misinformation', 'threats', 'privacy_violation', 'other']`.
- [ ] **Self-Reporting Prevention**:
  - If `reporter_id === experience.author_id`, reject with `400 BAD_REQUEST` ("You cannot report your own experience").
  - If `reporter_id === comment.author_id`, reject with `400 BAD_REQUEST` ("You cannot report your own comment").
- [ ] **Target Existence Verification**:
  - Target experience must exist and have `status != 'deleted'`. Non-existent target returns `404 NOT_FOUND`.
  - Target comment must exist. Non-existent target returns `404 NOT_FOUND`.
- [ ] **Authentication Enforcement**:
  - Unauthenticated submissions return `401 UNAUTHORIZED`.

### B. Moderation Workflow
- [ ] **State Machine**:
  - Valid statuses: `pending` (initial default), `reviewing`, `resolved`, `dismissed`.
  - Allowed transitions:
    - `pending` $\rightarrow$ `reviewing`
    - `pending` / `reviewing` $\rightarrow$ `resolved`
    - `pending` / `reviewing` $\rightarrow$ `dismissed`
- [ ] **Moderator Actions on Resolution**:
  - If report resolved with action against Experience: Set `experiences.status = 'reported'` or `'hidden'`.
  - If report resolved with action against Comment: Soft-delete comment or remove from public feed.
  - If report dismissed: Target entity remains `active`; report status becomes `dismissed`.
- [ ] **Queue Retrieval**:
  - `GET /api/v1/reports` returns reports with pagination, status filter, and joined target entity metadata.
  - Sorted by `created_at ASC` (oldest pending reports reviewed first).

### C. Abuse & Spam Prevention
- [ ] **Rate Limiting**:
  - Maximum $20$ reports per rolling 1-hour window per authenticated user.
  - Exceeding limit returns `429 RATE_LIMITED` with `resetTimeMs` in headers/payload.
- [ ] **Duplicate Report Prevention**:
  - If a user has already submitted a report for the same target with status `pending` or `reviewing`, return `409 CONFLICT` ("You have already reported this content. It is currently under review.").
- [ ] **Rapid Click Protection**:
  - UI client disables submission button and shows loading spinner upon first click.

### D. Platform Insights (`/api/v1/insights`)
- [ ] **Core Aggregations**:
  - `total_experiences`: Count of active experiences.
  - `total_users`: Count of registered profiles in `public.users`.
  - `total_outcomes`: Count of logged outcome milestones.
  - `total_comments`: Count of active comments.
- [ ] **Moderation Metrics**:
  - `open_reports`: Count of reports with `status IN ('pending', 'reviewing')`.
  - `resolved_reports`: Count of reports with `status = 'resolved'`.
  - `dismissed_reports`: Count of reports with `status = 'dismissed'`.
  - `resolution_rate`: Percentage of handled reports resolved vs dismissed.
  - `reports_by_reason`: Grouped counts by reason code (`spam`, `harassment`, etc.).
- [ ] **Performance Target**: Insights query response latency $< 300\text{ms}$.

---

## 4. Edge Cases & Handling

| Edge Case | Expected System Behavior |
| :--- | :--- |
| **User attempts to report their own story** | Returns `400 BAD_REQUEST` (`"You cannot report your own experience."`). |
| **User attempts to report their own comment** | Returns `400 BAD_REQUEST` (`"You cannot report your own comment."`). |
| **User submits report with both `experience_id` and `comment_id`** | Returns `400 VALIDATION_ERROR` (`"Must specify either experience_id or comment_id, not both."`). |
| **User submits report with neither target ID** | Returns `400 VALIDATION_ERROR` (`"Must specify either experience_id or comment_id."`). |
| **User submits duplicate report while first is pending** | Returns `409 CONFLICT` (`"You have already reported this content. Our moderation team is reviewing it."`). |
| **User submits report after previous report was resolved/dismissed** | Allowed if significant time passed or new violation occurred, subject to hourly rate limit. |
| **Target experience is already deleted/archived** | Returns `404 NOT_FOUND` (`"Target experience not found or has been removed."`). |
| **Rapid burst submissions ($> 20$ in 1 hour)** | Returns `429 RATE_LIMITED` (`"Reporting rate limit exceeded. Please try again later."`). |
| **Invalid reason string (e.g. `'illegal_download'`)** | Returns `400 VALIDATION_ERROR` with list of allowed reason enums. |
| **Moderator updates non-existent report ID** | Returns `404 NOT_FOUND`. |
| **Unauthenticated user triggers report action in UI** | Opens Login Modal / Redirects to `/login?next=/experiences/[id]` with notification. |

---

## 5. Success Metrics

1. **Safety SLA**: $100\%$ of submitted reports appear in moderation queue within $500\text{ms}$.
2. **Abuse Mitigation**: $0$ duplicate active reports allowed per user per content entity.
3. **Insights Query Latency**: `/api/v1/insights` execution $< 300\text{ms}$.
4. **Mobile Usability**: Reporting modal and moderation controls fully functional within $360\text{px} - 430\text{px}$ viewport width.
