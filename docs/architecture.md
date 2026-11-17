# APEX backend architecture

## Current state

The repository currently contains a Next.js frontend prototype and interactive, client-side feature previews. The API health endpoint is the first server-side foundation. No database, authentication provider, AI provider, code runner, or user data persistence is connected yet.

## Proposed architecture

- **Web application:** Next.js App Router for pages and server-rendered experiences.
- **API layer:** Route handlers under `src/app/api`; validate inputs at every boundary and keep privileged operations server-side.
- **Identity:** Add a managed authentication provider after choosing the provider and configuring callback URLs and secrets.
- **Database:** PostgreSQL for users, profiles, practice sessions, assessments, saved plans, and progress history. Use migrations and per-user authorization checks.
- **AI orchestration:** A server-only service layer for interview feedback, resume analysis, company research synthesis, and learning plans. Keep provider keys out of browser bundles.
- **Code execution:** Isolated, resource-limited execution service. Never execute submitted code inside the Next.js web process.
- **Observability:** Structured server logs, request IDs, error monitoring, and health/readiness checks.

## Implementation sequence

1. API health and environment template.
2. Choose and configure authentication and PostgreSQL providers.
3. Add schema, migrations, and authenticated user-scoped data access.
4. Add AI provider abstraction, request validation, quotas, and safe error handling.
5. Persist practice sessions and readiness history.
6. Integrate isolated code execution only after its security boundary is designed.
7. Add automated tests and deployment checks.

## Security requirements

- Do not commit `.env.local` or real API keys.
- Do not expose secrets through `NEXT_PUBLIC_*` variables.
- Authorize every read and write against the authenticated user.
- Validate and limit request payloads; apply rate limits to expensive operations.
- Treat model output and user-submitted content as untrusted.
- Do not run arbitrary code in the application server.
- Keep demo data clearly labelled until replaced by verified, user-scoped data.

## Environment variables

See `.env.example`. Empty values are intentional placeholders, not working credentials.
