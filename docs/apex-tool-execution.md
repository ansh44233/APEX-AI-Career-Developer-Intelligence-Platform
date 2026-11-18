# APEX Controlled Tool Execution

APEX now has an authenticated, allowlisted tool catalog and a deterministic execution endpoint.

## Endpoints

- `GET /api/agent/tools` — list available tools for the signed-in user.
- `POST /api/agent/tools` — execute one allowlisted tool after explicit approval.

Example request:

```json
{
  "toolId": "text-inspector",
  "input": "Paste text to inspect",
  "approved": true
}
```

## Available tools

| Tool | Behaviour |
| --- | --- |
| `text-inspector` | Counts characters, words and non-empty lines. |
| `skill-term-extractor` | Finds terms from a small, fixed developer-skill vocabulary. |

## Security boundaries

- Both endpoints require a valid Better Auth session.
- The server accepts only registered tool IDs and rejects extra request fields.
- Execution requires the explicit `approved: true` confirmation field.
- Input is limited to 5,000 characters.
- Tools are deterministic, local and side-effect-free.
- No shell, filesystem, browser, repository, network, code execution, model-triggered tool calls or external writes are available.
- Tool input and output are not persisted or sent to the AI provider.
- The current implementation has no shared rate limiter, durable audit log or usage budget. Do not expose it publicly until those controls and integration tests are added.

The approval field is an application-level confirmation signal, not a cryptographic authorization token. The UI invokes tools only after a direct user action; the server still validates the allowlist, session and request shape.
