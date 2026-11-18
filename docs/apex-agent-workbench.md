# APEX Agent Workbench

The Agent Workbench is the authenticated AI coaching interface for APEX. It lets a user create a conversation, choose one registered skill, and exchange text messages with a server-configured OpenAI-compatible Chat Completions endpoint.

For the persistent conversation API, database schema, ownership rules, context limits and deletion behaviour, see [APEX Persistent Agent Conversations](apex-agent-conversations.md).

## Setup

Configure these server-side environment variables:

- `AI_BASE_URL`: provider API base URL. Defaults to `https://api.openai.com/v1`.
- `AI_API_KEY`: provider API key. Keep it server-side; never use a `NEXT_PUBLIC_` prefix.
- `AI_MODEL`: model identifier accepted by the configured provider.

For local development, an HTTP URL is allowed only for localhost. Production configuration requires HTTPS. The configured base URL is trusted operator configuration; never allow a user request to select or override it.

Apply the database migrations, including `0004_agent_conversations`, after generating the Prisma client.

## Conversation API

- `GET /api/agent/conversations` — list the current user's conversations.
- `POST /api/agent/conversations` — create a conversation for a published skill.
- `GET /api/agent/conversations/:id` — load an owned conversation and messages.
- `DELETE /api/agent/conversations/:id` — delete the conversation and its messages.
- `POST /api/agent/conversations/:id/messages` — persist a learner message and generate a contextual assistant response.

The former single-turn `POST /api/agent/respond` endpoint is deprecated and returns HTTP 410.

## Runtime boundaries

This is a multi-turn text coaching interface, not a general-purpose autonomous agent.

- No tool calling, shell, filesystem access for the model, browser automation, repository access, code execution, or external side effects.
- The latest 12 conversation messages are supplied as context; there is no cross-conversation memory.
- Conversations are capped at 100 messages and can be deleted by their owner.
- No streaming, shared rate limiter, usage budget, background job, or persistent execution log.
- No claim that code was run or tests passed.
- Skill documents and learner input are treated as untrusted context. Prompt text is not a complete security boundary.
- User text is stored in APEX's database and sent to the configured model provider. Follow that provider's data handling terms and do not submit secrets or sensitive personal information.

## Provider compatibility

The adapter implements the common `POST /chat/completions` request/response shape. It is configurable through `AI_BASE_URL`, but it is not a universal adapter for every model API. Providers that use a different protocol or authentication scheme need a dedicated adapter.

## Before production

Add and test:
1. Per-user and per-IP rate limits backed by a shared store.
2. Provider spend/token budgets and usage metering.
3. Request-size enforcement at the hosting edge.
4. Streaming and cancellation behaviour.
5. Export and configurable retention controls.
6. Provider-specific integration tests and model evaluations.
7. Operational monitoring without logging learner prompts or secrets.


## Career Copilot skill (Phase 27)

The registered `career-copilot` skill is available in the Agent Workbench and can be opened from the dashboard shortcut `/features/agent-workbench?skill=career-copilot`.

When a Career Copilot conversation sends a message, connected account context is **off by default**. The learner must explicitly check “Use my saved APEX career data for this message”. The UI resets the checkbox after every send and when switching conversations. The API schema defaults `includeCareerContext` to false and only obtains a snapshot when the authenticated conversation uses `career-copilot` and the request explicitly opts in. Without opt-in, no account snapshot is included.\n\nWhen opted in, the authenticated message API obtains a fresh, bounded snapshot for the current user:

- Up to 8 active career goals.
- Up to 12 recently updated job applications and up to 20 preparation tasks per job.
- Up to 30 recent skill self-assessments (ratings and linked goal labels only).
- Up to 15 recent practice sessions (module, title, status, date, attempt count and linked goal labels; no response text).
- Up to 15 pending timeline events (title, type, date and linked job; no private event details).
- Up to 12 moderator-approved evidence claims matching the user's active target company and role, including the source excerpt and provenance metadata.

The context is serialized for that request only, capped at 12,000 characters and inserted as untrusted account data into the system prompt. It is not persisted as a separate profile memory. The selected skill instructions explain how to prioritise overdue events, upcoming events, job preparation and stated career goals while preserving evidence provenance.

### Privacy scope

The context query is scoped by the authenticated user ID. It intentionally excludes resume contents, full job descriptions, private job notes, timeline event details, assessment evidence notes and practice answer text. Employer evidence is included only when its claim status is `approved` and its company/role match an active goal. If no matching approved evidence exists, the Copilot must say so and rely on general preparation guidance.

### Limitations

- The Copilot generates suggestions only. It cannot edit jobs, mark tasks complete, send email, create events, contact recruiters, browse the web or execute tools.
- The snapshot is bounded and recent; it may omit older account records.
- Model output can be wrong. Recommendations should be checked against the linked APEX records and source URLs.
- Messages and the supplied account snapshot are sent to the configured AI provider as part of inference. Provider retention and data handling terms apply. Avoid entering secrets or unnecessary sensitive information.
- Requires database migrations, generated Prisma Client and server-side AI provider configuration. No provider credentials are included in the repository.
