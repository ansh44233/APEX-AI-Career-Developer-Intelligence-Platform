# APEX Intelligent Practice Orchestrator

Phase 36 connects a prioritised roadmap task to a persistent practice session.

## Guided launch flow

1. The Personalised Learning panel offers a **Start practice** action on a roadmap step.
2. `POST /api/intelligence/practice-plan` authenticates the user, validates the task UUID, and resolves the task only through an active career goal owned by that user.
3. The endpoint maps the task's registered internal module route to an allowed practice module and creates a practice session linked to the exact career goal.
4. It returns a same-origin internal destination containing the new session ID. OA Arena and Interview Lab recognise that ID and automatically open the saved session history.
5. The user writes and saves attempts using the existing owner-scoped practice APIs.

## Supported guided destinations

- `/features/oa-arena` → coding practice
- `/features/interview-lab` and `/features/mock-interview` → interview practice
- Other roadmap modules currently return HTTP 422 until a matching workspace supports automatic session loading.

Unknown module destinations are rejected with HTTP 422; the server never accepts an arbitrary redirect URL. The created session title includes the roadmap task title, and the task ID is returned as launch context. Session completion does not automatically mark the roadmap task complete.

## Security and boundaries

The endpoint is authenticated, checks that the task belongs to an active goal owned by the caller, and uses an explicit internal module allowlist. Session creation and attempt saving continue to use existing authenticated, owner-scoped endpoints. No new database model or migration is introduced.

This phase launches a focused session; it does not execute code, grade answers, generate an AI exercise, or claim skill mastery. Practice attempts are user-authored records. The learning path can use their existence and session recency as activity signals, not proof of proficiency.
