# APEX

### AI Career & Developer Intelligence Platform

APEX is an early-stage career preparation platform bringing interview practice, coding assessments, company research, resume review and developer workflows into one connected workspace.

## Product vision

See [APEX Product Vision](docs/apex-product-vision.md) for the platform north star, capability benchmark, quality rules and phased roadmap.

## Product experiences

- **Mock Interview Engine** — structured APEX-authored behavioural, technical and system-design rounds, browser-local suggested timers, saved written answers, self-reported review ratings and goal-linked session history. Adaptive Interview Intelligence analyses saved prompt coverage and learner-entered ratings to suggest a next practice prompt; it does not grade answer content or make employer-question claims.\n- **Interview Lab** — technical and behavioural interview practice prototype.
- **Interview Question Bank** — searchable APEX-authored starter questions across DSA, JavaScript, React, backend/API design, databases, CS fundamentals, system design, behavioural interviews and project defence; includes difficulty filters, hints, answer rubrics, follow-ups and practice-history saving.
- **Intelligent Interview Preparation** — company/role-specific preparation workspace that turns only moderator-approved employer evidence claims into original practice prompts, preserves source passages and links, and saves answers in existing authenticated practice sessions. APEX-authored prompts are never presented as verified employer interview questions.\n- **Interview Experiences** — moderated first-hand community reports with company/role/round filters, optional HTTPS citations and pending-by-default submissions. Public listing exposes only moderator-approved reports; server-side moderator roles, a review queue and duplicate fingerprints are implemented. Rate limiting and an append-only audit log remain future work.
- **OA Arena** — coding assessment workspace with persistent sessions and saved approach/code notes; no code execution or automated grading.
- **Job-to-Preparation Intelligence** — compares a saved job description with resume text entirely in the browser, creates a persistent job-specific checklist, tracks task progress and links detected requirements to relevant practice modules. Resume text is never sent to the server; phrase matching is limited and does not certify proficiency.
- **Job Intelligence** — authenticated, user-owned job tracker with pasted descriptions, limited-vocabulary skill detection, optional career-goal linking and application status tracking. It does not crawl job boards, claim listings are live, provide an ATS score or infer candidate proficiency.
- **Company Intelligence** — searchable directory of 19 companies, role/experience selectors, browser-local job-description matching and a provenance-aware evidence trail. Authenticated users can capture bounded HTML snapshots from registered employer sources; snapshots are persisted as pending, reviewed by moderators, and only approved snapshots appear in company evidence. Moderators can curate role-scoped claims with exact source passages; only separately approved claims are displayed for matching company/role selections. Employer links, approved community reports and APEX-authored practice remain separate. No live vacancy feed or verified interview-loop claims.
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

## Interview experience moderation

- `GET /api/interview-experiences` — public approved reports only.
- `POST /api/interview-experiences` — authenticated first-hand report submission; duplicate fingerprints return HTTP 409.
- `GET` and `PATCH /api/admin/interview-experiences` — moderator/admin-only review queue and approve/reject actions.
- `/features/moderation/interview-experiences` — moderator review dashboard.
- User roles default to `user`; promotion to `moderator` or `admin` is a controlled database operation, never a public API action.

See [Interview Experience Moderation](docs/apex-interview-experience-moderation.md). Apply migrations `0005_interview_experience_reports` and `0006_interview_experience_moderation` before using this feature.

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
- Dependencies have not yet been installed and migrations have not been applied. Apply migrations `0003_career_roadmap_tasks`, `0004_agent_conversations`, `0005_interview_experience_reports` and `0006_interview_experience_moderation` before using their corresponding modules.
- Authentication has not yet been integration-tested end-to-end.
- Email verification and password recovery delivery are not configured.
- Agent Workbench stores conversations and the latest 12 messages are used as model context. It requires migration `0004_agent_conversations`; no provider is configured by default. Two deterministic text tools and AI-generated proposals with a human approval step are implemented in code; arbitrary tool calling, shell, browser, repository access, code execution, cross-conversation memory, shared rate limits, usage budgets, streaming and background jobs are not implemented.
- Resume Intelligence uses a limited built-in skill vocabulary and browser-local phrase matching. It does not understand context, verify skills, produce an ATS score or save resume/job-description text.
- Company Intelligence uses static illustrative profiles for Google, Microsoft and Amazon plus browser-local job-description matching. It does not fetch live vacancies or verify company-specific hiring requirements.
- Offer Intelligence keeps entered details in browser page state and calculates a subjective weighted preference score from user ratings. It does not provide salary benchmarks, tax calculations, equity valuations, external research or saved comparisons.
- Interview Lab and OA Arena are connected to persistent practice APIs, but require a configured database. Neither AI interview grading nor code execution/automated test evaluation is implemented.
- Project Defense does not scan repositories; its questions are fixed templates and its workspace is not persisted. Agent Workbench can inspect public GitHub repository metadata, preview bounded allowlisted text source files, and run deterministic single-file maintainability heuristics. It can map a bounded sample of source-file imports and run deterministic single-file maintainability heuristics. It also offers opt-in, bounded AI review of a selected public source file or a group of 2–5 selected public source files when an AI provider is configured; multi-file findings are validated structured results with severity and confidence labels; the source preview can also draft opt-in, single-file AI patch proposals for human inspection without applying repository changes, with source-SHA freshness checks, unified-diff applicability validation, and session-only review decisions. It also provides bounded static test-framework discovery, test-file listing and heuristic filename-based source-to-test hints, plus opt-in AI test-draft generation for a selected public source file, and bounded static test-quality signals for skipped/focused tests, duplicate titles, assertion patterns, possible filename-based test gaps and source-derived scenario gap hints, and a bounded source-to-test traceability matrix, risk-ranked module test planning, candidate dependency hints, Markdown/JSON plan export, and a session-only editable test plan workspace with statuses, notes, filters, custom scenarios and exports, plus a read-only test execution preflight that discovers candidate runners while keeping code execution disabled until an isolated sandbox is configured. Drafts are schema-validated but not compiled, executed, saved or committed. It does not execute code, run tests, report test outcomes, perform a complete security audit, or access private repositories.
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


See [APEX GitHub Public Repository Intelligence](docs/apex-github-public-repository-intelligence.md) for test discovery scope and limitations.


Company Intelligence now supports persistent employer-source snapshots, moderator-reviewed role-scoped evidence claims, and evidence-backed preparation roadmap tasks. Roadmap evidence tasks require an exact company/role match and retain the approved source passage and snapshot link; they are preparation suggestions, not guarantees of hiring criteria.


APEX also includes a connected Career Intelligence Graph on the dashboard, joining active career goals with moderator-approved company evidence, user-entered skill assessments, goal-linked practice activity and preparation roadmap progress. Its links and keyword mappings are transparent and descriptive, not predictions of hiring outcomes or skill proficiency.


Practice-to-goal linking is available when starting new Interview Lab and OA Arena sessions: the learner can select an active career goal or leave the session as general practice. The existing practice-session API validates that a supplied goal belongs to the signed-in user. Existing sessions are not retroactively assigned to goals.
\n\nSee [APEX Intelligent Interview Preparation](docs/apex-intelligent-interview-preparation.md) for the evidence rules, workflow and limitations.\n\n\nSee [APEX Mock Interview Engine](docs/apex-mock-interview-engine.md) for round structure, persistence and limitations.\n

## Adaptive Interview Intelligence

- `GET /api/intelligence/interview-prep` — authenticated, user-scoped analysis of up to 100 recent mock-interview sessions; accepts an optional owned `goalId` filter.
- Reports coverage across the nine APEX mock prompts, saved-answer counts, explicitly saved self-review ratings, and a next-practice recommendation.
- Low-rating review suggestions are based only on learner-entered ratings (average 2/5 or lower). Otherwise, the engine recommends an unanswered prompt or the least recently practised prompt.
- The endpoint returns aggregate metadata only; it does not return answer text, infer skill, grade responses, or predict hiring outcomes. See [Mock Interview Engine](docs/apex-mock-interview-engine.md).


## Company-to-Career Preparation Workspace (Phase 22)

- `GET /api/intelligence/company-prep?goalId=<uuid>` — authenticated, user-scoped workspace joining one owned career goal with exact company-and-role approved evidence, that goal's roadmap tasks, and practice sessions explicitly linked to that goal.
- Returns approved evidence with source snapshot provenance, roadmap progress and next incomplete tasks, plus goal-linked practice session and attempt counts.
- Does not backfill unlinked practice sessions, infer skill from activity, or predict hiring outcomes. Roadmap completion is user-reported. See [Company Intelligence](docs/apex-company-intelligence.md).


## Application Follow-up Intelligence (Phase 25)

- `/features/application-follow-ups` — private timeline for application deadlines, recruiter follow-ups, interviews, assessments and other job-linked actions.
- `GET` and `POST /api/job-events` — list up to 250 owned timeline events or create an event linked to an owned job.
- `PATCH` and `DELETE /api/job-events/:id` — update or remove an owned event; marking an event completed records the completion timestamp.
- Event types are `deadline`, `follow_up`, `interview`, `assessment` and `other`; statuses are `pending`, `completed` and `cancelled`.
- Past-due and upcoming counts are derived from pending events and the current time. They are in-app tracking only: no email, push, calendar sync or background notification delivery is configured.
- Apply migration `0012_job_timeline_events` and regenerate Prisma Client after migration `0011_job_preparation_tasks`.


## Career Pipeline Intelligence (Phase 26)

- `/features/career-pipeline` and the dashboard `CareerPipelinePanel` present one connected view of saved applications, application stages, job preparation checklist progress and job-linked timeline events.
- `GET /api/intelligence/career-pipeline` is authenticated and user-scoped. It aggregates job statuses, timeline event types/statuses, preparation task statuses, recent applications, upcoming actions and overdue pending events.
- Active applications means `saved`, `applied` or `interview`; offer, rejected and withdrawn remain separate stages. These are saved user-entered statuses, not employer-synchronized states.
- Preparation completion is based only on tasks the user marked completed. Upcoming and overdue counts are based on pending events and their scheduled timestamps.
- The overview does not calculate application conversion rates, infer employer response, predict hiring outcomes or send notifications. It reports account activity, not job-search effectiveness.


## AI Career Copilot (Phase 27)

- The Agent Workbench now includes a `career-copilot` skill and dashboard shortcut at `/features/agent-workbench?skill=career-copilot`.
- Career account context is off by default and requires an explicit per-message opt-in checkbox. Without opt-in, the assistant receives no connected career-profile snapshot. When enabled, the authenticated conversation API builds a bounded, user-scoped snapshot of active career goals, recent job applications and their preparation tasks, recent self-assessments, recent practice session metadata, pending job timeline events and moderator-approved employer evidence matching the user's active target companies/roles.
- Only minimal metadata is sent for practice history; practice answer text, resume text, private job notes, event details and assessment evidence notes are excluded.
- Approved evidence includes claim type, supporting passage, source title, source URL, capture date and snapshot hash. The model is instructed to distinguish approved employer evidence from user-entered records and APEX-authored preparation.
- Account context is generated server-side per message, capped at 12,000 characters, and is not saved as a separate profile or cross-chat memory. The conversation itself remains subject to the existing persistence and provider data-handling policy.
- Requires sign-in, PostgreSQL migrations `0004_agent_conversations` and later schema migrations, Prisma Client generation, and server-side `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` configuration. No deployment or provider setup is performed by this code change.
- The Copilot has no action tools: it cannot modify applications, send emails, create reminders, contact employers, or claim to have done so. Recommendations are model-generated suggestions grounded in the supplied snapshot, not verified predictions or professional advice.


## Career Command Center (Phase 28)

- Dedicated route: `/features/career-command-center`, linked from the dashboard.
- The workspace composes existing authenticated endpoints for career pipeline, progress overview, deterministic practice recommendations, preparation roadmap and role-skill assessment coverage.
- It builds an explainable action queue: overdue pending events first, upcoming events next, then the first incomplete roadmap task and rule-based practice recommendations.
- The goal panel shows the first active goal returned by the roadmap endpoint. The weekly review is an on-demand summary of recorded sessions in the last seven days, completed timeline events and user-marked completed preparation tasks.
- Skill coverage counts role-template skills with saved self-assessments; it is not proficiency or job readiness. Application stages and checklist completion are user-entered records.
- This phase does not add a new database model or migration. It does not create calendar notifications, automatically deliver weekly reports, generate an AI action plan, or change application/task/event records.
- Career Copilot remains available as a separate optional AI experience; its account context requires explicit per-message opt-in and is off by default.
