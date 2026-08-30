## Project

Eside

## Version

V1.0 MVP

---

# Purpose

This document defines how users move through the platform.

It acts as the behavioral blueprint for:

- UI Design
    
- Frontend Development
    
- Backend Development
    
- Testing
    
- AI Agents
    

Every feature should support one or more of these flows.

---

# User Types

## Visitor

Not authenticated.

Can:

- Browse experiences
    
- Read stories
    
- Search experiences
    
- View insights
    

Cannot:

- Comment
    
- Create experiences
    
- Create outcomes
    
- Bookmark
    

---

## Member

Authenticated user.

Can:

- Create experiences
    
- Comment
    
- Bookmark
    
- Create outcome updates
    
- Report content
    

---

## Moderator

Platform moderator.

Can:

- Review reports
    
- Remove content
    
- Suspend users
    

---

# Primary Flow

## Reader Journey

Goal:

Learn from real experiences.

Flow:

```text
Landing Page
      ↓
Trending Feed
      ↓
Open Experience
      ↓
Read Story
      ↓
Read Outcomes
      ↓
Read Comments
      ↓
Bookmark Experience
```

Success Condition:

```text
User finds useful information.
```

---

# Contributor Journey

Goal:

Share an experience.

Flow:

```text
Login
   ↓
Create Experience
   ↓
Select Category
   ↓
Add Tags
   ↓
Publish
   ↓
Receive Engagement
```

Success Condition:

```text
Experience becomes available in feed.
```

---

# Outcome Journey

Goal:

Document what happened later.

Flow:

```text
Open Existing Experience
        ↓
Add Outcome Update
        ↓
Select Timeline
        ↓
Publish Update
```

Available Timelines:

```text
30 Days

90 Days

180 Days
```

Success Condition:

```text
Outcome attached to original experience.
```

---

# Search Journey

Goal:

Find relevant experiences.

Flow:

```text
Search Bar
      ↓
Keyword Search
      ↓
Filter Results
      ↓
Open Experience
```

Example:

```text
semester failure

career switch

loneliness

family pressure
```

Success Condition:

```text
Relevant experiences discovered.
```

---

# Category Journey

Goal:

Explore similar experiences.

Flow:

```text
Open Category
      ↓
View Experiences
      ↓
Sort Results
      ↓
Read Experience
```

Example Categories:

```text
Education

Career

Relationships

Family

Health

Finance
```

---

# Insight Journey

Goal:

Understand patterns.

Flow:

```text
Open Insights
       ↓
Select Category
       ↓
View Statistics
       ↓
Discover Patterns
```

Example:

```text
Education

12,000 Experiences

Most Common Action:
Study Groups

Reported Success:
71%
```

Success Condition:

```text
User learns from collective outcomes.
```

---

# Bookmark Journey

Goal:

Save useful experiences.

Flow:

```text
Read Experience
      ↓
Bookmark
      ↓
Profile
      ↓
Saved Experiences
```

Success Condition:

```text
Experience accessible later.
```

---

# Comment Journey

Goal:

Participate in discussion.

Flow:

```text
Open Experience
      ↓
Write Comment
      ↓
Publish Comment
```

Success Condition:

```text
Comment visible in discussion.
```

---

# Reporting Journey

Goal:

Report harmful content.

Flow:

```text
Open Content
      ↓
Report
      ↓
Choose Reason
      ↓
Submit
```

Reasons:

```text
Spam

Harassment

Threats

Misinformation

Privacy Violation

Other
```

Success Condition:

```text
Content enters moderation queue.
```

---

# Registration Flow

Goal:

Create account.

Flow:

```text
Landing Page
      ↓
Register
      ↓
Email Verification
      ↓
Choose Username
      ↓
Profile Created
```

Success Condition:

```text
User reaches feed.
```

---

# Login Flow

Goal:

Access account.

Flow:

```text
Login
 ↓
Authentication
 ↓
Feed
```

Success Condition:

```text
Authenticated session created.
```

---

# Profile Flow

Goal:

Manage identity and content.

Flow:

```text
Profile
   ↓
View Experiences
   ↓
View Outcomes
   ↓
View Bookmarks
```

Success Condition:

```text
User manages personal content.
```

---

# Moderator Flow

Goal:

Handle reports.

Flow:

```text
Open Dashboard
       ↓
View Reports
       ↓
Review Content
       ↓
Approve or Remove
```

Success Condition:

```text
Reported content resolved.
```

---

# User Retention Loop

```text
Read Experience
      ↓
Learn Something
      ↓
Bookmark
      ↓
Return Later
      ↓
Share Own Experience
      ↓
Add Outcome Update
      ↓
Help Others
```

---

# MVP Critical Paths

The following paths must work perfectly before launch:

1. Registration
    
2. Login
    
3. Experience Creation
    
4. Experience Reading
    
5. Comment Creation
    
6. Outcome Creation
    
7. Search
    
8. Reporting
    

Failure in any of these paths blocks MVP launch.

---

# Flow Success Metrics

Reader:

```text
Experience Read
```

Contributor:

```text
Experience Published
```

Outcome Author:

```text
Outcome Added
```

Community:

```text
Comment Created
```

Platform:

```text
User Returns
```

---

# User Flow Success Definition

A successful Eside user journey allows someone to:

1. Find a relevant experience.
    
2. Learn from outcomes.
    
3. Participate anonymously.
    
4. Share their own experience.
    
5. Contribute back to collective knowledge.