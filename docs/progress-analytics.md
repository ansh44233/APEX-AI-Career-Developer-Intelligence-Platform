# Progress analytics

The dashboard progress analytics panel consumes `GET /api/intelligence/overview`.

## Included metrics

- Total practice sessions and status counts.
- Saved attempt count and average score, only when a scoring workflow has explicitly stored scores.
- Seven-day session-start activity.
- Practice session distribution by module.
- Current average self-assessment rating and record count per skill.

## Interpretation rules

- Activity counts describe recorded use, not ability or job readiness.
- Skill ratings are user-entered and are not independently verified.
- An average attempt score is omitted when no score values have been recorded.
- APEX does not calculate a readiness percentage until a validated methodology exists.
- The seven-day chart counts session start dates, not time spent or completed work.

## Data and access

The overview endpoint requires an authenticated account and scopes every query to the current user. The dashboard requests fresh data with `cache: "no-store"`. Database setup is still required before these account-backed metrics can be populated in a live environment.

## Known limitations

- No historical time-series aggregation for skill ratings yet; the panel displays the current average and number of records.
- No export, date-range filter, or comparative cohort analytics.
- The UI and endpoint have not been build-tested or integration-tested in this repository workflow.
