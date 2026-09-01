# TDD Test Suite: Milestone 6 (Content Reporting, Moderation Workflow, Abuse Prevention & Platform Insights)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 6)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md` (Rule 17: Testing)

---

## 1. TDD Strategy & Execution Order

All test cases are defined and structured **prior to writing implementation code**. The tests follow a 5-phase test-driven development cycle:

```text
Phase 1: Validation Unit Tests (Zod Schemas for Reports & Moderation)
Phase 2: Authorization & Self-Reporting Prevention Tests
Phase 3: Reporting API Route & Workflow Tests (POST / GET / PATCH)
Phase 4: Abuse Prevention & Rate Limiting Tests (Duplicates & Hourly Caps)
Phase 5: Platform Insights & Analytics Aggregation Tests (GET /api/v1/insights)
```

---

## 2. Test Cases Specification

### Suite 1: Report Validation Unit Tests (`src/lib/validations/report.ts`)

| Test ID | Test Name | Input / Condition | Expected Result |
| :--- | :--- | :--- | :--- |
| **REP-VAL-01** | Valid experience report payload | `experience_id: validUUID`, `reason: "harassment"` | `safeParse()` returns `success: true` |
| **REP-VAL-02** | Valid comment report payload | `comment_id: validUUID`, `reason: "spam"` | `safeParse()` returns `success: true` |
| **REP-VAL-03** | Accept all 7 valid reason codes | `reason IN ['spam', 'harassment', 'hate_speech', 'misinformation', 'threats', 'privacy_violation', 'other']` | All 7 return `success: true` |
| **REP-VAL-04** | Reject invalid reason string | `reason: "copyright_infringement"` | Fails with `"Invalid report reason code."` |
| **REP-VAL-05** | Reject both `experience_id` and `comment_id` present | Both UUIDs provided | Fails with `"Cannot report both an experience and a comment simultaneously."` |
| **REP-VAL-06** | Reject neither target provided | `experience_id: null`, `comment_id: null` | Fails with `"Must provide either experience_id or comment_id."` |
| **REP-VAL-07** | Reject malformed UUID string | `experience_id: "not-a-uuid"` | Fails with `"Invalid UUID format."` |
| **REP-VAL-08** | Valid moderation update payload | `status: "resolved"`, `action: "hide_content"` | `safeParse()` returns `success: true` |
| **REP-VAL-09** | Reject invalid moderation status | `status: "banned"` | Fails with `"Invalid moderation status."` |

---

### Suite 2: Authorization & Self-Reporting Prevention Tests

| Test ID | Method | Scenario | Auth Context | Expected Status & Code |
| :--- | :--- | :--- | :--- | :--- |
| **REP-AUTH-01** | `POST` | Author attempts to report their own experience | Experience Author | `400 BAD_REQUEST` (`"You cannot report your own experience."`) |
| **REP-AUTH-02** | `POST` | Author attempts to report their own comment | Comment Author | `400 BAD_REQUEST` (`"You cannot report your own comment."`) |
| **REP-AUTH-03** | `POST` | Unauthenticated user attempts to submit report | Unauthenticated | `401 UNAUTHORIZED` |
| **REP-AUTH-04** | `POST` | Non-author authenticated user reports content | Authenticated User | `201 CREATED` |
| **REP-AUTH-05** | `GET` | Regular user attempts to read moderation queue | Regular Authenticated User | `403 FORBIDDEN` |
| **REP-AUTH-06** | `PATCH`| Regular user attempts to resolve report | Regular Authenticated User | `403 FORBIDDEN` |
| **REP-AUTH-07** | `GET` | Unauthenticated visitor requests `/api/v1/insights` | Public Visitor | `200 OK` (Public aggregations allowed) |

---

### Suite 3: Reporting API Route & Workflow Tests (`/api/v1/reports`)

| Test ID | Method | Scenario | Precondition | Expected Status & Body |
| :--- | :--- | :--- | :--- | :--- |
| **REP-API-01** | `POST` | Submit valid report for active experience | Experience exists (`active`) | `201 CREATED`, returns report with `status: "pending"` |
| **REP-API-02** | `POST` | Submit valid report for active comment | Comment exists | `201 CREATED`, returns report with `status: "pending"` |
| **REP-API-03** | `POST` | Report non-existent experience UUID | Experience does not exist | `404 NOT_FOUND` |
| **REP-API-04** | `POST` | Report soft-deleted / archived experience | Experience has `deleted_at != NULL` | `404 NOT_FOUND` |
| **REP-API-05** | `GET` | Fetch moderation queue default | Reports exist in DB | `200 OK`, returns items ordered by `created_at ASC` |
| **REP-API-06** | `GET` | Filter moderation queue by status | Reports with mixed statuses | `200 OK`, returns only matching `status` rows |
| **REP-API-07** | `PATCH`| Update report status `pending` $\rightarrow$ `reviewing` | Report exists (`pending`) | `200 OK`, returns `status: "reviewing"` |
| **REP-API-08** | `PATCH`| Resolve report with `action: "hide_content"` | Report on experience | `200 OK`, report `status: "resolved"`, experience `status: "hidden"` |
| **REP-API-09** | `PATCH`| Resolve report with `action: "delete_comment"` | Report on comment | `200 OK`, report `status: "resolved"`, comment deleted |
| **REP-API-10** | `PATCH`| Dismiss report with `status: "dismissed"` | Report exists | `200 OK`, report `status: "dismissed"`, target content unchanged |

---

### Suite 4: Abuse Prevention & Rate Limiting Tests

| Test ID | Scenario | Condition / Count | Expected Result |
| :--- | :--- | :--- | :--- |
| **REP-ABUSE-01** | Duplicate report prevention | User submits 2nd report for same experience while 1st is `pending` | Returns `409 CONFLICT` (`"You have already reported this content."`) |
| **REP-ABUSE-02** | Duplicate report prevention | User submits 2nd report for same comment while 1st is `reviewing` | Returns `409 CONFLICT` |
| **REP-ABUSE-03** | Re-reporting permitted after resolution | User reports content after previous report was `resolved` or `dismissed` | Returns `201 CREATED` (Subject to rate limits) |
| **REP-ABUSE-04** | Rate limit enforcement | User submits 20 reports within 1 hour | 20th submission succeeds (`201 CREATED`) |
| **REP-ABUSE-05** | Rate limit violation | User submits 21st report within 1 hour | 21st submission returns `429 RATE_LIMITED` |
| **REP-ABUSE-06** | Rate limit reset window | 60 minutes elapse after 20 submissions | 21st submission succeeds (`201 CREATED`) |

---

### Suite 5: Platform Insights Aggregation Tests (`/api/v1/insights`)

| Test ID | Metric | Test Assertion | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **INS-API-01** | `total_experiences` | Seed 5 experiences (4 active, 1 deleted) | Returns `total_experiences: 4` |
| **INS-API-02** | `total_outcomes` | Seed 3 outcomes | Returns `total_outcomes: 3` |
| **INS-API-03** | `total_users` | Seed 6 registered users | Returns `total_users: 6` |
| **INS-API-04** | `open_reports` | 2 pending + 1 reviewing + 3 resolved reports | Returns `open_reports: 3` (`pending: 2, reviewing: 1`) |
| **INS-API-05** | `resolution_rate_percent` | 6 resolved, 2 dismissed reports ($6 / 8$) | Returns `resolution_rate_percent: 75.0` |
| **INS-API-06** | `reports_by_reason` | 3 spam, 2 harassment, 1 other | Grouped object correctly aggregates counts |
| **INS-API-07** | Category statistics | Grouped experiences per category | Returns array with correct `experiences_count` and `outcomes_count` |

---

### Suite 6: Failure Scenarios & Edge Cases

| Test ID | Scenario | System Input | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **FAIL-01** | Concurrent duplicate report submissions | Two simultaneous `POST /reports` for same target by same user | Exactly one succeeds (`201`), second returns `409 CONFLICT` |
| **FAIL-02** | Target experience deleted mid-reporting | Experience deleted immediately before report insert | Transaction catches missing target $\rightarrow$ returns `404 NOT_FOUND` |
| **FAIL-03** | Target comment deleted when resolving report | Moderator selects `delete_comment` but comment already gone | Graceful resolution $\rightarrow$ report marked `resolved` without crash |
| **FAIL-04** | Database connection timeout during insights | DB pool transient error | Returns `500 SERVER_ERROR` with structured error JSON |

---

## 3. UI Component Test Criteria

### A. `ReportModal`
- [ ] Renders modal title: `"Report Content"` with subtitle explaining community standards.
- [ ] Renders radio options for all 7 reason codes with descriptive labels.
- [ ] Disables submit button until a reason code is selected.
- [ ] Disables submit button and shows spinner upon click to prevent double-click abuse.
- [ ] On successful submission: closes modal and triggers success toast notification.
- [ ] On `409 CONFLICT`: displays inline message *"You have already reported this content."*
- [ ] On `429 RATE_LIMITED`: displays inline message *"Rate limit exceeded. Please wait before reporting again."*

### B. `ReportButton`
- [ ] Renders accessible flag icon with tooltip (`"Report this story"` or `"Report this comment"`).
- [ ] If current viewer is the content author: hides button or disables trigger.
- [ ] If unauthenticated: clicking opens login prompt dialog.

### C. `ModerationQueueTable` / `ModerationDashboard`
- [ ] Displays status filter pills (`Pending`, `Reviewing`, `Resolved`, `Dismissed`, `All`).
- [ ] Shows target entity type badge (`Story` vs `Comment`), reporter username, reason badge, and timestamp.
- [ ] Expandable preview showing full story narrative or comment snippet.
- [ ] Action buttons (`Take Action: Hide Story / Delete Comment`, `Dismiss Report`).

### D. `InsightsOverviewCard` & `ModerationMetricsCard`
- [ ] Stat counters animate smoothly from 0 to total count.
- [ ] Visual progress bar for resolution percentage ($0\% - 100\%$).
- [ ] Reason breakdown horizontal bars showing proportional distribution.

---

## 4. Verification Checkpoint Gate

Implementation of Milestone 6 will be considered verified when:
1. All validation schemas (`report.ts`) and API routes pass unit and integration tests.
2. `npm run type-check` $\longrightarrow$ 0 TypeScript errors.
3. `npm run lint` $\longrightarrow$ 0 ESLint warnings/errors.
4. `npm run build` $\longrightarrow$ Production bundle compiles cleanly.
5. End-to-end QA verifies report submission, duplicate prevention, self-reporting blocking, rate limiting, and insights aggregation.
