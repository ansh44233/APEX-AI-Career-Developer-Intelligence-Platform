# Interview Lab practice sessions

The Interview Lab uses the authenticated practice-session API to persist user-created sessions and written responses.

## User flow

1. A signed-in user starts a session with module `interview`.
2. The page stores each submitted answer as a `PracticeAttempt` linked to that session.
3. The session history list is loaded from the authenticated user's session collection.
4. Selecting a session retrieves its attempts after verifying ownership.
5. A user can mark an open session completed or abandoned. Closed sessions cannot accept new attempts or be reopened.

## Endpoints

- `GET /api/practice/sessions?limit=20`
- `POST /api/practice/sessions`
- `GET /api/practice/sessions/:id/attempts`
- `POST /api/practice/sessions/:id/attempts`
- `PATCH /api/practice/sessions/:id`

All routes derive the user ID from the server-side Better Auth session. The client never supplies an owner ID. Session and attempt lookups are scoped through the authenticated owner.

## Current boundaries

- PostgreSQL must be configured and migrations applied for persistence to work.
- The current prompt set is a small static prototype.
- Self-review is a checklist, not AI-generated feedback or a score.
- Saved answers are shown in the selected session's response history; they are not automatically copied back into the editor.
- Voice input, adaptive difficulty, AI follow-ups, evaluation and export are not implemented.
- Practice responses may contain personal information. Add retention, export and deletion controls before production collection, and avoid logging response content.

## Manual verification checklist

- Signed-out visitor sees a sign-in path and cannot create a session.
- Signed-in user can start a session and see it in history.
- Saving an answer creates one attempt and increments the session attempt count.
- Refreshing the page preserves the session and its saved attempts.
- Selecting another user's session ID returns 404.
- Completed or abandoned sessions reject new attempts.
- Closed sessions cannot be reopened.
- Database unavailability is surfaced as an error rather than a false saved state.
