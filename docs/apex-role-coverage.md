# APEX Skill-to-Role Coverage

## Endpoint

`GET /api/intelligence/role-coverage` returns a user-scoped skill map for active career goals.

## How it works

- Selects a built-in role template using keywords in the saved target-role title.
- Includes the latest self-assessment for each template skill.
- Assessments linked to a different career goal are excluded. Unlinked assessments are treated as general profile assessments.
- Lists relevant APEX practice modules alongside each skill.
- Supports multiple active goals independently.

## Coverage definition

Assessment coverage is the percentage of template skills with a saved self-rating. It does not measure proficiency, employability, job readiness, or hiring likelihood. Ratings remain user-entered and are displayed on their original 1–5 scale.

## Role-template limitations

Templates are broad starting points, not verified employer requirements. The same role title can mean different things across companies and seniority levels. A future iteration should allow users to edit required skills and import a job description with explicit consent.

## Privacy and operations

- Requires authentication; user ID is derived from the server-side session.
- Only active goals and that user's assessments are queried.
- No response text, resume text, external job-market data, or AI provider is used.
- Requires PostgreSQL and existing career-goal / skill-assessment persistence.
