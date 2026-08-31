# System Design: Milestone 5 (Outcome Timeline & Comments Engine)

**Project**: Eside — Learn from Real Outcomes  
**Version**: 1.0 MVP (Milestone 5)  
**Status**: **PLANNING / AWAITING APPROVAL**  
**Governing Documents**: `docs/mvp-scope-freeze.md`, `agent-rules.md`, `database.md`, `api.md`

---

## 1. Architectural Overview & Data Flow

Milestone 5 introduces the two interactive post-publication layers of Eside:
1. **The Outcome Timeline Layer**: Structured milestone records documenting post-event trajectories.
2. **The Comments Layer**: Contextual, constructive discussions anchored directly to experiences.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     Experience Detail View (/experiences/[id])         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Story Narrative & Author Header (M4 Foundation)                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Outcome Timeline (M5)                                            │  │
│  │   • Day 0: Baseline situation                                    │  │
│  │   • Day 30: First reaction & actions taken                       │  │
│  │   • Day 90: Pivot & mid-term consequences                        │  │
│  │   • Day 180: Resolution & lasting takeaway                       │  │
│  │   [+ Add Outcome Milestone Button (Author Only)]                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Discussion & Comments Thread (M5)                                │  │
│  │   • [Comment Input Box (Authenticated Users)]                    │  │
│  │   • Comment Card 1 (Author Badge / Timestamp / Actions)          │  │
│  │   • Comment Card 2                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Contracts & Endpoints

All endpoints follow standard Eside envelope format: `{ success: true, data: { ... } }` or `{ success: false, error: { code: string, message: string } }`.

### A. Outcomes API

#### 1. `GET /api/v1/experiences/[id]/outcomes`
- **Purpose**: Fetch all chronological outcome milestones for an experience.
- **Access**: Public for active experiences; Author-only for draft experiences.
- **Query / Params**: `id` (Experience UUID).
- **Response Format**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c1f7b0e2-8b9a-4c5d-9e1f-2a3b4c5d6e7f",
        "experience_id": "9403fdd6-9da8-4430-8f61-469055adcb1a",
        "days_after": 30,
        "content": "Started therapy and broke the pattern. Realized the initial panic was unfounded.",
        "created_at": "2026-08-31T12:00:00.000Z"
      },
      {
        "id": "d2a8c1f3-9c0b-5d6e-0f2a-3b4c5d6e7f8a",
        "experience_id": "9403fdd6-9da8-4430-8f61-469055adcb1a",
        "days_after": 90,
        "content": "Secured a new position in a completely different domain with better work-life balance.",
        "created_at": "2026-08-31T12:30:00.000Z"
      }
    ]
  }
  ```

#### 2. `POST /api/v1/experiences/[id]/outcomes`
- **Purpose**: Add a new outcome milestone to an owned experience.
- **Access**: Authenticated Author Only.
- **Request Body**:
  ```json
  {
    "days_after": 180,
    "content": "Full hindsight: leaving when I did saved two years of stagnation. Crucial lesson is to act early."
  }
  ```
- **Validation**:
  - `days_after`: Integer, $0 \le \text{days\_after} \le 3650$.
  - `content`: String, $10 \le \text{length} \le 5000$.
- **Response**: `201 Created` with the newly created outcome record.

---

### B. Comments API

#### 1. `GET /api/v1/experiences/[id]/comments`
- **Purpose**: Fetch all active comments on an experience ordered by `created_at ASC`.
- **Access**: Public for active experiences.
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "e3b9d2a4-0d1c-6e7f-1a3b-4c5d6e7f8a9b",
          "experience_id": "9403fdd6-9da8-4430-8f61-469055adcb1a",
          "content": "Your Day 90 realization gave me a lot of clarity on a similar situation I am facing.",
          "author": {
            "id": "11111111-2222-3333-4444-555555555555",
            "username": "SilentObserver",
            "avatar_url": null
          },
          "is_author": false,
          "created_at": "2026-08-31T13:00:00.000Z",
          "updated_at": "2026-08-31T13:00:00.000Z"
        }
      ],
      "total": 1
    }
  }
  ```

#### 2. `POST /api/v1/experiences/[id]/comments`
- **Purpose**: Submit a new constructive comment.
- **Access**: Authenticated users only.
- **Request Body**:
  ```json
  {
    "content": "Thank you for documenting the timeline. How did you approach the initial conversation?"
  }
  ```
- **Validation**:
  - `content`: String, $2 \le \text{length} \le 1500$.
- **Rate Limit**: Max 20 comments / hour per user.
- **Response**: `201 Created` with comment object.

#### 3. `PUT /api/v1/comments/[id]`
- **Purpose**: Update comment content.
- **Access**: Comment Author Only.
- **Validation**: `content`: $2 \le \text{length} \le 1500$.
- **Response**: `200 OK` with updated comment.

#### 4. `DELETE /api/v1/comments/[id]`
- **Purpose**: Soft-delete a comment.
- **Access**: Comment Author Only (or Platform Admin).
- **Operation**: Sets `deleted_at = NOW()`.
- **Response**: `200 OK` (`{ success: true, data: { id, deleted: true } }`).

---

## 3. Component Architecture

```text
src/components/
  ├── outcomes/
  │     ├── OutcomeTimeline.tsx           # Vertical connected milestone container
  │     ├── OutcomeMilestoneCard.tsx      # Individual timeline card with Day badge
  │     └── AddOutcomeModal.tsx           # Modal / drawer for author to append outcomes
  └── comments/
        ├── CommentSection.tsx            # Comments thread container & counter
        ├── CommentCard.tsx               # Individual comment with author chip, time & actions
        └── CommentInput.tsx              # Autogrowing text input with submission state
```

### Component Roles:
1. **`OutcomeTimeline`**:
   - Renders a clean vertical progression track (`Day 0 [Baseline Story]` $\rightarrow$ `Day 30` $\rightarrow$ `Day 90` $\rightarrow$ `Day 180`).
   - Uses distinct milestone colors (e.g. amber for early struggles, emerald for resolutions).
   - If the current viewer is the story author, renders a prominent **"Log Outcome Milestone"** trigger.
2. **`AddOutcomeModal`**:
   - Offers quick preset selector chips (`30 Days`, `90 Days`, `180 Days`, `1 Year`, `Custom`).
   - Validates input character length and prevents double submissions.
3. **`CommentSection`**:
   - Linear stream of constructive feedback.
   - Shows inline edit / delete controls only for comments authored by the current session user.
   - Displays unauthenticated CTA ("Sign in to join discussion") with redirect preserving return URL.

---

## 4. Authorization & Security Matrix

| Action | Target | Unauthenticated | Authenticated (Non-Author) | Story Author | Comment Author |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **View Outcomes** | Active Story | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **View Outcomes** | Draft Story | ❌ 404 | ❌ 404 | ✅ Allowed | ❌ 404 |
| **Add Outcome** | Any Story | ❌ 401 | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 |
| **View Comments** | Active Story | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Post Comment** | Active Story | ❌ 401 | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Edit Comment** | Comment | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |
| **Delete Comment**| Comment | ❌ 401 | ❌ 403 | ❌ 403 | ✅ Allowed |

---

## 5. RLS Policies & Database Interactions

Database tables (`public.outcomes` and `public.comments`) are already provisioned in the M2 schema with the following policies:

1. **`outcomes` Policies**:
   - `SELECT`: Allowed if parent experience is `status = 'active'` OR `auth.uid() = experiences.author_id`.
   - `INSERT`: Allowed only if `auth.uid() = experiences.author_id`.
   - `UPDATE / DELETE`: Allowed only if `auth.uid() = experiences.author_id`.
2. **`comments` Policies**:
   - `SELECT`: Allowed if `deleted_at IS NULL` and parent experience is `status = 'active'`.
   - `INSERT`: Allowed for authenticated users (`auth.uid() IS NOT NULL`).
   - `UPDATE / DELETE`: Allowed where `auth.uid() = author_id`.

---

## 6. Performance Considerations

1. **Composite Query Strategy**:
   - When loading `/experiences/[id]`, outcomes and comments count are fetched concurrently using `Promise.all` or sub-relation joins, keeping total server rendering time $< 400\text{ms}$.
2. **Index Optimization**:
   - Querying outcomes uses index on `outcomes(experience_id, days_after ASC)`.
   - Querying comments uses index on `comments(experience_id, created_at ASC)`.
3. **Payload Optimization**:
   - Comment author joins select strictly `id, username, avatar_url` (excluding sensitive columns).
