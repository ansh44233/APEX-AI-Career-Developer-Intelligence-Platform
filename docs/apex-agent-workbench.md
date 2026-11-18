# APEX Agent Workbench

The Agent Workbench is the first authenticated, single-turn AI runtime in APEX. It loads one registered skill, combines its instructions with a bounded learner request, and sends the result to a server-configured OpenAI-compatible Chat Completions endpoint.

## Setup

Configure these server-side environment variables:

- `AI_BASE_URL`: provider API base URL. Defaults to `https://api.openai.com/v1`.
- `AI_API_KEY`: provider API key. Keep it server-side; never use a `NEXT_PUBLIC_` prefix.
- `AI_MODEL`: model identifier accepted by the configured provider.

For local development, an HTTP URL is allowed only for localhost. Production configuration requires HTTPS. The configured base URL is trusted operator configuration; never allow a user request to select or override it.

## Endpoint

### `POST /api/agent/respond`

Requires a valid Better Auth session.

Request:

```json
{
  "skill": "coding-practice",
  "message": "Explain how binary search works and give me a practice question."
}
```

- `skill` must match a published APEX skill slug.
- `message` is trimmed and limited to 5,000 characters.
- Additional request properties are rejected.
- The route reads the skill file from the allowlisted local skills directory.
- The provider key and model are read only from server environment configuration.

Success returns the selected skill metadata and generated text. Invalid requests return 400, signed-out requests return 401, unavailable configuration returns 503, and provider failures return a generic 502 response.

## Runtime boundaries

This is a single-turn text generation endpoint, not a general-purpose autonomous agent.

- No tool calling, shell, filesystem access for the model, browser automation, repository access, code execution, or external side effects.
- No conversation history or response persistence.
- No streaming, retry queue, usage dashboard, token accounting, or per-user rate limiter yet.
- No claim that code was run or tests passed.
- Skill documents and learner input are treated as untrusted context. The system prompt explicitly limits the model's authority and capabilities, but prompt text is not a complete security boundary.
- User text is sent to the configured model provider. Follow that provider's data handling terms and do not submit secrets or sensitive personal information.

## Provider compatibility

The adapter currently implements the common `POST /chat/completions` request/response shape. It is provider-configurable through `AI_BASE_URL`, but it is not yet a universal adapter for every model API. Providers that use a different protocol or authentication scheme need a dedicated adapter.

## Before production

Add and test:
1. Per-user and per-IP rate limits backed by a shared store.
2. Provider spend/token budgets and usage metering.
3. Request-size enforcement at the hosting edge.
4. Streaming and cancellation behaviour.
5. Persistent sessions only with explicit retention, export and deletion controls.
6. Provider-specific integration tests and model evaluations.
7. Operational monitoring without logging learner prompts or secrets.
