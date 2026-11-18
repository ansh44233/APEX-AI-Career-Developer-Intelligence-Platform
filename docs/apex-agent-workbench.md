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
