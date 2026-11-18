# APEX Learning Intelligence

The recommendations endpoint turns a user's saved practice sessions and latest self-entered skill assessments into a small, explainable set of next steps.

## Endpoint

`GET /api/intelligence/recommendations`

- Requires an authenticated Better Auth session.
- Derives the user identity on the server; it does not accept a user ID from the client.
- Reads the latest 250 skill-assessment records and the 250 most recent practice sessions for that user.
- Returns recommendations, per-module activity signals and the rules used to produce them.
- Uses `Cache-Control: no-store`.

## Recommendation rules

1. A latest self-assessment rating of 1–3 out of 5 can suggest a related practice module when a skill-to-module mapping exists.
2. A module with no saved practice can be suggested as a way to establish an activity baseline.
3. A module whose most recent session is more than 21 days old can be suggested for a revisit.
4. When no other rule produces a suggestion, the least-practised module is offered as a coverage suggestion.

The response also reports per-module session totals, attempt totals, sessions in the last 21 days, and the latest practice date.

## Interpretation and limits

- Self-assessments are subjective and remain user-entered.
- Session and attempt counts measure recorded activity, not skill or proficiency.
- The endpoint does not infer weaknesses from written responses or unscored attempts.
- It does not claim improvement unless the user records new assessment evidence.
- The 250-record retrieval limits mean older records may not affect the current recommendation.
- Recommendations are deterministic rules, not model-generated advice.

PostgreSQL and authentication must be configured for live account data. No AI provider is required.
