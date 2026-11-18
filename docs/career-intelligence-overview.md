# Career intelligence overview API

## GET /api/intelligence/overview

Requires an authenticated Better Auth session. Returns a no-store, account-scoped summary derived from saved PostgreSQL records.

### Response

- `totals`: session counts by lifecycle state, attempt count, and average explicitly recorded attempt score (or `null`).
- `moduleBreakdown`: session count by practice module.
- `recentActivity`: sessions started in the rolling seven-calendar-day window, with attempt counts.
- `skillAssessments`: per-skill average of user-entered assessment ratings, count, and latest assessment timestamp.
- `methodology`: explains that activity is not proficiency and that no readiness score is emitted.

### Status codes

- `200`: overview returned.
- `401`: no authenticated user.
- `503`: database/storage unavailable.

No user ID is accepted from the request. All queries are scoped to the authenticated user. The endpoint intentionally does not infer a readiness score from session volume or unscored attempts.


## Phase 18 — Connected Career Intelligence Graph

The authenticated endpoint `GET /api/intelligence/graph` combines each user's active career goals with the platform's existing company evidence, skill assessments, goal-linked practice sessions and roadmap tasks. The dashboard renders this as the Career Intelligence Graph panel.

For each goal, the graph exposes:
- Target company and role.
- Individually moderator-approved evidence claims, restricted to exact normalized company and role matches.
- User-entered skill self-assessments linked to the goal, plus unlinked profile assessments.
- Practice session and attempt counts from sessions explicitly linked to that goal, plus the module names represented in those sessions.
- Roadmap task totals, completion state and links to the corresponding practice modules.

Claim-to-skill/module mapping uses transparent keyword rules. Claims that do not match a known topic are marked `unmapped` and link back to Company Intelligence for manual inspection. The UI shows the claim classification, supporting excerpt and source link. It does not turn employer guidance into a mandatory requirement.

### Interpretation and limits

The graph is a connected view of saved data, not a predictive model. It does not calculate proficiency, employability, hiring probability or interview outcomes. A practice session counts toward a goal only when its `goalId` is explicitly associated with that goal; unlinked sessions are not silently attributed. Unlinked skill assessments may appear against each active goal as general profile context. The graph fetches up to 500 recent assessments and practice sessions per user, up to 100 company claims per goal, and up to 200 roadmap tasks per goal.

### Verification status

The API, dashboard component and dashboard integration were fetched again from GitHub and inspected for authenticated access, user-scoped goal queries, approved-only claims, exact normalized role matching, goal-linked practice filters and evidence source rendering. No local typecheck, Prisma generation, production build, database migration or browser test has been run.
