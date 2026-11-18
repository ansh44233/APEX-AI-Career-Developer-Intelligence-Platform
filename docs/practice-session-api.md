# Practice Session API

These endpoints persist practice sessions and attempts for an authenticated APEX user.

## Authentication status

Every endpoint requires a valid `apex_session` cookie created by the trusted session service. APEX currently has session primitives but does not yet have a registration, login, OAuth, or identity-verification flow. Until one is implemented, normal browser requests will receive **401 Authentication required**.

The API never accepts a user ID from the request body. Ownership is derived from the verified server-side session.

## GET /api/practice/sessions

Returns the signed-in user's newest practice sessions.

- Optional query: `limit` (integer, clamped to 1–50; default 20).
- Returns session metadata and attempt counts.
- Does not return response text or feedback content in the list.

## POST /api/practice/sessions

Creates a practice session.

```json
{
  "module": "interview",
  "title": "Frontend fundamentals",
  "goalId": "optional-uuid"
}
```

Allowed modules: `interview`, `coding`, `system_design`, `resume`, `project_defense`.

If `goalId` is provided, it must belong to the signed-in user.

## POST /api/practice/sessions/:id/attempts

Adds an attempt to an owned, open practice session.

```json
{
  "prompt": "Explain the event loop.",
  "responseText": "The event loop coordinates..."
}
```

Prompt length is limited to 8,000 characters and response length to 20,000 characters. Closed sessions reject new attempts.

## Error responses

- `400`: malformed JSON or schema validation failure.
- `401`: no valid authenticated session.
- `404`: referenced goal/session does not exist for the current user.
- `409`: practice session is closed.
- `503`: database or server-side storage is unavailable.

## Current limitations

The endpoints are implemented but not yet integration-tested against a provisioned PostgreSQL database. There is no login flow, AI feedback generation, scoring, session completion endpoint, or frontend persistence wiring yet.
