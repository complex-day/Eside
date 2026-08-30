## Overview

Eside is an anonymous experience-sharing platform where users can share experiences, browse similar stories, contribute outcome updates, and learn from collective human experiences.

The system is designed for:

- Anonymous participation
    
- Community-driven content
    
- Structured experience categorization
    
- Long-term outcome tracking
    
- Future analytics and pattern discovery
    

---

# System Architecture

```text
Client (Web)

    ↓

Next.js Application

    ↓

Supabase

 ├── Authentication
 ├── PostgreSQL Database
 ├── Storage
 └── Realtime Services

    ↓

Analytics Layer (Future)

 ├── Experience Insights
 ├── Outcome Statistics
 └── Trend Detection
```

---

# Technology Stack

## Frontend

- Next.js
    
- TypeScript
    
- Tailwind CSS
    
- shadcn/ui
    

Reason:

- Fast development
    
- SEO support
    
- Large ecosystem
    
- Matches existing skill direction
    

---

## Backend

- Supabase
    

Services:

- Authentication
    
- PostgreSQL
    
- Storage
    
- Realtime
    

Reason:

- Rapid MVP development
    
- Minimal backend maintenance
    
- Built-in security policies
    

---

## Database

- PostgreSQL
    

Reason:

- Relational structure
    
- Complex querying
    
- Analytics friendly
    

---

## Hosting

Frontend:

- Vercel
    

Backend:

- Supabase Cloud
    

---

## Analytics

Phase 1:

- PostHog
    

Phase 2:

- Internal analytics service
    

---

# Core Components

## Authentication Service

Responsibilities:

- Registration
    
- Login
    
- Session management
    
- Identity protection
    

---

## Experience Service

Responsibilities:

- Create experience
    
- Edit experience
    
- Delete experience
    
- Fetch experience
    

---

## Category Service

Responsibilities:

- Category management
    
- Tag filtering
    
- Search support
    

---

## Outcome Service

Responsibilities:

- Create updates
    
- Link updates to experiences
    
- Generate timelines
    

---

## Moderation Service

Responsibilities:

- Reporting
    
- Review queue
    
- Content removal
    

---

# Security Requirements

## Authentication

- Email verification
    
- Secure sessions
    
- JWT handling by Supabase
    

---

## Privacy

- Anonymous usernames
    
- No public email exposure
    
- Row Level Security enabled
    

---

## Abuse Prevention

- Rate limiting
    
- Spam detection
    
- Report system
    

---

# Performance Goals

Feed Load:

< 500ms

Search:

< 300ms

Experience View:

< 400ms

---

# Scalability Strategy

Phase 1

- Single database
    
- Managed Supabase
    

Phase 2

- Read replicas
    
- Search indexing
    

Phase 3

- Dedicated analytics pipeline
    
- Event processing architecture
    

---

# Future Expansion

- Recommendation engine
    
- Experience similarity matching
    
- AI-assisted categorization
    
- Experience analytics dashboard


