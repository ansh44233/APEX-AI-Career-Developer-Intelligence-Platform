# OA Arena practice sessions

OA Arena uses the shared authenticated practice-session API to persist coding practice sessions and written submissions.

## User flow

1. A signed-in user starts a coding session with module `coding` and a Two Sum title.
2. The user can save an approach, pseudocode or code draft as a `PracticeAttempt`.
3. The coding history panel lists only sessions whose module is `coding`.
4. Selecting a session retrieves its saved attempts after the API verifies ownership.
5. Open sessions can be completed or abandoned. Closed sessions are read-only and reject additional attempts.

## Shared API

- `GET /api/practice/sessions?limit=20`
- `POST /api/practice/sessions`
- `GET /api/practice/sessions/:id/attempts`
- `POST /api/practice/sessions/:id/attempts`
- `PATCH /api/practice/sessions/:id`

The client uses `module: "coding"`; the server derives the owner from Better Auth. It never accepts a user ID from the browser.

## Current boundaries

- PostgreSQL and applied Prisma migrations are required for durable storage.
- The current problem set is a small static prototype containing Two Sum.
- The editor is a text workspace. It does not run JavaScript or any other language.
- No hidden tests, test-case evaluation, score, timer, plagiarism analysis or AI feedback is active.
- The checklist is a manual self-review aid, not a grading result.
- Saved drafts are displayed in the selected session history; they are not automatically restored into the editor.
- Do not paste secrets, credentials, private keys or sensitive personal information into practice drafts.

## Manual verification checklist

- Signed-out visitors are prompted to sign in and cannot start sessions.
- Signed-in users can create a coding session.
- Saving a draft creates a persisted attempt and increments the session attempt count.
- Coding history excludes interview and other module sessions.
- Refreshing and reopening a session retrieves its saved drafts.
- Another user's session ID returns 404.
- Completed and abandoned sessions reject new attempts and cannot be reopened.
- Database errors are shown rather than reported as successful saves.
