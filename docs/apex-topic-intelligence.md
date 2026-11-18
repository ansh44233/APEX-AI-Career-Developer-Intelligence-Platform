# APEX Topic Intelligence

## Endpoint

`GET /api/intelligence/topics` returns prompt-level activity for the authenticated user.

## What it measures

- Up to 500 most recent saved attempts are read through the owning practice session.
- Attempts are grouped by exact prompt text, case-insensitively, within each module.
- Each group reports attempt count, first/last seen timestamps and days since last attempt.
- A numeric average is returned only when one or more scores were explicitly stored on those attempts.

## Interpretation

A repeated prompt means the user revisited that exact prompt. It does not prove mastery, improvement, confusion or weakness. APEX does not use response text to infer quality and does not invent semantic topic tags. Distinct phrasings about the same underlying concept remain separate groups.

## Privacy and limits

- Authentication is required.
- The user ID is derived from the server-side session; callers cannot request another user's records.
- The response is uncached and limited to the 500 most recent attempts.
- No response text is returned by this endpoint.
- Database configuration is required.
