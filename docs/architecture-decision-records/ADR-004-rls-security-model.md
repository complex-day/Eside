# ADR-004

Decision:
Enforce all data authorization and multi-tenant isolation at the database engine level using PostgreSQL Row Level Security (RLS) policies.

Why:
- Defense-in-depth security: Even if an API endpoint or Server Component has a bug, unauthorized access is blocked by PostgreSQL
- Direct integration with Supabase Auth (`auth.uid()`)
- Eliminates redundant manual ownership verification queries across API route handlers
- Database-enforced rule that users can only modify or delete their own experiences, comments, outcomes, and bookmarks

Alternatives:
- Application-level middleware checks only
- Object-Relational Mapping (ORM) authorization middleware
- Standalone authorization proxy service

Consequences:
- Authorization policies reside in version-controlled SQL migrations rather than application code
- Eliminates data leakage risks across all client-side and server-side data fetching queries
- Requires careful policy indexing to maintain sub-500ms feed and sub-300ms category query performance
