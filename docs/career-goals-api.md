# Career Goals API

All endpoints require a valid Better Auth session. The authenticated user ID is derived on the server; clients cannot assign goals to another account.

## GET /api/career-goals

Returns the current user's career goals, ordered by status and most recently updated. Each item includes counts of linked practice sessions and skill assessments.

## POST /api/career-goals

Creates a goal.

```json
{
  "targetRole": "Backend Engineer",
  "targetCompany": "Example Labs",
  "targetDate": "2027-06-30"
}
```

- `targetRole`: required, 2–120 characters.
- `targetCompany`: optional or null, up to 120 characters.
- `targetDate`: optional ISO calendar date (`YYYY-MM-DD`) or null.

## PATCH /api/career-goals/:id

Updates one or more fields: `targetRole`, `targetCompany`, `targetDate`, or `status`.

Allowed statuses: `active`, `paused`, `completed`, `archived`.

An empty patch is rejected. The goal must belong to the authenticated user.

## DELETE /api/career-goals/:id

Deletes a goal owned by the current user. Linked practice sessions and skill assessments are retained; their optional goal relation is set to null.

## Errors

- `400`: malformed JSON or invalid input.
- `401`: missing or invalid session.
- `404`: goal not found for the current user.
- `503`: database or storage unavailable.

## Notes

The API has been committed but not integration-tested against a provisioned PostgreSQL database. The dashboard goal panel uses these endpoints when the user is signed in. Existing dashboard sample statistics remain illustrative until a dedicated aggregation endpoint replaces them.
