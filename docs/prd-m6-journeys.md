# PRD: Milestone 6 (Living Outcome Journeys & Outcome Discovery Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 6 — Revised Product Core)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `docs/Database,.md`

---

## 1. Problem Statement

Eside was founded on a singular core hypothesis:
> *"People want to follow real decisions and their evolving outcomes, learning from longitudinal human experience rather than isolated opinions."*

In the initial design, outcomes were constrained to rigid milestone intervals ($30\text{d}$, $90\text{d}$, $180\text{d}$, $1\text{y}$). This artificial structure created major product friction:
1. **Unnatural Checkpoint Constraints**: Real-life decisions and struggles do not unfold on a neat 30-day schedule. An author faces acute crisis on **Day 2**, pivots on **Day 5**, achieves a breakthrough on **Day 11**, stabilizes on **Day 28**, and gains profound hindsight on **Day 103**. Forcing authors to wait for Day 30 causes emotional drop-off and lost reflections.
2. **Mental Math Burden**: Requiring contributors to choose or calculate "which milestone day" they are on creates cognitive friction.
3. **No Outcome Discovery**: In the feed, readers could not distinguish between a static one-off story and an active, evolving journey with 5 updates spanning 6 months. Readers could not filter for **"Recently Updated Journeys"** or browse **"Long-running Stories (90d+, 180d+, 1y+)"**.

**Milestone 6 Solution**:
- **Living Outcome Journeys**: Contributors can post updates whenever meaningful progress occurs. The platform automatically calculates elapsed days from the original decision.
- **Unlimited Journey Updates**: Experience authors can document continuous progress without arbitrary limits on update count or day offsets.
- **Outcome Discovery Engine**: Readers can discover stories by journey activity (**"Recently Updated"**, **"Active Journeys"**, **"Long-running 90d+ Journeys"**) with clear journey progression badges on every card.

---

## 2. User Stories

### A. Living Journey Updates (Author Experience)
1. **As an Experience Author**, I want to post an update the moment meaningful progress happens (e.g. Day 2 after quitting my job, Day 5 after starting my routine) without being constrained to 30, 90, or 180 days.
2. **As an Experience Author**, I want the system to automatically calculate and display the elapsed time (e.g. *"Day 14 (Today)"*) from when I first shared my decision, so I don't have to calculate day numbers manually.
3. **As an Experience Author**, I want the option to override the date or day offset if I am documenting a past event in retrospect (e.g., *"This happened 3 days after"*).
4. **As an Experience Author**, I want to post multiple sequential updates as my journey unfolds, creating a rich longitudinal narrative for the community.
5. **As an Experience Author**, I want my original story and all follow-up updates presented in a continuous, connected chronological progression.

### B. Outcome Discovery & Reading (Reader Experience)
6. **As a Reader**, I want to browse a **"Recently Updated"** feed to follow real-time decisions and see how creators are currently navigating their challenges.
7. **As a Reader**, I want to filter the discovery feed by **Journey Depth**:
   - **All Stories**: Standard discovery feed.
   - **Active Journeys**: Stories with at least 1 follow-up outcome update ($1+$ updates).
   - **Long-running Journeys**: Stories with updates spanning significant time ($90\text{d}+$, $180\text{d}+$, or $1\text{y}+$).
8. **As a Reader**, I want to see **Journey Progress Indicators** on story preview cards in the feed (e.g. `[Day 0 → Day 45 • 3 updates]` or `[Updated 2d ago]`), so I can immediately spot deep longitudinal content.
9. **As a Reader**, I want to read an experience's outcome timeline with clear chronological day markers (`Day 2`, `Day 5`, `Day 11`, `Day 28`, `Day 103`) and relative delta indicators (`+3 days later`, `+2 weeks later`).

---

## 3. Acceptance Criteria

### A. Living Outcome Recording (`POST /api/v1/experiences/[id]/outcomes`)
- [ ] **Automatic Calculation**:
  - If `days_after` is omitted from the request payload, the backend automatically calculates:
    $$\text{days\_after} = \max\left(0, \left\lfloor \frac{\text{now}() - \text{experience.created\_at}}{86,400\text{s}} \right\rfloor\right)$$
- [ ] **Flexible Day Range**:
  - Supports any integer $\text{days\_after}$ between $0$ and $3,650$ days ($10$ years).
- [ ] **Unlimited Updates**:
  - No restriction on the number of outcome entries per experience.
  - Multiple updates on the same day are supported and ordered by `created_at ASC`.
- [ ] **Narrative Validation**:
  - `content`: Min $10$ characters, Max $5,000$ characters. Whitespace trimmed.
- [ ] **Author Authorization**:
  - Strictly enforced: only the authenticated `author_id` of the parent experience can append journey updates.
  - Cannot add updates to archived/deleted experiences (`deleted_at IS NOT NULL`).

### B. Outcome Timeline UI & Navigation
- [ ] **Dynamic Elapsed Day Display**:
  - The update modal automatically displays: `Posting update for Day X (Today)`.
  - Provides a toggle for `"Specify custom date / day offset"` for retrospective journaling.
- [ ] **Connected Vertical Timeline**:
  - Day 0 Baseline: Highlights when the situation began.
  - Follow-up nodes: Displays dynamic labels (e.g. `Day 2`, `Day 5`, `Day 11`, `Day 28`, `Day 103`, `Day 450`).
  - Relative time deltas: Shows time elapsed between consecutive nodes (e.g. `+3 days later`).
- [ ] **Empty State with Encouraging Prompt**:
  - If no updates have been posted yet, author sees: *"You have not posted any journey updates yet. Share what happened next to help others learn from your outcome!"*

### C. Discovery Engine & Filtering (`GET /api/v1/experiences`)
- [ ] **Feed Sorting**:
  - `sort=latest`: Default chronological sort by experience `created_at DESC`.
  - `sort=recently_updated`: Sorts experiences by the `created_at` timestamp of their most recent outcome update.
- [ ] **Journey Depth Filtering**:
  - `journey=all`: Returns all active experiences.
  - `journey=active`: Returns experiences with $\ge 1$ outcome update.
  - `journey=long_running`: Returns experiences with an outcome update where $\text{days\_after} \ge 90$.
- [ ] **Preview Card Progress Indicators**:
  - Every `ExperienceCard` displays:
    - Journey pill: `[Day 0 → Day X • N updates]` if outcomes exist.
    - Outcome status chip: `[Evolving Journey]` or `[Single Story]`.
    - Relative recency: `"Updated 2 days ago"` if an outcome was posted recently.

### D. Backwards Compatibility Guarantee
- [ ] Existing database records with `days_after = 30, 90, 180` render identically as `Day 30`, `Day 90`, and `Day 180` nodes without data corruption or loss.

---

## 4. Edge Cases & Handling

| Edge Case | Expected System Behavior |
| :--- | :--- |
| **Author posts multiple updates on the same day** | Allowed. Both entries share `days_after` and are ordered chronologically by `created_at ASC`. |
| **Author posts update within minutes of creating story** | Auto-calculates `days_after = 0` (rendered as `Day 0 (Initial Update)`). |
| **Author manually enters negative day offset** | Fails validation with `"Days after cannot be negative."` (`400 VALIDATION_ERROR`). |
| **Author manually enters day offset $> 3650$** | Fails validation with `"Days after cannot exceed 3650 days (10 years)."` (`400 VALIDATION_ERROR`). |
| **Non-author attempts to add journey update** | Returns `403 FORBIDDEN` (`"Only the author can post journey updates."`). |
| **Experience has 0 outcomes when filtering `journey=active`** | Filter strictly excludes experiences without outcomes. |
| **Experience with outcomes is soft-deleted** | Excluded from public discovery feed, preserved in author profile. |
| **Multiple updates created out-of-order via custom days** | Timeline automatically sorts by `days_after ASC`, then `created_at ASC`. |

---

## 5. Success Metrics

1. **Journey Depth**: $\ge 35\%$ of published experiences receive at least one follow-up update within the first 14 days.
2. **Multi-Update Retention**: Average number of updates per active journey $\ge 2.8$ updates.
3. **Discovery Engagement**: Click-through rate on **"Recently Updated"** feed $\ge 1.8\times$ higher than static feed.
4. **Hindsight Discovery**: Dwell time on stories with $\text{days\_after} \ge 90\text{d}$ is $\ge 3\times$ higher than single-post stories.
