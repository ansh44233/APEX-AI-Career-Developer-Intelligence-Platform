# APEX

### AI Career & Developer Intelligence Platform

APEX is an early-stage career preparation platform bringing interview practice, coding assessments, company research, resume review and developer workflows into one connected workspace.

## Product experiences

- **Interview Lab** — technical and behavioural interview practice prototype.
- **OA Arena** — coding assessment practice prototype.
- **Company Intelligence** — company and role research workspace prototype.
- **Resume Intelligence** — local resume and job-description keyword comparison prototype.
- **System Design Studio** — architecture practice workspace prototype.
- **Career Readiness Engine** — self-reported skill assessment prototype.
- **Project Defense** — project-context and code-explanation interview practice preview using deterministic question templates.

Interview Lab now supports authenticated persistent sessions and saved written attempts when PostgreSQL is configured. Its evaluation rubric remains self-review only; no AI grading is connected. Other feature experiences are prototypes. Sample and self-entered scores are not hiring predictions.

## Stack

- Next.js 15 App Router, React 19 and TypeScript
- Tailwind CSS and Lucide
- PostgreSQL with Prisma 6
- Better Auth with the Prisma adapter
- Zod validation

## Local setup

Requirements: Node.js 20 or newer and PostgreSQL.

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and configure:
   - `DATABASE_URL` — PostgreSQL connection string.
   - `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`.
   - `BETTER_AUTH_URL` — local origin, normally `http://localhost:3000`.

3. Generate the Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
npm run db:deploy
```

Use `db:migrate` for local development and `db:deploy` to apply committed migrations in a deployment environment.

## Authentication

- `/sign-up` — create an account with email and password.
- `/sign-in` — sign in.
- `/api/auth/*` — Better Auth handlers.
- `GET /api/auth/session` — safe current-session profile or 401.
- `DELETE /api/auth/session` — sign out the current session.

Email/password authentication is implemented in the application code. Email verification is currently disabled because no email delivery provider is configured. Do not use real accounts in a public deployment until email verification, password recovery, rate-limit monitoring and production secrets are configured.

The second database migration invalidates any sessions created by the earlier custom session primitive; it preserves user and career/practice records.

## Career goals API

- `GET /api/career-goals` — list the authenticated user's goals.
- `POST /api/career-goals` — create a goal.
- `PATCH /api/career-goals/:id` — update an owned goal.
- `DELETE /api/career-goals/:id` — delete an owned goal.

The dashboard includes a persistent career-goals panel for signed-in users. The existing sample metrics and activity list are still illustrative.

## Practice API

- `GET /api/practice/sessions` — list the authenticated user's sessions.
- `POST /api/practice/sessions` — create an owned practice session.
- `GET /api/practice/sessions/:id/attempts` — list attempts for an owned session.
- `POST /api/practice/sessions/:id/attempts` — add an attempt to an owned, open session.
- `PATCH /api/practice/sessions/:id` — complete or abandon an owned session.

Every request derives ownership from the Better Auth server-side session. The API never accepts a user ID from the request body.

## Service endpoints

- `GET /api/health` — reports web/API and configured service status.
- `GET /api/ready` — checks database connectivity and returns HTTP 503 if unavailable.

## Current limitations

- PostgreSQL has not yet been provisioned or connected for this repository.
- Dependencies have not yet been installed and migrations have not been applied.
- Authentication has not yet been integration-tested end-to-end.
- Email verification and password recovery delivery are not configured.
- No AI provider, model evaluations, usage controls or background jobs.
- Interview Lab is connected to persistent practice APIs, but requires a configured database; its rubric is not AI feedback. Other feature pages remain interactive prototypes.
- Project Defense does not connect to GitHub or scan repositories; its questions are fixed templates and its workspace is not persisted.
- No deployment has been performed.

## Security principles

- Keep database, authentication and AI secrets server-side.
- Never commit real credentials or expose secrets with a `NEXT_PUBLIC_` prefix.
- Validate untrusted input and cap request sizes.
- Authorize every user-owned record on the server.
- Avoid logging passwords, tokens, private resume text or practice responses.
- Add retention, export and deletion controls before collecting sensitive user content.

## License

License to be decided.
