# Adaptive learning recommendations

## GET /api/intelligence/recommendations

Requires an authenticated session and returns up to five explainable practice recommendations.

### Inputs

- Latest user-entered skill assessment per skill (rating scale assumed to be 1–5).
- Saved practice-session counts by module.

### Rules

1. A latest assessment at 3/5 or below may recommend a mapped practice module.
2. Skill names are matched against a small, explicit keyword map. Unmapped skills are not guessed.
3. If no mapped low-rated skill is found, recommend the least-practised module by saved session count.
4. When there is no assessment or practice history, the first recommendation is framed as a baseline/getting-started activity.

### Limits

This is a deterministic rules engine, not an AI model. Ratings are self-reported and session volume is not evidence of proficiency. The response includes the basis and reason for each recommendation. No readiness percentage is calculated.
