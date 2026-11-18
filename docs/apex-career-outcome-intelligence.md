# APEX Career Outcome Intelligence

Phase 33 adds a read-only, authenticated, goal-level outcome view at `GET /api/intelligence/outcomes` and renders it inside the Career Command Center.

## Per-goal measures

- **Preparation:** completion of career roadmap tasks and job-specific preparation tasks.
- **Skill-rating history:** compares the oldest and latest available self-rating for each goal-linked skill in the bounded query window; reports higher, lower, unchanged or not comparable.
- **Practice activity:** explicitly goal-linked sessions, attempts, completed sessions, sessions started in the last 30 days and represented modules.
- **Applications:** counts saved job applications linked to the goal and reports user-entered stage counts.
- **Follow-through:** accepted, deferred, dismissed and completed recommendation actions linked to the goal or its saved jobs; timeline events linked to those jobs and their completion counts.

## Scope and limits

The endpoint is user-authenticated and all queries are scoped to the signed-in user. It includes up to 50 goals, 500 goal-linked skill assessments, 500 goal-linked practice sessions, 100 saved jobs, 500 recommendation actions and 500 timeline events. Up to 200 roadmap tasks are included per goal. It reports only explicitly linked records; general profile assessments and unlinked practice are not silently attributed to a goal.

No schema migration is introduced. The scorecard is derived from existing database records and does not persist a second outcome snapshot.

A higher self-rating is not independently verified skill improvement. Practice counts indicate activity, not mastery. Roadmap/job preparation completion is user-reported. Application stages are entered by the user and do not imply employer response, conversion probability or hiring outcome. The feature does not calculate a composite readiness score, predict hiring or guarantee results.

## UI

The `CareerOutcomeIntelligencePanel` is integrated into `/features/career-command-center` and displays per-goal preparation, skill-rating history, practice, application and follow-through summaries with refresh, loading and error states.
