# ADR-001

Decision:
Use a monolithic Next.js App Router application instead of a separate frontend and backend service split.

Why:
- Faster MVP delivery with a unified codebase and shared TypeScript types
- Smaller deployment surface (single Vercel deployment)
- Easier solo maintenance with zero API gateway or CORS orchestration overhead
- Built-in Server Components, Server Actions, and Route Handlers fully satisfy MVP requirements

Alternatives:
- Next.js + Express API
- Next.js + NestJS
- Microservices / event-driven architecture

Consequences:
- Simpler development, testing, and deployment workflow
- Direct type sharing between UI components and server route handlers
- Requires architectural discipline to avoid coupling business logic to UI rendering
- Future backend service extraction (if ever needed) will require decoupling Route Handlers
