# APEX Personalised Learning Engine

Phase 35 adds an authenticated, read-only learning-path API at `GET /api/intelligence/learning-path` and a goal-specific panel in the Career Command Center.

## How the sequence adapts

For each active career goal, APEX loads incomplete roadmap tasks, the latest goal-linked self-assessment per exact skill key, and practice sessions explicitly linked to that goal.

The deterministic ordering considers:

1. Moderator-approved company-evidence tasks, which receive an early position so users can inspect the source-backed requirement or guidance.
2. Low latest self-ratings (1–2/5) for the task's exact skill key.
3. Baseline tasks and other skills without a recorded goal-linked self-assessment.
4. Module practice recency: a module with no linked session or no session in 21 days receives an additional nudge.
5. Tasks already marked in progress receive a small continuity preference.

The response provides a short sequence per goal, the reason for each recommendation, latest self-rating if present, last module practice date, task status, module destination and whether the task is linked to approved evidence.

## Data scope and limits

The endpoint requires authentication and scopes goals, tasks, assessments and sessions to the signed-in user. It uses bounded reads: up to 50 active goals, 1,000 roadmap tasks, 1,000 goal-linked assessments and 500 goal-linked practice sessions. Unlinked practice is not attributed to a goal.

The numeric priority is only a sorting aid. It is not a readiness, proficiency or employability score. Self-ratings are user-entered signals, practice counts describe activity, and task completion is user-reported. Exact skill-key matching can miss semantically related skills. No AI model is used, no learner answers are returned, and the endpoint does not change roadmap status or assessments.

No new database model or migration is introduced. Existing roadmap and practice records remain the source of truth.
