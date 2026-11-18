# APEX Preparation Roadmap

## API

- `GET /api/intelligence/roadmap` creates any missing template tasks for the user's active career goals and returns grouped roadmaps.
- `PATCH /api/intelligence/roadmap/:id` updates an owned task to `todo`, `in_progress`, or `completed`.

## Behaviour

- Each active career goal gets a deterministic roadmap based on broad role-title keyword matching.
- Tasks are persisted in `career_roadmap_tasks`; the unique goal/task key makes generation idempotent.
- Users can track each task independently. Progress is the percentage of tasks marked completed.
- Deleting a career goal cascades to its roadmap tasks.
- The dashboard panel links each task to an existing APEX practice module.

## Limits

- Templates are generic preparation suggestions, not verified employer requirements.
- The roadmap does not inspect job descriptions, resumes, external hiring data, or user answer text.
- Completion is user-reported task status, not proof of skill mastery or hiring readiness.
- Requires the new Prisma migration and a configured PostgreSQL database.
