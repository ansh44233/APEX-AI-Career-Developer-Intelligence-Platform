# Skill assessment API

All routes require a valid Better Auth session. Records are always scoped to the authenticated user.

## GET /api/skill-assessments
Returns up to 250 assessments, newest first within each skill.

## POST /api/skill-assessments
Creates an assessment. JSON fields:
- `skillKey`: 2–80 characters; normalized to lowercase underscore-separated form.
- `rating`: integer from 1 to 5.
- `evidenceNote`: optional nullable text, max 2,000 characters.
- `goalId`: optional nullable career-goal UUID owned by the caller.

## PATCH /api/skill-assessments/:id
Updates `rating` and/or `evidenceNote`. The assessment timestamp is refreshed.

## DELETE /api/skill-assessments/:id
Deletes only the caller's assessment.

## Status codes
- `200`: read/update/delete succeeded.
- `201`: created.
- `400`: invalid JSON or validation failure.
- `401`: unauthenticated.
- `404`: record absent or not owned by caller.
- `503`: database unavailable.

Ratings are user-entered self-assessments, not independently verified skill scores.
