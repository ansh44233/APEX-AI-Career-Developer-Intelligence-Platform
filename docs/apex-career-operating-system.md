# APEX Career Operating System — Phase 45

## Purpose

The Career Operating System is a connected entry point for the existing APEX career workflow. It provides a guided six-stage journey:

1. Choose a direction with Career Twin.
2. Research employers and review provenance-aware company evidence.
3. Understand recorded skill gaps through assessments and Skill Mastery.
4. Build capability with the personalised learning path and guided practice.
5. Review the Daily Career Strategist shortlist and explicitly approve actions in the Career Command Center.
6. Review saved activity and outcome signals, then adjust the next strategy.

## Data sources

The page loads three existing authenticated, user-scoped APIs:
- `GET /api/intelligence/learning-path` for active goals, roadmap progress, next tasks, task-linked practice and learner self-evaluations.
- `GET /api/intelligence/daily-plan` for timeline priorities, job-preparation tasks, roadmap tasks, weekly activity review and approved source excerpts.
- `GET /api/intelligence/graph` for goal-linked skills, assessments, practice signals, approved evidence claims and linked applications.

The UI filters plan items to the selected goal when a goal link exists. Items without a goal association may appear as account-level actions. The underlying APIs retain their existing ownership checks and bounded reads.

## Explicit action and privacy boundaries

- The operating system page is read-only. It does not accept, defer, dismiss, complete or create recommendations.
- Suggested actions must be reviewed and explicitly accepted in the Career Command Center.
- It does not create or change career goals, application statuses, roadmap statuses, timeline events or external records.
- Career Copilot is a handoff only. Per-message career-context sharing remains off until the user explicitly enables the existing consent control.
- The page does not load resume text, job descriptions, private notes, practice answers or skill-assessment evidence notes.

## Interpretation

- Roadmap progress is based on user-marked task statuses.
- Skill ratings and practice evaluations are learner-entered reflections, not objective proficiency grades.
- Approved employer evidence remains source-linked and distinct from APEX-authored suggestions.
- Daily plan effort estimates and urgency are deterministic suggestions, not guarantees.
- Seven-day activity counts describe saved activity and user-marked completion; they do not imply mastery or hiring outcomes.

## Persistence and implementation

This phase adds a client-side orchestration page at `/features/career-os` and links it from the dashboard and Career Command Center. It reuses existing APIs and introduces no new database model, migration, AI provider dependency or background job.
