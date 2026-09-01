# TDD Test Suite: Milestone 6 (Living Outcome Journeys & Outcome Discovery Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 6 — Revised Product Core)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md` (Rule 17: Testing)

---

## 1. TDD Strategy & Execution Order

All tests are written **before** writing implementation code. The test-driven development plan follows a 6-phase validation cycle:

```text
Phase 1: Validation Unit Tests (Optional days_after & 0-3650 bounds)
Phase 2: Auto-Elapsed Calculation Logic Unit Tests
Phase 3: Journey API Route Integration Tests (POST & GET outcomes)
Phase 4: Outcome Discovery & Feed Filtering Tests (Recently Updated & Journey Depth)
Phase 5: Backwards Compatibility Suite (Legacy 30d, 90d, 180d outcomes)
Phase 6: Failure Scenarios & Edge Cases
```

---

## 2. Test Cases Specification

### Suite 1: Outcome Validation Unit Tests (`src/lib/validations/outcome.ts`)

| Test ID | Test Name | Input / Condition | Expected Result |
| :--- | :--- | :--- | :--- |
| **JRN-VAL-01** | Valid journey update without `days_after` | `content: "Reached the next milestone..."` (omitted `days_after`) | `safeParse()` returns `success: true` |
| **JRN-VAL-02** | Valid journey update with custom `days_after` | `days_after: 14`, `content: "Two weeks in..."` | `safeParse()` returns `success: true` |
| **JRN-VAL-03** | Valid journey update on Day 0 | `days_after: 0`, `content: "Day 0 immediate aftermath..."` | `safeParse()` returns `success: true` |
| **JRN-VAL-04** | Valid long-running journey update | `days_after: 730` (2 years), `content: "Looking back after 2 years..."` | `safeParse()` returns `success: true` |
| **JRN-VAL-05** | Reject negative `days_after` | `days_after: -1` | Fails with `"Days after cannot be negative."` |
| **JRN-VAL-06** | Reject `days_after` exceeding 10 years | `days_after: 3651` | Fails with `"Days after cannot exceed 3650 days (10 years)."` |
| **JRN-VAL-07** | Reject content under 10 characters | `content: "Too short"` | Fails with `"Outcome narrative must be at least 10 characters."` |
| **JRN-VAL-08** | Reject content exceeding 5,000 characters | `content: "a".repeat(5001)` | Fails with `"Outcome narrative cannot exceed 5000 characters."` |

---

### Suite 2: Elapsed Time Auto-Calculation Logic Tests

| Test ID | Scenario | Story `created_at` | Current Timestamp | Expected `days_after` |
| :--- | :--- | :--- | :--- | :--- |
| **CALC-01** | Story created 10 minutes ago | `2026-08-31T12:00:00Z` | `2026-08-31T12:10:00Z` | `0` (Day 0) |
| **CALC-02** | Story created 36 hours ago | `2026-08-30T00:00:00Z` | `2026-08-31T12:00:00Z` | `1` (Day 1) |
| **CALC-03** | Story created 14 days ago | `2026-08-17T12:00:00Z` | `2026-08-31T12:00:00Z` | `14` (Day 14) |
| **CALC-04** | Story created 103 days ago | `2026-05-20T12:00:00Z` | `2026-08-31T12:00:00Z` | `103` (Day 103) |
| **CALC-05** | Explicit `days_after` provided (retroactive) | `2026-08-01T12:00:00Z` | Payload has `days_after: 5` | `5` (Uses explicit override) |

---

### Suite 3: Living Journey API Route Tests (`POST /api/v1/experiences/[id]/outcomes`)

| Test ID | Method | Scenario | Auth State | Expected Status & Body |
| :--- | :--- | :--- | :--- | :--- |
| **JRN-API-01** | `POST` | Author logs update without `days_after` | Story Author | `201 CREATED`, returns `days_after` computed from story origin date |
| **JRN-API-02** | `POST` | Author logs update with explicit `days_after` (e.g. 11) | Story Author | `201 CREATED`, returns `days_after: 11` |
| **JRN-API-03** | `POST` | Author logs second update on the same day | Story Author | `201 CREATED` (Both entries stored without unique constraint crash) |
| **JRN-API-04** | `POST` | Non-author attempts to log journey update | Non-Author | `403 FORBIDDEN` (`"Only the author can post journey updates."`) |
| **JRN-API-05** | `POST` | Unauthenticated user attempts update | Unauthenticated | `401 UNAUTHORIZED` |
| **JRN-API-06** | `POST` | Add update to archived / deleted experience | Story Author | `400 BAD_REQUEST` (`"Cannot add outcome to archived experience."`) |
| **JRN-API-07** | `GET` | Retrieve timeline with non-standard day sequence | Public | `200 OK`, returns array sorted strictly by `days_after ASC`, `created_at ASC` (e.g. `[Day 2, Day 5, Day 11, Day 103]`) |

---

### Suite 4: Outcome Discovery & Feed Filtering Tests (`GET /api/v1/experiences`)

| Test ID | Query Params | Scenario | Expected Result |
| :--- | :--- | :--- | :--- |
| **DISC-01** | `sort=latest` | Default discovery feed | Experiences sorted by experience `created_at DESC` |
| **DISC-02** | `sort=recently_updated` | Recently updated feed | Experiences sorted by latest outcome update `created_at DESC` |
| **DISC-03** | `journey=active` | Filter for stories with updates | Returns only experiences having `journey.total_updates >= 1` |
| **DISC-04** | `journey=long_running` | Filter for deep hindsight stories | Returns only experiences having `journey.latest_days_after >= 90` |
| **DISC-05** | `journey=long_running&category=career` | Combined category & journey filter | Returns career experiences with $\ge 90\text{d}$ updates |
| **DISC-06** | Response metadata check | Inspect feed card payload | Every card contains `journey: { total_updates, latest_days_after, latest_update_at }` |

---

### Suite 5: Backwards Compatibility Suite (Legacy Records)

| Test ID | Scenario | Pre-existing Data | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **LEGACY-01** | Render pre-existing Day 30 record | Row with `days_after = 30` | Correctly renders in timeline as `Day 30` node |
| **LEGACY-02** | Render pre-existing Day 90 record | Row with `days_after = 90` | Correctly renders in timeline as `Day 90` node |
| **LEGACY-03** | Mixed timeline with legacy & new updates | Existing Day 30 + New Day 45 added | Timeline renders `[Day 0, Day 30, Day 45]` in chronological order |

---

### Suite 6: Failure Scenarios & Edge Cases

| Test ID | Scenario | Input | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **FAIL-01** | Negative elapsed time (corrupted clock) | Server time before story creation | Clamps `days_after` to `0` |
| **FAIL-02** | Non-existent experience UUID | `id: 00000000-0000-0000-0000-000000000000` | Returns `404 NOT_FOUND` |
| **FAIL-03** | Excessive update rate ($> 20$/hr) | 21st outcome logged in 1 hour | Returns `429 RATE_LIMITED` |
| **FAIL-04** | Feed query with invalid `journey` enum | `journey=invalid_value` | Falls back gracefully to `journey=all` |

---

## 3. UI Component Test Criteria

### A. `AddJourneyUpdateModal`
- [ ] Displays live auto-detected day badge: `"Posting update for Day X (Today)"`.
- [ ] Provides checkbox/toggle: `"Document a past date / custom day offset"`.
- [ ] If custom toggle checked: reveals number input for `days_after` with validation ($0$–$3650$).
- [ ] Character counter accurately tracks $10$ to $5,000$ characters.
- [ ] Prevents double submission by disabling button and showing spinner during submit.

### B. `OutcomeTimeline`
- [ ] Always renders `Day 0: Situation Began` as the root milestone.
- [ ] Renders every journey update in sequence with clean badges: `Day 2`, `Day 5`, `Day 11`, `Day 103`.
- [ ] Computes and renders relative delta between nodes (e.g. `"+3 days later"`).
- [ ] Author view displays `"Post Journey Update"` button.

### C. `ExperienceCard` & `JourneyProgressBadge`
- [ ] Renders `[🚀 Day 0 → Day 103 • 4 updates]` pill if experience has outcomes.
- [ ] Renders `[Updated 2d ago]` timestamp if latest outcome was within 7 days.
- [ ] If 0 outcomes exist: displays subtle `[Single Story]` indicator.

### D. `FeedTabs` & `JourneyFilterPills`
- [ ] Switching between `"Latest"` and `"🔥 Recently Updated"` updates URL query parameter (`?sort=...`) without full page reload.
- [ ] Journey filter chips (`All`, `Active Journeys (1+)`, `Long-running (90d+)`) dynamically filter results.

---

## 4. Verification Checkpoint Gate

Implementation of Revised Milestone 6 will be verified by:
1. Database migration `00013_unlock_freeform_outcome_journeys.sql` applied cleanly.
2. All unit tests, API tests, and backward-compatibility tests passing ($100\%$).
3. `npm run type-check` $\longrightarrow$ 0 errors.
4. `npm run lint` $\longrightarrow$ 0 warnings/errors.
5. `npm run build` $\longrightarrow$ Production bundle compiles cleanly.
6. End-to-end browser verification of auto-calculated day logging, multi-entry timelines, and "Recently Updated" discovery filtering.
