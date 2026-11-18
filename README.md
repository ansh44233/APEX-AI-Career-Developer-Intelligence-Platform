# APEX

### AI Career & Developer Intelligence Platform

APEX is an early-stage career preparation platform bringing interview practice, coding assessments, company research, resume review and developer workflows into one connected workspace.

## Product experiences

- **Interview Lab** — technical and behavioural interview practice prototype.
- **OA Arena** — coding assessment workspace with persistent sessions and saved approach/code notes; no code execution or automated grading.
- **Company Intelligence** — company/role preparation brief with browser-local job-description skill-term detection and practice links; company profiles are illustrative, not live hiring data.
- **Resume Intelligence** — browser-local job-description skill-term matching, resume comparison and linked preparation suggestions; no ATS score or AI analysis.
- **System Design Studio** — architecture practice workspace prototype.
- **Career Readiness Engine** — self-reported skill assessment prototype.
- **Project Defense** — project-context and code-explanation interview practice preview using deterministic question templates.
- **Offer Intelligence** — browser-local comparison of up to three offers with separate compensation fields and a user-weighted preference matrix.
- **APEX Skills** — five portable Agent Skills for interview prep, coding practice, system design, project review and resume coaching, with public read-only discovery and instruction retrieval endpoints.
- **Agent Workbench** — authenticated multi-turn AI coaching with user-owned saved conversations, recent-turn context, per-conversation deletion and a server-configured OpenAI-compatible Chat Completions provider. Includes two deterministic text tools, AI-generated allowlisted tool proposals, and an explicit human approval step; no shell, browser, repository or code execution, and no cross-conversation memory.

Interview Lab and OA Arena support authenticated persistent practice sessions and saved written attempts when PostgreSQL is configured. Interview self-review and coding approach checklists are manual only; AI grading and code execution are not connected. Other feature experiences are prototypes. Sample and self-entered scores are not hiring predictions.

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
   - `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` — optional server-side configuration for the Agent Workbench. The provider base URL defaults to `https://api.openai.com/v1`; the endpoint must support the Chat Completions request/response shape.

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

## Learning intelligence

- `GET /api/intelligence/recommendations` — returns explainable next-step suggestions based on latest self-assessments and saved practice recency/coverage.
- `GET /api/intelligence/topics` — groups the latest 500 saved attempts by exact prompt within each module, reporting revisits and explicitly recorded scores.
- `GET /api/intelligence/adaptive` — suggests revisits for prompts untouched for 21+ days and reviews prompts whose latest explicitly recorded score is lower than the previous score.
- `GET /api/intelligence/role-coverage` — maps active career goals to built-in role skill templates and reports which template skills have a recorded self-assessment. Coverage is assessment completion, not proficiency or job readiness.
- `GET /api/intelligence/roadmap` — creates missing role-template preparation tasks for active goals and returns saved task progress.
- `PATCH /api/intelligence/roadmap/:id` — updates an owned roadmap task to `todo`, `in_progress`, or `completed`.
- The dashboard includes a Preparation Roadmap panel. Task completion is user-reported progress, not proof of skill mastery.
- The dashboard includes Topic Intelligence, Adaptive Learning and Skill-to-Role Coverage panels. Score comparisons are descriptive only; they do not prove learning or ability, and unscored attempts are never treated as zero.
- Per-module activity includes saved session and attempt counts, recent-session counts and last-practised dates.
- Recommendations are deterministic and transparent; activity counts are not treated as proficiency, and unscored responses are not used to infer weaknesses.

See [APEX Learning Intelligence](docs/apex-learning-intelligence.md) for the rules and limitations.

## Service endpoints

- `GET /api/health` — reports web/API and configured service status.
- `GET /api/ready` — checks database connectivity and returns HTTP 503 if unavailable.

## Current limitations

- PostgreSQL has not yet been provisioned or connected for this repository.
- Dependencies have not yet been installed and migrations have not been applied. Apply migrations `0003_career_roadmap_tasks` and `0004_agent_conversations` before using Preparation Roadmap and persistent Agent Workbench conversations.
- Authentication has not yet been integration-tested end-to-end.
- Email verification and password recovery delivery are not configured.
- Agent Workbench stores conversations and the latest 12 messages are used as model context. It requires migration `0004_agent_conversations`; no provider is configured by default. Two deterministic text tools and AI-generated proposals with a human approval step are implemented in code; arbitrary tool calling, shell, browser, repository access, code execution, cross-conversation memory, shared rate limits, usage budgets, streaming and background jobs are not implemented.
- Resume Intelligence uses a limited built-in skill vocabulary and browser-local phrase matching. It does not understand context, verify skills, produce an ATS score or save resume/job-description text.
- Company Intelligence uses static illustrative profiles for Google, Microsoft and Amazon plus browser-local job-description matching. It does not fetch live vacancies or verify company-specific hiring requirements.
- Offer Intelligence keeps entered details in browser page state and calculates a subjective weighted preference score from user ratings. It does not provide salary benchmarks, tax calculations, equity valuations, external research or saved comparisons.
- Interview Lab and OA Arena are connected to persistent practice APIs, but require a configured database. Neither AI interview grading nor code execution/automated test evaluation is implemented.
- Project Defense does not scan repositories; its questions are fixed templates and its workspace is not persisted. Agent Workbench can inspect metadata for public GitHub repositories, but does not yet fetch source files, perform code review or access private repositories.
- APEX Skills are instruction packs, not autonomous agents or model/API integrations. Agent discovery support varies; see [APEX Skills setup](docs/apex-skills.md).
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

See [APEX Topic Intelligence](docs/apex-topic-intelligence.md) for grouping rules and limitations.

See [APEX Adaptive Learning Engine](docs/apex-adaptive-learning.md) for the signal rules and limitations.

See [APEX Skill-to-Role Coverage](docs/apex-role-coverage.md) for role templates, assessment coverage rules and limitations.

See [APEX Preparation Roadmap](docs/apex-preparation-roadmap.md) for task generation, progress tracking and limitations.


See [APEX Job Description Intelligence](docs/apex-job-description-intelligence.md) for matching rules, privacy behaviour and limitations.


See [APEX Company Intelligence](docs/apex-company-intelligence.md) for company profile scope, local matching behaviour, privacy and limitations.


See [APEX Offer Intelligence](docs/apex-offer-intelligence.md) for the comparison method, privacy behaviour and limitations.


See [APEX Skills](docs/apex-skills.md) for installation, supported workspace conventions, skill scope and limitations. Browse the [skill catalog](skills/README.md).

The read-only skill registry is available at `GET /api/skills`; fetch a registered skill at `GET /api/skills/{slug}`. See [the registry API contract](docs/apex-skills-registry-api.md).

See [APEX Agent Workbench](docs/apex-agent-workbench.md) for provider configuration, endpoint details, runtime boundaries and production requirements.

See [APEX Agent Conversations](docs/apex-agent-conversations.md) for storage, API, context boundaries and deletion behaviour.
\n\nSee [APEX Controlled Tool Execution](docs/apex-tool-execution.md) for the allowlisted tool API, approval contract and security boundaries.\n
See [APEX AI Tool Approval](docs/apex-ai-tool-approval.md) for the proposal endpoint, approval flow and security boundaries.

See [APEX GitHub Public Repository Intelligence](docs/apex-github-public-repository-intelligence.md) for the endpoint, data returned and security limitations.
