# Agent Rules

## Project

Eside

## Purpose

These rules override default agent behavior.

All generated code, architecture decisions, database design, UI implementation, and feature recommendations must follow these rules.

---

# Rule 1: MVP First

Build only what is defined in:

```text
mvp-scope.md
```

Do not add features outside the approved MVP.

If a requested feature is not in scope, explain why and ask for approval before implementing.

---

# Rule 2: No Feature Creep

Do NOT implement:

* Direct Messages
* Group Chats
* Voice Rooms
* Video Calls
* Followers
* Following
* Friend Requests
* Notifications
* AI Therapist
* AI Companion
* AI Recommendations
* Premium Features
* Payments
* Subscriptions
* Ads
* Gamification
* Reputation Systems
* Streaks
* Badges
* Points

Unless explicitly approved.

---

# Rule 3: Architecture Simplicity

Prefer the simplest solution that satisfies requirements.

Avoid:

* Microservices
* Event-driven architectures
* Premature optimization
* Unnecessary abstractions

Use a monolithic Next.js application for MVP.

---

# Rule 4: Technology Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

Backend:

* Supabase

Database:

* PostgreSQL

Hosting:

* Vercel

Do not introduce alternative technologies without justification.

---

# Rule 5: Type Safety

Requirements:

* TypeScript strict mode
* No "any" types
* Shared types where possible

Every API response must be typed.

---

# Rule 6: Database Source of Truth

Follow:

```text
database.md
```

Exactly.

Do not invent tables.

Do not remove relationships.

Do not modify schema without explanation.

---

# Rule 7: API Source of Truth

Follow:

```text
api.md
```

Exactly.

Endpoints must match documented contracts.

Request and response formats must remain consistent.

---

# Rule 8: Mobile First

Design for:

```text
360px–430px
```

first.

Desktop enhancements come second.

---

# Rule 9: Accessibility

Minimum requirements:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Proper labels
* Contrast compliance

---

# Rule 10: Security

Never trust client input.

Validate all:

* Forms
* Query parameters
* Route parameters

Use server-side authorization checks.

Never expose secrets.

---

# Rule 11: Authentication

Use:

```text
Supabase Auth
```

Do not create custom authentication systems.

Do not store passwords manually.

---

# Rule 12: Authorization

Users may:

* Edit their own content
* Delete their own content

Users may not:

* Modify others' content

Enforce with database policies and backend checks.

---

# Rule 13: Moderation Compliance

Follow:

```text
moderation.md
```

exactly.

Do not invent moderation policies.

Do not ignore prohibited content definitions.

---

# Rule 14: Performance

Targets:

Feed:

```text
<500ms
```

Experience Page:

```text
<400ms
```

Search:

```text
<300ms
```

Avoid unnecessary database queries.

---

# Rule 15: Reusable Components

Create reusable components for:

* Experience Cards
* Comment Cards
* Category Chips
* Outcome Timeline
* Insight Cards

Avoid duplication.

---

# Rule 16: Code Quality

Requirements:

* Clear naming
* Small functions
* Meaningful comments only when necessary
* Consistent folder structure

Avoid overly clever solutions.

---

# Rule 17: Testing

Generate tests for:

* API routes
* Validation logic
* Critical business rules

Focus on reliability over test quantity.

---

# Rule 18: Analytics

Follow:

```text
analytics.md
```

Track only documented events.

Do not add unnecessary tracking.

---

# Rule 19: Learning-Friendly Code

The project owner must be able to understand the system.

When implementing major features:

* Explain architecture decisions
* Explain folder structure
* Explain database interactions

Prefer readability over cleverness.

---

# Rule 20: Ask Before Major Changes

Do not change:

* Database schema
* Authentication model
* Core architecture
* API contracts

without explicit approval.

---

# Rule 21: Conflict Resolution

If documents conflict, follow this priority:

```text
1. agent-rules.md
2. mvp-scope.md
3. prd.md
4. database.md
5. api.md
6. moderation.md
7. architecture.md
8. design.md
9. user-flows.md
10. analytics.md
```

---

# Rule 22: Success Definition

A successful implementation allows users to:

1. Register
2. Share experiences
3. Read experiences
4. Comment
5. Add outcomes
6. Report content
7. Discover insights

Nothing more is required for MVP.
