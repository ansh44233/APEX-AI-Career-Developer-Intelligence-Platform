# APEX backend architecture

## Current state

The Next.js application exposes GET /api/health. This is an application-process health check only. It does not imply that a database, authentication provider, AI model, or background worker is connected.

## Target architecture

Keep the first production backend inside the existing Next.js application:

- **Web and HTTP API:** Next.js App Router pages and Route Handlers.
- **Database:** PostgreSQL, accessed only from server-side modules through a typed data-access layer.
- **Authentication:** a maintained authentication library with secure, HTTP-only session cookies. Never trust a user ID supplied by the browser as proof of identity.
- **AI orchestration:** server-side provider adapter with timeouts, input limits, usage accounting, and redacted logs.
- **File handling:** private object storage for resume uploads; validate file type and size and avoid public URLs by default.
- **Background work:** introduce a durable queue/workflow only when long-running analysis or indexing requires it.

The database and authentication vendors are intentionally not locked in yet. Select them after reviewing pricing, data location, account ownership, privacy terms, and the deployment environment.

## First domain boundaries

1. **Identity:** users, sessions, account settings.
2. **Preparation:** goals, target roles, practice sessions, answers and feedback.
3. **Career intelligence:** company research, job targets and readiness evidence.
4. **Developer intelligence:** repositories, project evidence and system-design work.
5. **Platform operations:** usage limits, audit events and safety controls.

Keep domain logic out of React components. Route handlers should authenticate, validate input, call a domain service, and return a stable response shape.

## API conventions

- Use /api/<resource> and the HTTP method that matches the operation.
- Validate all untrusted input on the server.
- Return predictable JSON errors with a safe public message and a request identifier.
- Enforce ownership checks on every read and write.
- Add pagination and bounded query sizes to collection endpoints.
- Never expose provider keys, stack traces, internal prompts, or database errors to clients.
- Add rate limits before enabling expensive AI or upload endpoints.

## Health checks

GET /api/health reports the web process status and explicitly reports which external capabilities are not connected. Once infrastructure is added, a separate readiness check can test required dependencies without exposing secrets.

## Delivery sequence

1. Health endpoint and API conventions.
2. Choose and provision PostgreSQL and authentication.
3. Add migrations, typed data access, and user-owned records.
4. Add authenticated practice-session APIs.
5. Add AI provider abstraction and usage/rate controls.
6. Add private resume storage and background processing where needed.
7. Add integration tests, observability, backup/restore checks, and production deployment review.

## Security baseline

APEX handles career documents and potentially private project information. Apply least privilege, secure cookies, CSRF protections where applicable, strict authorization, secret management, retention controls, and explicit user consent before connecting external repositories or AI providers.
