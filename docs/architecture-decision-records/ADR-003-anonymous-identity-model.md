# ADR-003

Decision:
Separate `auth.users` authentication data from `public.users` profile data and preserve anonymous handles.

Why:
- Preserves user anonymity while maintaining secure, email-verified accounts
- Prevents emails, real names, and authentication credentials from ever leaking into public queries
- Enforces case-insensitive username uniqueness (`idx_users_username_lower`) to prevent impersonation
- Allows authors to share vulnerable experiences safely without exposing their real identity

Alternatives:
- Storing all user details in a single custom table with public emails
- Mandatory real-name profiles
- Fully ephemeral unauthenticated posting without account persistence

Consequences:
- Requires a database trigger (`on_auth_user_created`) to auto-provision `public.users` on signup
- Guarantees zero email exposure in public API responses
- Enables users to revisit and update long-term outcome timelines while remaining anonymous to the community
