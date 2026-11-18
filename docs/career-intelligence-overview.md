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


Practice-to-goal linking is available when starting new Interview Lab and OA Arena sessions: the learner can select an active career goal or leave the session as general practice. The existing practice-session API validates that a supplied goal belongs to the signed-in user. Existing sessions are not retroactively assigned to goals.


## Career Command Center (Phase 28)

The dedicated page `/features/career-command-center` provides one authenticated workspace for application pipeline, preparation, skill coverage, practice activity and next actions. It composes these existing APIs in parallel:

- `GET /api/intelligence/career-pipeline`
- `GET /api/intelligence/overview`
- `GET /api/intelligence/recommendations`
- `GET /api/intelligence/roadmap`
- `GET /api/intelligence/role-coverage`

### Action queue

The client derives a short queue from the loaded records in this order: pending overdue timeline events, pending upcoming timeline events, the first incomplete task on the first active goal, then up to two deterministic practice recommendations. Each item links to the corresponding APEX module. This queue is rule-based and not model-generated. The Copilot CTA opens the Career Copilot skill, where sharing a bounded account snapshot is an explicit per-message opt-in.

### Weekly review

The page shows a descriptive on-demand summary: practice sessions started in the last seven days (from the overview endpoint's recent-activity window), all-time completed sessions, timeline events marked completed and preparation tasks marked completed. It is not an automatically delivered weekly report, and these counts are not a measure of proficiency or hiring likelihood.

### Goal and skill coverage

The goal panel shows the first active goal returned by the roadmap API. Role coverage is aggregated as assessed skills / template skills across active goals. The denominator and assessment coverage come from role-title templates; coverage is not an ability score, nor does it imply that the template is an employer's requirements.

### Data and limitations

All source APIs enforce authentication and user scoping. The page adds no schema changes or new persistence. It relies on existing database migrations for job applications, preparation tasks, timeline events, career goals and intelligence models. If any endpoint fails, the page shows an error and retry action rather than fabricating partial metrics. It does not send notifications, create calendar events, edit records, deliver a scheduled report, or claim an AI-generated daily plan.


## Phase 30 — Persistent Career Memory

The dashboard's Career Memory panel calls the authenticated endpoint `GET /api/intelligence/career-memory`. It reconstructs a structured profile from the user's existing records rather than creating a second copy of career data.

### Included information

- Career goals, target roles/companies and roadmap completion counts.
- Goal-linked practice session and attempt counts, plus represented modules.
- Goal-linked user-entered skill ratings.
- Global latest skill ratings and comparison with the previous saved rating for the same skill.
- Job application stage counts and recent application metadata.
- Practice activity by module and pending upcoming/overdue timeline counts.

### Privacy and interpretation

The endpoint is authenticated and all source queries are scoped to the current user. It intentionally excludes resume contents, job descriptions, private job notes, practice response text and skill-assessment evidence notes. It does not return moderator-only company evidence or infer employer requirements.

The profile is reconstructed on request/page load from existing persistent records; no new memory table or migration is added. Skill-rating changes are only changes in self-reported ratings, not objective skill improvement. Practice volume measures activity, not proficiency. Goal-linked statistics include only records explicitly associated with the goal; unlinked activity remains part of the global profile rather than being silently assigned.

### Bounds and limitations

The endpoint reads up to 30 goals, 500 recent skill assessments, 500 recent practice sessions and 100 recent applications. Pending timeline action totals use database counts. The response is a descriptive snapshot, not an AI-generated personality/profile, validated readiness score, hiring prediction or professional assessment. No local typecheck, Prisma generation, production build, database integration test or browser test has been run for this phase.

## Phase 33 — Career Outcome Intelligence

The authenticated endpoint `GET /api/intelligence/outcomes` connects explicitly goal-linked roadmap completion, job-specific preparation, skill self-rating history, practice activity, saved application stages, recommendation actions and timeline follow-through. The Career Outcome Intelligence panel is integrated into the Career Command Center. See [Phase 33 documentation](apex-career-outcome-intelligence.md).
