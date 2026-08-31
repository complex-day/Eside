# MVP Scope Freeze Document

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP Freeze  
**Status**: **FROZEN (STRICT BOUNDARIES ENFORCED)**  
**Governing Rules**: `agent-rules.md` (Rule 1: MVP First, Rule 2: No Feature Creep, Rule 22: Success Definition)

---

## 1. Purpose of Scope Freeze

To prevent premature complexity, architecture drift, and feature creep, this document defines the absolute, unchangeable boundaries for the **Eside V1.0 MVP**. 

No new features, architectural layers, or third-party service dependencies may be introduced into milestones M5, M6, or M7 unless they are explicitly defined in the **Must-Have** section below.

---

## 2. In-Scope: Must Have (Core V1.0 MVP)

The MVP is complete when and only when the following four core capabilities are operational and verified:

```text
┌─────────────────────────────────────────────────────────────┐
│                       ESIDE V1.0 MVP                        │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Experiences  │   Outcomes   │   Comments   │   Bookmarks    │
│  (Story &    │  (Milestone  │ (Constructive│ (Private Saved │
│  Discovery)  │   Timeline)  │  Discussions)│  Collection)   │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### A. Experiences (Content & Discovery) — *Completed in M4*
- **Anonymous Identity**: Pseudonymous username handles generated and protected with Supabase Auth.
- **Narrative Creation**: Multi-paragraph lived experience submission with category taxonomy and tags.
- **Lifecycle Management**: Draft (`hidden`), Published (`active`), and Archive (`deleted`) states.
- **Discovery Feed**: Public chronological discovery feed with case-insensitive category filtering (`/?category=...`) and 10-item pagination windowing.
- **Story Detail**: Dedicated reader view with author metadata, timestamps, and tag badges.

### B. Outcomes (The Core Differentiator) — *Target: M5*
- **Milestone Timeline**: Chronological follow-up entries anchored to an experience (`30 days`, `90 days`, `180 days`, `1 year`, `Custom`).
- **Outcome Status Categorization**: `Resolved`, `In Progress`, `Pivoted`, `Failed / Regret`, `Ongoing`.
- **Narrative Learnings**: What happened next, lessons learned, and hindsight advice.
- **Author Ownership**: Only the experience author may append outcome milestone updates.

### C. Comments (Constructive Community Discourse) — *Target: M5*
- **Linear Discussion Threads**: Single-level or clean hierarchical feedback on published experiences.
- **Supportive & Analytical Discussions**: Community members asking questions or sharing related observations.
- **Author Attribution**: Clear anonymous badges matching the platform identity model.
- **Author / Admin Moderation**: Author ability to soft-delete their comments; system report trigger.

### D. Bookmarks (Personal Knowledge Archive) — *Completed in M4 / M5 Profile Tab*
- **Save for Later**: Toggle bookmark action on feed cards and detail pages.
- **Profile Collection**: Dedicated `Bookmarks` tab in user profile for instant retrieval of saved stories.
- **Privacy Guarantee**: Bookmark collections are strictly private to the authenticated owner.

---

## 3. Out of Scope: Not Now (Post-MVP Backlog)

The following features are **explicitly prohibited** from implementation in V1.0:

| Feature / Domain | Rejection Rationale | Target Horizon |
| :--- | :--- | :--- |
| **AI Features** (AI Therapist, Companion, Summary Bots, Semantic Matcher) | High operational cost, non-deterministic outputs, liability risks, and distraction from authentic human-to-human outcome sharing. | V2.0 Evaluation |
| **Complex Search Infrastructure** (Elasticsearch, Algolia, Vector Embeddings) | Existing category taxonomies and tag filtering satisfy MVP discovery needs without additional cloud infrastructure or billing. | V1.5 |
| **Push & In-App Notifications** (Web push, Email digests, Notification bells) | Unnecessary background complexity for MVP. Feed browsing and profile visits suffice for initial retention. | V1.5 |
| **Reputation Systems** (Karma points, streaks, badges, leaderboards) | Encourages gamification and vanity posting rather than vulnerable, honest outcome documentation. | Strict Anti-Feature |
| **Social Graph** (Followers, Following, Friend requests, Direct messages) | Eside is a structured experience and knowledge repository, not an influencer-driven social network. | Excluded |
| **Native Mobile Apps** (iOS / Android Swift / Kotlin / React Native) | Responsive mobile-first web app (360px–430px) provides universal access with zero app store friction. | Post-Market Fit |
| **Payments / Subscriptions / Ads** (Monetization walls, Paywalls, Banner ads) | Adds compliance and friction before core organic retention and outcome value is validated. | V2.0 |

---

## 4. Remaining Milestone Execution Plan

With Milestone 4 approved, execution will strictly follow the remaining milestone roadmaps:

```text
M4 (Completed) ──► M5 (Outcomes & Comments) ──► M6 (Insights & Moderation) ──► M7 (Analytics & Launch)
```

1. **Milestone 5**:
   - `outcomes` CRUD API & interactive timeline UI component.
   - `comments` CRUD API & linear discussion card component.
   - Story detail integration.
2. **Milestone 6**:
   - Basic category aggregation insights (outcome resolution ratios).
   - Content reporting modal & moderation trigger (`public.reports`).
3. **Milestone 7**:
   - Structured privacy-friendly event tracking (`analytics.md`).
   - Final end-to-end performance verification ($< 500\text{ms}$ feed).

---

## 5. Scope Change Governance

Any proposal to add or alter requirements must be evaluated against this freeze document. If a request does not fall under **Must-Have**, it must be deferred to the post-MVP backlog.
