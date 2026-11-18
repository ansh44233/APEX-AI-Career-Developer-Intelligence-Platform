# APEX Career Simulation & Decision Lab — Phase 43

## Purpose

The Career Simulation & Decision Lab compares preparation strategies against an authenticated user's saved active career goal, roadmap, and stated time budget. It is a planning aid, not a hiring or career-outcome predictor.

## Inputs

- Active career goal selected from `GET /api/intelligence/learning-path`.
- User-entered available hours per week (2–30).
- User-entered planning horizon (2–24 weeks).
- Latest returned incomplete roadmap steps and their evidence, status, module, self-rating, and practice signals.

Resume text, job descriptions, private notes, answer text, and evidence notes are not requested or transmitted by this page.

## Scenarios

Four strategies share the same total time budget and vary the illustrative allocation:
- Balanced growth: 35% interview practice, 25% projects/design, 25% fundamentals, 15% career admin.
- Interview-first: 60%, 15%, 15%, 10%.
- Portfolio-first: 20%, 50%, 20%, 10%.
- Foundations-first: 20%, 15%, 55%, 10%.

Roadmap steps are ordered using the learning-path priority as a base, then a transparent category allocation preference, approved evidence flag, and in-progress status. A small number of top roadmap steps are shown for comparison.

Effort assumptions are rough planning estimates: 3 hours for interview practice, 4 hours for project/design work, and 2.5 hours for fundamentals. They are not measured estimates of an individual's ability or actual completion time.

## Approval and persistence

The user can choose a scenario and explicitly add up to four selected goal-linked actions to the existing authenticated Career Action Tracker API. Actions use stable `skill-simulation-...` source keys and `basis: simulation`. Saving does not change roadmap task status, application stages, career goals, calendar events, or external services. The user can later review/complete tracked actions in the existing tracker.

## Limitations

- The page previews the up to six next steps returned by the existing learning-path API; it does not inspect every underlying task or generate a complete timetable.
- The time split and task effort are heuristic assumptions.
- Scenario ranking is not a probability, score of readiness, proficiency estimate, salary estimate, interview pass rate, or guarantee.
- The page does not persist unapproved scenario drafts or run background scheduling.
- No new Prisma model or migration was added.
