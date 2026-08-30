## Project

Eside

## Version

V1.0 MVP

---

# Purpose

This document defines:

- What user actions are tracked
    
- How success is measured
    
- What metrics determine MVP validation
    
- What events must be implemented
    

The purpose of analytics is not reporting.

The purpose is answering:

> "Should we continue building Eside?"

---

# Analytics Philosophy

Track only data that helps make product decisions.

Avoid vanity metrics.

Bad Metrics:

```text
Page Views

Total Visits

Impressions
```

Good Metrics:

```text
Experiences Created

Outcome Updates

Return Users

Experience Completion Rate
```

---

# North Star Metric

## Experience Learning Sessions

Definition:

A user reads an experience and reaches the outcome section.

Formula:

```text
Experience Opened
AND
Outcome Viewed
```

Reason:

This measures whether users are actually learning from experiences.

---

# Core Product Metrics

## Acquisition

Questions:

```text
Are people discovering Eside?
```

Metrics:

- New Users
    
- Registrations
    
- Registration Conversion Rate
    

---

## Activation

Questions:

```text
Do users get value quickly?
```

Metrics:

- First Experience Read
    
- First Bookmark
    
- First Comment
    
- First Experience Created
    

---

## Retention

Questions:

```text
Do users come back?
```

Metrics:

- Day 1 Retention
    
- Day 7 Retention
    
- Day 30 Retention
    

Formula:

```text
Returning Users
/
Total Users
```

---

## Contribution

Questions:

```text
Are users creating content?
```

Metrics:

- Experiences Created
    
- Comments Created
    
- Outcomes Created
    

---

## Knowledge Growth

Questions:

```text
Is the experience database growing?
```

Metrics:

- Total Experiences
    
- Total Outcomes
    
- Total Categories Used
    
- Total Tags Used
    

---

# Event Tracking

Every important user action becomes an event.

---

# Authentication Events

## User Registered

Event:

```text
user_registered
```

Properties:

```json
{
  "source": "landing_page"
}
```

---

## User Logged In

Event:

```text
user_logged_in
```

---

# Experience Events

## Experience Created

Event:

```text
experience_created
```

Properties:

```json
{
  "category": "Education",
  "anonymous": true
}
```

---

## Experience Viewed

Event:

```text
experience_viewed
```

Properties:

```json
{
  "experience_id": "uuid"
}
```

---

## Experience Bookmarked

Event:

```text
experience_bookmarked
```

---

# Outcome Events

## Outcome Added

Event:

```text
outcome_created
```

Properties:

```json
{
  "days_after": 30
}
```

---

## Outcome Viewed

Event:

```text
outcome_viewed
```

Purpose:

Measures learning behavior.

---

# Comment Events

## Comment Created

Event:

```text
comment_created
```

---

## Comment Deleted

Event:

```text
comment_deleted
```

---

# Search Events

## Search Performed

Event:

```text
search_performed
```

Properties:

```json
{
  "query": "semester failure"
}
```

---

## Search Result Opened

Event:

```text
search_result_opened
```

---

# Category Events

## Category Viewed

Event:

```text
category_viewed
```

Properties:

```json
{
  "category": "Education"
}
```

---

# Reporting Events

## Report Submitted

Event:

```text
report_created
```

Properties:

```json
{
  "reason": "spam"
}
```

---

# Funnel Tracking

## Reader Funnel

```text
Landing Page
     ↓
Feed Opened
     ↓
Experience Opened
     ↓
Outcome Viewed
```

Track conversion between each step.

---

## Contributor Funnel

```text
Register
   ↓
Create Experience
   ↓
Publish Experience
   ↓
Receive Comment
   ↓
Add Outcome
```

---

# Retention Funnels

## 7-Day Retention

```text
Day 0 User
      ↓
Returns Within 7 Days
```

Target:

```text
20%+
```

---

## 30-Day Retention

Target:

```text
30%+
```

---

# MVP Validation Metrics

The MVP is considered validated if:

---

## User Growth

```text
100+ Registered Users
```

---

## Experience Creation

```text
300+ Experiences
```

---

## Outcome Participation

```text
25%+ Authors Add Outcomes
```

---

## Reading Behavior

```text
60%+ Experience Readers
Reach Outcome Section
```

---

## Retention

```text
30%+ Monthly Retention
```

---

# Dashboard Requirements

## Founder Dashboard

Display:

```text
Users

Experiences

Comments

Outcomes

Retention

Reports

Top Categories
```

---

## Category Dashboard

Display:

```text
Category Name

Experience Count

Outcome Count

Most Common Tags
```

---

# Metrics To Ignore During MVP

Do NOT optimize for:

```text
Followers

Likes

Shares

Time on Site

Profile Views
```

Reason:

These do not validate the core hypothesis.

---

# Product Decision Rules

## Continue Building

If:

```text
Retention > 30%

Outcome Participation > 25%
```

---

## Rework Product

If:

```text
Many Readers
Few Contributors
```

---

## Pivot

If:

```text
Low Retention

Low Experience Creation

Low Outcome Updates
```

---

# Analytics Success Definition

Analytics is successful when it can answer:

1. Are users learning from experiences?
    
2. Are users returning?
    
3. Are users contributing outcomes?
    
4. Is the experience database growing?
    
5. Should Eside continue development or pivot?