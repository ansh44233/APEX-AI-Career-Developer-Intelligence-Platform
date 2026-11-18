# APEX Intelligent Gap Closure

Phase 34 adds an authenticated, deterministic gap analysis endpoint at `GET /api/intelligence/gap-closure` and feeds its highest-priority actions into the Career Command Center's persistent Recommendation Tracker.

## How gaps are identified

For each active career goal, APEX selects a broad built-in skill template based on the goal's role title. It compares template skill keys with the latest self-assessment explicitly linked to that same goal.

- No matching goal-linked assessment: `unassessed`, prompting the user to establish an honest baseline.
- Latest self-rating of 1–3 out of 5: `low_self_rating`, prompting focused practice and later reassessment.
- Latest self-rating of 4–5: not prioritised by this rule.

Low ratings receive higher deterministic priority than unassessed skills. The API returns the related APEX practice module, goal identity, a matching incomplete roadmap task when available, and a stable recommendation key. The Recommendation Tracker lets the user accept, defer for two days, dismiss or later mark the action complete. Accepted gap actions are linked to their originating career goal.

## Role templates and mapping

Templates cover shared software-engineering foundations plus frontend, backend, full-stack, data, DevOps/platform and mobile role tracks. Skill keys and module destinations are explicit in `src/app/api/intelligence/gap-closure/route.ts`. Role-title matching is keyword-based; templates are starting points, not employer-specific requirements. Only exact skill-key matches are considered.

## Security and data scope

The endpoint requires authentication and scopes goals, assessments and roadmap tasks to the signed-in user. It includes up to 50 active goals, 500 goal-linked assessments and 500 roadmap tasks. Unlinked profile ratings are not silently attributed to individual goals.

No new database model or migration is introduced. Accept/defer/dismiss actions use the existing `CareerRecommendationAction` API and per-user stable source-key uniqueness. Completion remains user-reported.

## Boundaries

This is a transparent planning aid, not an AI-generated diagnosis, proficiency certification, readiness score, hiring prediction or guarantee. A low self-rating does not prove inability; a missing rating means only that no linked rating was found. The system does not automatically change skill ratings, mark roadmap tasks complete, contact employers or schedule external reminders.
