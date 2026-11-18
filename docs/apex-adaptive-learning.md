# APEX Adaptive Learning Engine

## Endpoint

`GET /api/intelligence/adaptive` returns user-scoped prompt-level learning signals.

## Signals

- A prompt is suggested for review when its latest explicitly recorded numeric score is lower than the previous score for that same prompt.
- A prompt is suggested for revisit after 21 days without a saved attempt.
- Score trends compare only the two latest scored attempts; unscored attempts are not treated as zero.
- The dashboard displays suggested next steps and recorded score changes.

## Safety of interpretation

APEX does not assume a score scale, infer ability from response text, or claim that score changes prove learning. Score comparisons are descriptive only. Recommendations are deterministic and based on persisted records.

## Privacy and limits

- Authentication is required and user ownership is derived from the server-side session.
- Reads up to 500 latest saved attempts and returns no response text.
- The feature requires PostgreSQL and existing practice-session persistence.
- It does not call an AI provider or execute submitted code.
