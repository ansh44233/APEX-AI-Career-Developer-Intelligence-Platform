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