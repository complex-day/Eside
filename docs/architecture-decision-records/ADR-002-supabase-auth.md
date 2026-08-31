# ADR-002

Decision:
Use Supabase Auth as the managed identity and authentication provider.

Why:
- Native integration with PostgreSQL Row Level Security (RLS) policies via `auth.uid()`
- Eliminates the security liabilities of building custom authentication and storing manual password hashes
- Built-in JWT token issuance and `@supabase/ssr` Next.js cookie synchronization
- Out-of-the-box email confirmation and secure session refresh flows

Alternatives:
- NextAuth / Auth.js with custom database adapter
- Custom JWT authentication with bcrypt password hashing
- Auth0 / Clerk

Consequences:
- Authentication relies on Supabase Auth token format and infrastructure
- Eliminates custom token signing and session management boilerplate
- Directly compatible with PostgreSQL database policies
