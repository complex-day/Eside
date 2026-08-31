# PRD: Milestone 5 (Outcome Timeline & Comments Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 5)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`

---

## 1. Problem Statement

Platforms that collect lived experiences typically suffer from two fundamental deficiencies:
1. **Survivorship Bias & Stagnant Narratives**: Stories are posted at the height of emotional distress or triumph, with zero closure on what actually occurred $30$, $90$, or $180$ days later. Readers never learn which actions produced positive outcomes versus regrets.
2. **Shallow Social Noise vs. Constructive Feedback**: Generic social platforms encourage performative likes and off-topic arguments rather than structured, contextual inquiry about decisions and timelines.

**Milestone 5 Solution**:
- **Outcome Timeline**: Provides an immutable chronological milestone tracker (`days_after`: $30$, $90$, $180$, etc.) exclusively authorable by the experience owner, documenting concrete follow-up realities and lessons.
- **Comments Engine**: Provides a clean, focused, linear discussion thread for readers to ask clarifying questions and exchange constructive perspectives under pseudonymous handles.

---

## 2. User Stories

### A. Outcome Timeline
1. **As an Experience Author**, I want to append follow-up milestones (e.g. at Day 30, Day 90, Day 180) to my existing experience so that I can document how the situation resolved and what I learned.
2. **As a Reader**, I want to view a sequential vertical timeline of an experience's aftermath so that I can understand long-term outcomes and avoid preventable mistakes.
3. **As an Author**, I want my outcome milestones ordered chronologically by `days_after` ascending so that readers see a coherent progression of time.
4. **As an Author**, I want to ensure only I can add or edit outcomes on my own stories.

### B. Comments Engine
5. **As an Authenticated Reader**, I want to post a constructive comment on a published experience so that I can offer support, ask for specific clarifications, or share a relevant perspective.
6. **As a Comment Author**, I want to edit or delete my own comment so that I can correct typos or remove remarks if needed.
7. **As an Anonymous User**, I want to read all public comments on active experiences without needing to sign in, but be prompted to log in if I attempt to post.
8. **As an Author**, I want to see how many comments have been submitted on my stories and read feedback directly below the outcome timeline.

---

## 3. Acceptance Criteria

### A. Outcomes Engine (`public.outcomes`)
- [ ] **Data Contract**: Follows `database.md` (`id`, `experience_id`, `days_after`, `content`, `created_at`).
- [ ] **Author Authorization**: Only the authenticated `author_id` of the parent experience can create outcomes (`POST /api/v1/experiences/[id]/outcomes`).
- [ ] **Validation Constraints**:
  - `days_after`: Integer $\ge 0$ and $\le 3650$ (up to 10 years). Preset shortcuts: $30$, $90$, $180$, $365$, or custom integer.
  - `content`: Min $10$ characters, Max $5,000$ characters. Trimmed whitespace.
- [ ] **Ordering Guarantee**: Outcomes returned sorted by `days_after ASC`, then `created_at ASC`.
- [ ] **Immutability & Integrity**: Cannot add outcomes to `deleted` (archived) experiences. Cannot add outcomes to draft (`hidden`) experiences unless viewing in author preview.

### B. Comments Engine (`public.comments`)
- [ ] **Data Contract**: Follows `database.md` (`id`, `experience_id`, `author_id`, `content`, `created_at`, `updated_at`, `deleted_at`).
- [ ] **Public Readability**: Anyone can read active comments (`deleted_at IS NULL`) on `active` experiences.
- [ ] **Authenticated Posting**: Unauthenticated comment attempts return `401 UNAUTHORIZED`.
- [ ] **Validation Constraints**:
  - `content`: Min $2$ characters, Max $1,500$ characters. No blank/whitespace-only submissions.
- [ ] **Author Ownership & Modification**:
  - Users may update (`PUT /api/v1/comments/[id]`) or soft-delete (`DELETE /api/v1/comments/[id]`) only their own comments.
  - Soft-deleted comments render as *"[Comment deleted by author]"* or are excluded from active rendering while preserving database referential integrity.
- [ ] **Rate Limiting**: Max $20$ comments per user per hour to prevent spam.

---

## 4. Edge Cases & Handling

| Edge Case | Expected System Behavior |
| :--- | :--- |
| **Attempting to add outcome to non-existent experience** | Returns `404 NOT_FOUND` with error code `NOT_FOUND`. |
| **Non-author attempting to add outcome** | Returns `403 FORBIDDEN` with error code `FORBIDDEN`. |
| **Adding multiple outcomes with identical `days_after`** | Allowed (e.g. two updates at Day 30), secondary sort by `created_at ASC`. |
| **Comment submitted on an archived/deleted experience** | Returns `400 BAD_REQUEST` ("Cannot comment on archived experiences"). |
| **Comment author deletes their account** | `ON DELETE CASCADE` or soft-delete placeholder preserves thread coherence. |
| **Rapid double submission on outcome / comment form** | UI disables submit button + backend deduplication / rate limit. |

---

## 5. Success Metrics

1. **Outcome Adoption**: $> 25\%$ of published experiences have at least one follow-up milestone within 90 days.
2. **Reader Engagement**: Average dwell time on experience detail pages with outcome timelines $\ge 2.5\times$ higher than pages without outcomes.
3. **Response Latency**: Outcome timeline and comments load under $200\text{ms}$ alongside the parent story detail payload.
