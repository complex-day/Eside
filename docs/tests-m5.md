# TDD Test Suite: Milestone 5 (Outcome Timeline & Comments Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 5)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md` (Rule 17: Testing)

---

## 1. TDD Strategy & Execution Order

Tests are written and structured **before** writing implementation code. All tests must initially fail before endpoints and components are wired.

```text
Phase 1: Validation Unit Tests (Zod Schemas)
Phase 2: API Route Integration Tests (Outcomes & Comments)
Phase 3: Authorization & Security Checks (Author vs Non-Author)
Phase 4: Database Constraints & Soft-Delete Auditing
```

---

## 2. Test Cases Specification

### Suite 1: Outcome Timeline Validation (`src/lib/validations/outcome.ts`)

| Test ID | Test Name | Input / Condition | Expected Result |
| :--- | :--- | :--- | :--- |
| **OUT-VAL-01** | Valid outcome creation payload | `days_after: 30`, `content: "Started new role..."` (50 chars) | `safeParse()` returns `success: true` |
| **OUT-VAL-02** | Reject negative `days_after` | `days_after: -5` | Fails with `"Days after cannot be negative."` |
| **OUT-VAL-03** | Reject exceeding maximum timeframe | `days_after: 4000` | Fails with `"Days after cannot exceed 3650 (10 years)."` |
| **OUT-VAL-04** | Reject fractional `days_after` | `days_after: 30.5` | Fails with `"Days after must be an integer."` |
| **OUT-VAL-05** | Reject too short content | `content: "Done"` (4 chars) | Fails with `"Content must be at least 10 characters."` |
| **OUT-VAL-06** | Reject content exceeding 5,000 characters | `content: "a".repeat(5001)` | Fails with `"Content cannot exceed 5000 characters."` |

---

### Suite 2: Comments Validation (`src/lib/validations/comment.ts`)

| Test ID | Test Name | Input / Condition | Expected Result |
| :--- | :--- | :--- | :--- |
| **COM-VAL-01** | Valid comment submission payload | `content: "Great insight on Day 30!"` | `safeParse()` returns `success: true` |
| **COM-VAL-02** | Reject empty or whitespace string | `content: "   "` | Fails with `"Comment cannot be empty."` |
| **COM-VAL-03** | Reject comment under 2 characters | `content: "k"` | Fails with `"Comment must be at least 2 characters."` |
| **COM-VAL-04** | Reject comment over 1,500 characters | `content: "a".repeat(1501)` | Fails with `"Comment cannot exceed 1500 characters."` |

---

### Suite 3: Outcome API Route Tests (`/api/v1/experiences/[id]/outcomes`)

| Test ID | Method | Scenario | Auth State | Expected Status & Body |
| :--- | :--- | :--- | :--- | :--- |
| **OUT-API-01** | `GET` | Fetch outcomes for published experience | Public (Unauth) | `200 OK`, returns array ordered by `days_after ASC` |
| **OUT-API-02** | `GET` | Fetch outcomes for non-existent experience | Public (Unauth) | `404 NOT_FOUND` |
| **OUT-API-03** | `GET` | Fetch outcomes for private draft experience | Non-Author | `404 NOT_FOUND` |
| **OUT-API-04** | `GET` | Fetch outcomes for private draft experience | Story Author | `200 OK`, returns draft outcomes |
| **OUT-API-05** | `POST` | Add outcome milestone to owned story | Story Author | `201 CREATED`, returns created outcome with UUID |
| **OUT-API-06** | `POST` | Add outcome without authentication | Unauthenticated | `401 UNAUTHORIZED` |
| **OUT-API-07** | `POST` | Add outcome to another user's story | Non-Author User | `403 FORBIDDEN` |
| **OUT-API-08** | `POST` | Add outcome to archived story | Story Author | `400 BAD_REQUEST` ("Cannot add outcomes to archived experience") |
| **OUT-API-09** | `POST` | Timeline chronological sorting check | Story Author (Day 90 added before Day 30) | `GET` returns `[Day 30, Day 90]` regardless of insertion order |

---

### Suite 4: Comments API Route Tests (`/api/v1/experiences/[id]/comments` & `/api/v1/comments/[id]`)

| Test ID | Method | Scenario | Auth State | Expected Status & Body |
| :--- | :--- | :--- | :--- | :--- |
| **COM-API-01** | `GET` | Fetch active comments on story | Public (Unauth) | `200 OK`, returns `items` array ordered by `created_at ASC` |
| **COM-API-02** | `POST` | Submit comment as authenticated user | Authenticated | `201 CREATED`, returns comment with author details |
| **COM-API-03** | `POST` | Submit comment unauthenticated | Unauthenticated | `401 UNAUTHORIZED` |
| **COM-API-04** | `POST` | Submit comment on archived story | Authenticated | `400 BAD_REQUEST` ("Cannot comment on archived experience") |
| **COM-API-05** | `POST` | Exceed comment rate limit ($>20$/hr) | Authenticated | `429 RATE_LIMITED` |
| **COM-API-06** | `PUT` | Edit own comment | Comment Author | `200 OK`, returns updated `content` and `updated_at` |
| **COM-API-07** | `PUT` | Edit another user's comment | Non-Author | `403 FORBIDDEN` |
| **COM-API-08** | `DELETE`| Soft-delete own comment | Comment Author | `200 OK`, sets `deleted_at = NOW()` |
| **COM-API-09** | `DELETE`| Delete another user's comment | Non-Author | `403 FORBIDDEN` |
| **COM-API-10** | `GET` | Audit soft-deleted comments | Public | Soft-deleted comment is excluded from list |

---

## 3. UI Component Test Criteria

### A. `OutcomeTimeline`
- [ ] Renders baseline card: `"Day 0: Situation Began"` with initial story snippet.
- [ ] Renders all outcome nodes with milestone badges (`30 Days Later`, `90 Days Later`).
- [ ] Displays `"Log Outcome Milestone"` button if and only if viewer is the story author.
- [ ] Displays empty timeline placeholder with encouraging prompt if author has not logged milestones yet.

### B. `CommentSection`
- [ ] Renders total comments count in section header.
- [ ] If authenticated: renders `CommentInput` with character countdown ($1,500$ max).
- [ ] If unauthenticated: renders login prompt button redirecting to `/login?next=/experiences/[id]`.
- [ ] Each comment shows username avatar, timestamp, and edit/delete dropdown if owned by viewer.

---

## 4. Verification Checkpoint Gate

Implementation of Milestone 5 will be verified by:
1. All validation schemas and API routes passing unit & integration tests.
2. `npm run type-check` $\longrightarrow$ 0 errors.
3. `npm run lint` $\longrightarrow$ 0 warnings/errors.
4. `npm run build` $\longrightarrow$ Production build passes.
5. Manual browser QA verifying timeline creation, milestone progression, and live commenting.
