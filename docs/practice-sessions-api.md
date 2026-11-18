# Practice Sessions and Attempts API

All endpoints require a valid Better Auth session. User IDs are derived on the server. A client cannot create or read another user's records.

## Sessions

### GET /api/practice/sessions?limit=20

Lists the current user's latest sessions. Limit is clamped to 1–50. Each item includes an attempt count.

### POST /api/practice/sessions

Creates a session.

```json
{
  "module": "interview",
  "title": "Backend interview practice"
}
```

Allowed modules: `interview`, `coding`, `system_design`, `resume`, `project_defense`. An optional `goalId` must belong to the current user.

### PATCH /api/practice/sessions/:id

Changes an in-progress session to `completed` or `abandoned`. Closed sessions cannot be reopened or switched to another terminal state. Completion time is recorded for terminal states.

## Attempts

### GET /api/practice/sessions/:id/attempts

Returns up to 100 attempts for a session owned by the current user, newest first.

### POST /api/practice/sessions/:id/attempts

Adds an attempt to an in-progress session.

```json
{
  "prompt": "Explain how a hash map works.",
  "responseText": "A hash map stores key-value pairs..."
}
```

- `prompt`: required, 1–8,000 characters.
- `responseText`: optional, up to 20,000 characters.

Attempts cannot be added to completed or abandoned sessions.

## Dashboard

The dashboard practice panel can create sessions, save prompt/response notes, browse recent sessions and attempts, and complete sessions. It does not yet execute submitted code, generate AI feedback, calculate a score, or replace the remaining illustrative dashboard metrics.

## Errors

- `400`: invalid JSON or request fields.
- `401`: no valid session.
- `404`: session does not exist for the current user.
- `409`: session is closed to new attempts or invalid state transition.
- `503`: database or storage unavailable.

## Testing status

These endpoints and the dashboard panel are committed, but still require dependency installation, typechecking, a provisioned PostgreSQL database, migrations, and authenticated integration tests before being considered production-verified.
