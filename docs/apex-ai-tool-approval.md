# APEX AI Tool Proposals and Human Approval

The Agent Workbench can ask the configured model to suggest one action from a fixed allowlist. The model does not execute tools.

## Flow

1. An authenticated user submits text to `POST /api/agent/tool-proposals`.
2. The configured model receives the text and the fixed tool descriptions.
3. The server parses the model response and validates the tool ID, input length and reason length against the allowlist.
4. The UI displays the exact proposed tool and exact input.
5. The user may reject the proposal or explicitly approve it.
6. Approval invokes the existing authenticated `POST /api/agent/tools` endpoint.

## Endpoint

Request:

```json
{ "text": "Please inspect this resume text for developer skills..." }
```

A valid proposal response includes:

```json
{
  "proposal": {
    "toolId": "skill-term-extractor",
    "input": "TypeScript, React, PostgreSQL",
    "reason": "The text contains developer skill terms."
  },
  "requiresApproval": true,
  "executed": false
}
```

The model may return no proposal. Invalid model output is rejected; it is never interpreted as an executable command.

## Safety boundaries

- The model can select only `text-inspector` or `skill-term-extractor`.
- Tool input is limited to 5,000 characters; reason to 200 characters.
- Model output is a suggestion, not authorization.
- The UI shows the exact tool and input before the user approves.
- No tool runs during proposal generation.
- Both proposal and execution endpoints require authentication.
- Tool execution remains deterministic and side-effect-free.
- No shell, filesystem, browser, repository, network, code execution, arbitrary function calling or external writes are exposed.
- Submitted text is sent to the configured AI provider during proposal generation. Do not include passwords, API keys or sensitive personal data.
- The approval field is an application-level confirmation signal, not a cryptographic approval token. This prototype is not a hardened public production authorization system.
- No shared rate limiter, durable tool audit log, usage budget or integration tests are included yet.

A model can produce incorrect or manipulated suggestions. Review the proposal and its exact input before approving.
