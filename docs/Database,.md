## Project

Eside

## Version

V1.0 MVP

---

# Database Philosophy

Eside uses:

- PostgreSQL
    
- Supabase
    
- Relational Data Model
    

Goals:

- Anonymous identity
    
- Structured experiences
    
- Outcome tracking
    
- Community discussions
    
- Moderation support
    
- Future analytics support
    

---

# Entity Relationship Overview

```text
users
  │
  ├── experiences
  │      │
  │      ├── comments
  │      ├── outcomes
  │      ├── reports
  │      └── experience_tags
  │
  └── reports

categories
  │
  └── experiences

tags
  │
  └── experience_tags
```

---

# Table: users

Purpose:

Stores platform users.

Authentication is handled by Supabase Auth.

Public profile data is stored separately.

## Columns

|Column|Type|Constraints|
|---|---|---|
|id|uuid|PK|
|username|varchar(30)|Unique|
|avatar_url|text|Nullable|
|bio|text|Nullable|
|created_at|timestamptz|Default now()|
|updated_at|timestamptz|Default now()|

## Indexes

```sql
username UNIQUE
```

---

# Table: categories

Purpose:

High-level experience categories.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|name|varchar(50)|
|description|text|
|created_at|timestamptz|

## Seed Data

- Education
    
- Career
    
- Relationships
    
- Family
    
- Finance
    
- Health
    
- Mental Wellbeing
    
- Social Life
    

---

# Table: experiences

Purpose:

Stores user experiences.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|author_id|uuid|
|category_id|uuid|
|title|varchar(150)|
|story|text|
|is_anonymous|boolean|
|status|varchar(20)|
|created_at|timestamptz|
|updated_at|timestamptz|

## Status Values

```text
active
hidden
reported
deleted
```

## Relationships

```text
author_id → users.id

category_id → categories.id
```

## Indexes

```sql
author_id
category_id
created_at DESC
```

---

# Table: tags

Purpose:

Reusable tags.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|name|varchar(50)|
|created_at|timestamptz|

## Examples

```text
failure
anxiety
breakup
career-change
bullying
loneliness
```

---

# Table: experience_tags

Purpose:

Many-to-many relationship.

## Columns

|Column|Type|
|---|---|
|experience_id|uuid|
|tag_id|uuid|

## Composite Key

```sql
(experience_id, tag_id)
```

---

# Table: comments

Purpose:

Discussion on experiences.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|experience_id|uuid|
|author_id|uuid|
|content|text|
|created_at|timestamptz|
|updated_at|timestamptz|

## Relationships

```text
experience_id → experiences.id

author_id → users.id
```

## Indexes

```sql
experience_id
created_at DESC
```

---

# Table: outcomes

Purpose:

Tracks what happened after the experience.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|experience_id|uuid|
|days_after|integer|
|content|text|
|created_at|timestamptz|

## Example

```text
Day 0:
Failed semester

Day 30:
Created study group

Day 90:
Cleared backlog

Day 180:
Improved SPI
```

## Relationships

```text
experience_id → experiences.id
```

---

# Table: reports

Purpose:

Stores moderation reports.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|reporter_id|uuid|
|experience_id|uuid|
|comment_id|uuid|
|reason|varchar(100)|
|status|varchar(20)|
|created_at|timestamptz|

## Status

```text
pending
reviewing
resolved
dismissed
```

## Reasons

```text
spam
harassment
hate_speech
misinformation
threats
privacy_violation
other
```

---

# Table: bookmarks

Purpose:

Saved experiences.

## Columns

|Column|Type|
|---|---|
|user_id|uuid|
|experience_id|uuid|
|created_at|timestamptz|

## Composite Key

```sql
(user_id, experience_id)
```

---

# Table: analytics_events

Purpose:

Future analytics tracking.

## Columns

|Column|Type|
|---|---|
|id|uuid|
|user_id|uuid|
|event_name|varchar(100)|
|entity_id|uuid|
|metadata|jsonb|
|created_at|timestamptz|

## Example Events

```text
experience_created

experience_viewed

experience_bookmarked

comment_created

outcome_added

report_created
```

---

# Row Level Security (RLS)

## Users

Rules:

```text
Users can read public profiles.

Users can update only their own profile.
```

---

## Experiences

Rules:

```text
Anyone can read active experiences.

Only owners can edit.

Only owners can delete.
```

---

## Comments

Rules:

```text
Anyone can read comments.

Only owner can delete own comment.
```

---

## Outcomes

Rules:

```text
Anyone can read outcomes.

Only experience owner can create updates.
```

---

## Reports

Rules:

```text
Only moderators can view reports.

Users can create reports.
```

---

# Cascading Rules

## Experience Deleted

Automatically delete:

```text
comments

outcomes

experience_tags

bookmarks

reports
```

---

# Future Expansion Tables (Not MVP)

Do NOT implement yet.

```text
followers

direct_messages

notifications

communities

community_members

reputation_scores

experience_similarity

recommendations
```

---

# Performance Targets

Experience Feed:

```text
< 500ms
```

Experience Detail:

```text
< 400ms
```

Category Filter:

```text
< 300ms
```

---

# Database Success Criteria

The database should support:

1. Anonymous profiles.
    
2. Experience creation.
    
3. Outcome tracking.
    
4. Community discussions.
    
5. Moderation workflows.
    
6. Future analytics expansion.
    

without requiring schema redesign during MVP.