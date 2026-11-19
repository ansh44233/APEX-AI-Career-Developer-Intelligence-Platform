# APEX backend architecture

## Current implementation

APEX is a Next.js 15 App Router application with React 19 and TypeScript. The workspace includes authenticated Better Auth flows, PostgreSQL persistence through Prisma, user-scoped career and practice APIs, server-side AI provider abstraction, rate-limited AI endpoints, and browser-first practice experiences.

Current capabilities are deliberately differentiated:
- Practice sessions and written attempts can be persisted for the authenticated user.
- Agent Workbench stores user-owned conversations and calls an OpenAI-compatible chat-completions provider when all AI environment settings are configured.
- Interview Studio and Question Bank generation require the AI provider configuration and enforce server-side validation and rate limits.
- OA Arena saves code or pseudocode as text and supports a separately labelled static AI review. It does not execute submitted code or claim automated test results.
- Resume and job-description phrase matching in the browser is not an ATS score or proof of skill proficiency.
- Company evidence is provenance-aware and approval-gated before appearing as verified employer evidence.

## Application architecture

- **Web application:** Next.js App Router pages and React client experiences.
- **API layer:** Route handlers under `src/app/api`; Zod validation, authentication, user ownership checks and rate limits are applied at supported boundaries.
- **Identity:** Better Auth, configured through server-only environment variables.
- **Database:** PostgreSQL and Prisma migrations for identity, career goals, practice sessions, job intelligence, interview experiences, evidence, and related records.
- **AI orchestration:** Server-only OpenAI-compatible Chat Completions provider. Configure `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` together. Keys must never be exposed through `NEXT_PUBLIC_*`.
- **Code execution:** Question Bank can submit source code and custom stdin to an optional, separately hosted Judge0-compatible runner configured with server-only `JUDGE0_API_URL` and optional `JUDGE0_API_KEY`. The Next.js process never executes submitted code. Requests are authenticated, rate-limited, bounded, and given CPU/memory limits at the runner. Without runner configuration, execution returns an explicit unavailable response. Custom-input runs are not hidden-test grading; objective correctness grading still requires authored/validated test cases.
- **Quality:** TypeScript checks, Vitest tests, Prisma validation/migrations and Playwright browser tests are wired into the GitHub Actions quality workflow.

## Local development

1. Install Node.js 22 and PostgreSQL 16 or a compatible PostgreSQL service.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL`, a unique `BETTER_AUTH_SECRET` of at least 32 characters, and `BETTER_AUTH_URL=http://localhost:3000`.
4. Install dependencies with `npm install`.
5. Generate Prisma Client with `npx prisma generate`.
6. Apply the existing migrations to your local development database with `npx prisma migrate deploy`.
7. Start the app with `npm run dev` and open `http://localhost:3000`.
8. For AI features, set all three AI provider variables in `.env.local`. Leave all three empty to run without AI provider features.

Use a dedicated local development database. Never point a local migration command at production or a shared database. Do not commit `.env.local` or real credentials.

## Security requirements

- Keep credentials server-side; never expose secrets through `NEXT_PUBLIC_*`.
- Authorize every read and write against the authenticated user.
- Validate and bound request payloads; apply rate limits to expensive operations.
- Treat model output and user-submitted content as untrusted.
- Do not execute arbitrary code in the application server.
- Keep generated, inferred, user-entered, and moderator-approved evidence clearly distinguished.
- Review schema changes and migrations before applying them to shared or production databases.

## Environment variables

See `.env.example`. Empty AI variables are intentional placeholders, not working credentials.
