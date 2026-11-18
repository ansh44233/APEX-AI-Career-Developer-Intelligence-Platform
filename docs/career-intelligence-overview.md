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
