# APEX Intelligent Practice Orchestrator

Phase 36 connects a prioritised roadmap task to a persistent practice session.

## Guided launch flow

1. The Personalised Learning panel offers a **Start practice** action on a roadmap step.
2. `POST /api/intelligence/practice-plan` authenticates the user, validates the task UUID, and resolves the task only through an active career goal owned by that user.
3. The endpoint maps the task's registered internal module route to an allowed practice module and creates a practice session linked to the exact career goal.
4. The session stores both the owning `goalId` and exact `roadmapTaskId`; the relationship survives reloads and is visible in session history.
5. It returns a same-origin internal destination containing the new session ID and task ID. OA Arena and Interview Lab automatically open the saved session and load the owner-scoped task brief.
6. The guided workspace shows the roadmap description, skill key, phase, practice structure and moderator-approved source passage when one exists. Saved attempts are tagged with a stable `ROADMAP|skillKey|task title` prompt prefix.
7. The learning path reports task-specific session and attempt counts separately from broader module practice. The user writes and saves attempts using the existing owner-scoped practice APIs.

## Supported guided destinations

- `/features/oa-arena` → coding practice
- `/features/interview-lab` and `/features/mock-interview` → interview practice
- Other roadmap modules currently return HTTP 422 until a matching workspace supports automatic session loading.

Unknown module destinations are rejected with HTTP 422; the server never accepts an arbitrary redirect URL. The created session title includes the roadmap task title, and `roadmap_task_id` provides a durable relational link to the exact task. `GET /api/intelligence/practice-plan?taskId=<uuid>` returns task context and recent task-linked practice history only when the task belongs to an active goal owned by the caller. Session completion does not automatically mark the roadmap task complete.

## Security and boundaries

The endpoint is authenticated, checks that the task belongs to an active goal owned by the caller, and uses an explicit internal module allowlist. Session creation and attempt saving continue to use existing authenticated, owner-scoped endpoints. Migration `0014_practice_session_roadmap_link` adds the nullable task foreign key and an index; existing sessions remain valid with no task association.

The practice structure and task guidance are deterministic APEX-authored instructions, not generated employer questions. This phase does not execute code, grade answers, generate an AI exercise, or claim skill mastery. Practice attempts are user-authored records. The learning path can use their existence and session recency as activity signals, not proof of proficiency.
