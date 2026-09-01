# PRD: Milestone 6 V2 (Living Outcome Journeys & Longitudinal Discovery Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 2.0 (Milestone 6 — Core Journey Pivot)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `docs/Database,.md`

---

## 1. Product Rationale: The Shift from Milestones to Living Journeys

### The Foundational Insight
Traditional platforms treat decision-making and advice as static snapshots (e.g. Reddit posts, forum questions, Medium essays). The author posts at the moment of peak crisis or euphoria, receives advice, and disappears. Readers never find out what actually happened over time.

Eside's core value proposition is:
> **"I made a decision $\longrightarrow$ here is what happened over time."**

### Why Fixed Checkpoints (30d / 90d / 180d) Failed the Mental Model
1. **Human Lives Don't Happen on Multiples of 30**: 
   When someone drops out of college, leaves a toxic job, or moves across the country, life unfolds dynamically:
   - **Day 2**: Immediate shock and second-guessing.
   - **Day 5**: First resume sent / first adjustment.
   - **Day 11**: First rejection or interview breakthrough.
   - **Day 28**: First paycheck or stabilizing routine.
   - **Day 103**: Long-term reflection and retrospective advice.
   Forcing an author to wait for "Day 30" creates friction, leads to forgotten reflections, and kills the organic desire to document progress.
2. **Cognitive Math Friction**:
   Asking an author to compute *"Is this Day 90 or Day 180?"* forces unnecessary cognitive overhead. The system already knows when the story started; it should do the math automatically.
3. **Artificial Single-Update Caps**:
   A unique constraint on `(experience_id, days_after)` prevented an author from logging two distinct events that occurred on the same day (e.g. morning decision and evening consequence).
4. **Lack of Discovery for Evolving Journeys**:
   The feed gave identical visual weight to a static one-sentence post and a 6-month journey with 8 updates. Readers had no way to discover **"Recently Updated Journeys"** or filter for **"Long-Running Outcomes (90d+, 180d+, 1y+)"**.

---

## 2. User Stories

### A. Living Journey Contributors (Authors)
1. **As an Experience Author**, I want to post an outcome update whenever progress happens naturally, without being restricted to predefined 30d, 90d, or 180d checkpoints.
2. **As an Experience Author**, I want the platform to automatically calculate and display my elapsed time (e.g. *"Day 14 (Today)"*) based on when my original decision story was created, so I don't have to calculate days.
3. **As an Experience Author**, I want the ability to specify an optional custom day or past date if I am documenting events in retrospect (e.g., *"This happened on Day 3"*).
4. **As an Experience Author**, I want to post multiple updates on the same day if several meaningful developments happen.
5. **As an Experience Author**, I want all my updates displayed in a clear, connected vertical progression ordered chronologically (`Day 0` $\rightarrow$ `Day 2` $\rightarrow$ `Day 11` $\rightarrow$ `Day 103`).

### B. Outcome Discovery & Readers
6. **As a Reader**, I want to browse a dedicated **"Recently Updated Journeys"** feed tab so I can follow real-time stories that authors are actively updating.
7. **As a Reader**, I want to filter the discovery feed by **Journey Depth**:
   - **All Stories**: Standard discovery feed.
   - **Active Journeys**: Stories with at least 1 outcome update ($1+$ updates).
   - **Deep Hindsight Journeys**: Stories spanning $\ge 90$ days of lived experience ($90\text{d}+$, $180\text{d}+$, $1\text{y}+$).
8. **As a Reader**, I want to see **Journey Progress Indicators** on story preview cards in the feed:
   - Current journey span (e.g. `[🚀 Day 0 → Day 103]`)
   - Total number of updates (e.g. `[4 updates]`)
   - Last updated recency badge (e.g. `"Updated 2 days ago"`)
9. **As a Reader**, I want to see relative time gaps between updates (e.g. `+3 days later`, `+2 weeks later`, `+3 months later`) to understand the pacing of recovery or growth.

---

## 3. Acceptance Criteria

### A. Outcome Engine (`POST /api/v1/experiences/[id]/outcomes`)
- [ ] **Automatic Day Calculation**:
  - If `days_after` is omitted from payload, backend computes:
    $$\text{days\_after} = \max\left(0, \left\lfloor \frac{\text{now}() - \text{experience.created\_at}}{86,400\text{s}} \right\rfloor\right)$$
- [ ] **Arbitrary Day Offsets**:
  - Validates $0 \le \text{days\_after} \le 3650$ ($10$ years).
- [ ] **Unlimited Updates**:
  - No upper limit on total updates per experience.
  - Multiple updates with identical `days_after` are stored and sorted chronologically by `created_at ASC`.
- [ ] **Content Validation**:
  - `content`: $10$ to $5,000$ characters, trimmed.
- [ ] **Author Ownership & Immutability**:
  - Only parent experience `author_id` can append updates.
  - Cannot add updates to archived/deleted experiences (`deleted_at IS NOT NULL`).

### B. Outcome Timeline UI
- [ ] **Dynamic Update Modal**:
  - Automatically displays: `Logging update for Day X (Today)`.
  - Checkbox toggle for `"Specify custom day offset / past event"`.
- [ ] **Connected Vertical Timeline**:
  - Always anchors at `Day 0: Situation Began`.
  - Renders all updates with dynamic badges (`Day 2`, `Day 5`, `Day 11`, `Day 28`, `Day 103`, `Day 450`).
  - Displays relative duration deltas (`+3 days later`).
- [ ] **Author Quick Action**:
  - Prominent `"Add Journey Update"` button visible only to experience author.

### C. Discovery Engine & Home Feed (`GET /api/v1/experiences`)
- [ ] **Feed Tabs**:
  - Tab 1: **"Latest Stories"** (Sorted by story `created_at DESC`).
  - Tab 2: **"🔥 Recently Updated"** (Sorted by latest outcome `created_at DESC`).
- [ ] **Journey Depth Filters**:
  - `journey=all`: All active experiences.
  - `journey=active`: Experiences with $\ge 1$ outcome update.
  - `journey=long_running`: Experiences with $\ge 1$ outcome update where $\text{days\_after} \ge 90$.
- [ ] **Experience Card Metadata**:
  - Displays journey pill: `[Day 0 → Day X • N updates]`.
  - Displays recency label: `"Updated X days ago"`.

### D. Backwards Compatibility
- [ ] Existing records with `days_after = 30, 90, 180` continue to render seamlessly as `Day 30`, `Day 90`, and `Day 180` nodes with zero data corruption.

---

## 4. Edge Cases & Resilience

| Edge Case | Expected System Behavior |
| :--- | :--- |
| **Author posts multiple updates on the same day** | Both saved successfully; ordered chronologically by `created_at ASC`. |
| **Author posts update within minutes of creating story** | Auto-computes `days_after = 0` (Day 0 update). |
| **Author enters custom day offset in the future ($> 3650$)** | Fails with `"Days after cannot exceed 3650 days (10 years)."` (`400 VALIDATION_ERROR`). |
| **Author enters negative custom day offset ($< 0$)** | Fails with `"Days after cannot be negative."` (`400 VALIDATION_ERROR`). |
| **Story has no outcomes in "Recently Updated" feed** | Excluded from `?sort=recently_updated` and `?journey=active` feeds. |
| **Story with outcomes is soft-deleted** | Excluded from public feed; preserved in author profile. |
| **Non-author attempts to add outcome update** | Returns `403 FORBIDDEN`. |
| **Unauthenticated user triggers update in UI** | Prompts login modal redirecting back to story. |

---

## 5. Success Metrics

1. **Journey Continuity**: $\ge 35\%$ of active contributors post at least 2 updates on their story within 30 days.
2. **Organic Retention**: Readers visiting **"Recently Updated Journeys"** return $\ge 2.2\times$ more frequently than readers browsing static feeds.
3. **Longitudinal Depth**: $\ge 15\%$ of all experiences reach $\text{days\_after} \ge 90\text{d}$.
4. **Feed Latency**: Enriched journey discovery feed loads in $< 350\text{ms}$.
