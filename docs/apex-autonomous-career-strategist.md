# APEX Autonomous Career Strategist — Phase 40

## Purpose

Phase 40 adds a deterministic daily career shortlist and a rolling seven-day activity review to the Career Command Center. It translates saved records into suggested next steps; it is not an autonomous agent that changes account data without approval.

## API

`GET /api/intelligence/daily-plan` requires authentication and reads only records owned by the current user.

The plan combines:
- Pending timeline events due now or within the next 14 days, prioritised by lateness and proximity.
- Incomplete job-specific preparation tasks from saved applications in active pipeline stages.
- Incomplete career roadmap tasks, prioritising moderator-approved evidence links, in-progress work, goal target dates and exact task-linked practice recency.
- A rolling seven-day review of saved practice sessions and completed timeline, roadmap, job-preparation and recommendation actions.

Each suggested item includes a reason, internal APEX destination, source record label, urgency class and suggested effort estimate. Effort values are guidance, not commitments.

## User approval

The daily plan is read-only. It does not mark tasks complete, reschedule events, change application statuses or send communications.

The learner can explicitly add a suggestion to the existing Career Action Tracker. This uses the existing authenticated `POST /api/intelligence/recommendation-actions` endpoint with a stable `skill-daily-` source key and the existing ownership checks for optional goal/job links. The action appears in the persistent tracker only after the user clicks the approval button.

The local 'Hide today' control is temporary UI state and does not delete or mutate saved records.

## Ranking

Pending overdue events and events due today/soon receive the highest priority. Upcoming events, interview-stage job preparation and approved-evidence roadmap tasks follow. Remaining incomplete roadmap and job-preparation tasks are flexible suggestions. This is a transparent deterministic ordering, not an AI prediction.

## Bounds and privacy

Reads are bounded to 50 active goals, 60 timeline events, 200 linked applications, 1,000 incomplete roadmap tasks and 500 recent goal-linked practice sessions. Weekly review uses database counts over the previous seven days.

The endpoint does not return practice answer text, job descriptions, private job notes or skill-assessment evidence notes. It does not call an AI provider.

## Limitations

- No background scheduler, push/email notifications, calendar sync or external employer contact.
- The 14-day horizon is used to rank saved timeline events; it does not create new deadlines.
- Job-preparation tasks are user-facing saved checklist entries and are not verified against a live job listing.
- Practice recency is based on sessions explicitly linked to the exact roadmap task.
- No new database model or migration is introduced.

## Verification status

GitHub source files were reviewed for authenticated owner-scoped queries, bounded reads, read-only plan generation and explicit approval before persistent action creation. TypeScript checks, production build, database integration and browser tests have not been run.

## Phase 41 — Intelligence Orchestration

- Career Copilot's explicitly opted-in account snapshot now includes a bounded `dailyStrategist` section built from the user's pending timeline events, incomplete job-preparation tasks, incomplete roadmap tasks and task-linked learner self-evaluations.
- The strategist signals expose task status, evidence-backed flag, latest learner-entered rubric average and evaluation count. They do not include practice answer text or private notes.
- Career Copilot instructions now use this section to explain the current action order, separate dated urgency from flexible learning work and describe self-evaluation as a learner reflection rather than proof of proficiency.
- The daily plan links to Career Copilot with a prefilled prompt. The account-context checkbox remains off by default and must be explicitly enabled for that message.
- Career Copilot still has no write tools. Persistent actions remain user-approved through the existing Career Action Tracker.
- No new Prisma model or migration.

## Phase 42 — Adaptive Execution Engine

The daily plan now reads up to 200 of the user's own saved daily-plan recommendation actions and adapts the shortlist:
- Accepted actions remain visible; an action not updated for seven or more days is flagged as stalled and receives a review-priority increase.
- Deferred actions are hidden until their saved due date; once due, they re-enter the shortlist with a review-priority increase.
- Dismissed and completed daily-plan actions are not suggested again.
- Re-accepting or updating an action refreshes its updated timestamp, so the stalled timer restarts from the user's latest decision.

The API also returns:
- A five-item weekly execution suggestion derived from the same ranked shortlist.
- A 30-day count of recommendation decisions by accepted/deferred/dismissed/completed status.
- Counts of linked application stages, including rejected and withdrawn, without interpreting them as causal outcomes.

The user can explicitly approve the weekly plan. The UI submits each item to the existing authenticated recommendation-action API; partial success is reported if an individual save fails. No background scheduling or automatic task completion occurs. The weekly plan is a suggested focus list, not a calendar booking.

No schema or migration is introduced. The adaptation uses existing CareerRecommendationAction records and application statuses. Counts are descriptive and do not imply that any recommendation caused an interview, offer or rejection.