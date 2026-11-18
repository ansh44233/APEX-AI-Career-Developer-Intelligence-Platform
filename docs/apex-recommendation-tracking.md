# APEX Recommendation Tracking

Phase 32 adds persistent, user-controlled tracking for deterministic APEX career recommendations.

## API

- `GET /api/intelligence/recommendation-actions` — authenticated, user-scoped list of up to 100 tracked actions.
- `POST /api/intelligence/recommendation-actions` — accept, defer or dismiss a recommendation. A stable source key prevents duplicate rows for the same user and recommendation.
- `PATCH /api/intelligence/recommendation-actions/:id` — mark an accepted or deferred action complete. The route verifies ownership and, when linked to a roadmap task, updates that exact task in the same database transaction.

The API validates optional career-goal and job links against the signed-in user. Roadmap recommendations use their task UUID as the source key and are automatically linked to the matching owned task and goal. Other recommendations can be linked to a selected goal and/or saved job.

## Data and state

The `CareerRecommendationAction` model stores a bounded snapshot of the recommendation title, reason, internal destination, basis and stable source key, plus status and optional due date. Statuses are `accepted`, `deferred`, `dismissed` and `completed`.

The unique constraint on `(user_id, source_key)` prevents duplicate tracking records. Deleting a linked goal, job or roadmap task preserves the action but clears the optional relation. Deleting the user cascades the action records.

## User experience

The Career Command Center now shows:
- current deterministic practice recommendations and the next incomplete roadmap task;
- Accept, Defer (two days) and Dismiss controls;
- persistent accepted/deferred actions and completion controls;
- optional links to a career goal or saved job;
- a retained history count for dismissed suggestions.

Marking a roadmap-backed recommendation complete also marks its linked roadmap task complete. Other completions are explicitly user-reported and retained as career-action history. Completion does not prove skill mastery.

## Boundaries

- Recommendations remain deterministic and based on saved assessments/practice/roadmap data; this is not an AI prediction.
- The system does not send recruiter messages, change application stages, create external calendar events or schedule notifications.
- Deferred dates are stored in APEX; no reminder delivery is configured.
- APEX does not automatically accept, dismiss or complete a recommendation.
- Existing temporary action-planner behaviour has been replaced in the Command Center by persistent tracking.

## Setup

Apply migration `0013_career_recommendation_actions` after migration `0012_job_timeline_events`, then regenerate Prisma Client. The migration has been committed but has not been run against a database. No deployment or live database change was performed.
