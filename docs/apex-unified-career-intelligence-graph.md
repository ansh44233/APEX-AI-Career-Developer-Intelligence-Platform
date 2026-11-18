# APEX Unified Career Intelligence Graph — Phase 39

## Purpose

Phase 39 upgrades the original Career Intelligence Graph into a connected view of the user's active career goals, approved employer evidence, skill assessments, task-linked practice evaluations, roadmap tasks, job applications, job-specific preparation and tracked recommendations.

The graph is available on the dashboard and in the Career Command Center.

## API

`GET /api/intelligence/graph` requires an authenticated session. All data is scoped to the current user and active career goals.

For each active goal, the response connects:

- Company and role, with moderator-approved company claims matched by exact normalized company and role labels.
- Skill nodes from exact roadmap `skillKey` values and recorded self-assessments.
- Goal-specific self-assessments take precedence over unlinked profile assessments; profile ratings are used only as a fallback when no goal-specific rating exists.
- Roadmap task counts and statuses for each skill.
- Task-linked practice evaluations, latest recorded rubric average and rubric-dimension averages. Only learner-entered evaluation records are counted.
- Practice session and attempt totals for sessions explicitly linked to the goal.
- Job applications explicitly linked to the goal, application statuses, linked job-preparation checklist totals and timeline-event counts.
- Accepted/deferred recommendation actions linked directly to the goal or through an application linked to that goal.

## Bounds

The endpoint limits reads to 50 active goals, 1,000 assessments, 1,000 sessions, 2,000 task-linked attempts, 200 linked applications, 1,000 job-preparation tasks, 500 recommendation actions, 100 approved claims per goal and 300 roadmap tasks per goal.

The UI shows up to 10 skill nodes, 4 linked applications and 5 open tracked recommendations per goal. The underlying API returns bounded collections and summary counts.

## Privacy and interpretation

- Only records explicitly linked to a goal are included. Unlinked sessions are never silently assigned to a goal.
- Job descriptions, private application notes, practice answer text and skill-assessment evidence notes are not selected or returned.
- Company evidence is limited to moderator-approved claims with exact normalized company and role matching.
- Practice rubric scores and skill ratings are learner-entered reflections, not objective proficiency measurements.
- Recommendation records describe user-accepted or deferred actions; they do not prove the action was completed.
- The graph does not calculate readiness, mastery, employability, hiring probability or interview outcomes.
- No AI provider is called and no new database model or migration is introduced.

## UI integration

The CareerIntelligenceGraphPanel now shows skill-by-skill roadmap and practice signals, application preparation summaries and open tracked recommendation actions, alongside approved company evidence. It is integrated into both the dashboard and Career Command Center.

## Verification status

GitHub source files were reviewed for authenticated access, ownership-scoped queries, bounded reads, exact goal/task relationships, approved-only employer evidence and omission of sensitive free-text fields. No local TypeScript check, Prisma generation, production build, live database integration test or browser test has been run.