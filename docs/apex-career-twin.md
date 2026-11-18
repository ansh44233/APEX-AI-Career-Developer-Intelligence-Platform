# APEX Career Twin — Phase 44

## Purpose

Career Twin is a structured, descriptive view of a user's saved career direction. It compares the role template associated with an active goal against an alternative role track and highlights recorded signals that may be useful when exploring a transition.

## Data sources

The page reads the authenticated `GET /api/intelligence/graph` endpoint. It uses:
- Active goals owned by the signed-in user.
- Latest skill assessments attached to the selected goal, with unlinked profile assessments included only where the existing graph API explicitly supplies them.
- Roadmap task counts by exact skill key.
- Practice session, attempt and learner self-evaluation counts linked to the goal and roadmap tasks.
- Moderator-approved company evidence claims already matched to the goal's exact company and role.
- Application counts explicitly linked to the goal.

It does not request resume text, job descriptions, private notes, practice answers, assessment evidence notes, or unrelated account data.

## Role comparison

The UI offers built-in tracks for frontend, backend, full-stack, data, DevOps/platform, mobile and general software engineering. Each track has a transparent skill-key list. The current goal role is mapped by role-title keywords; users choose an alternative track explicitly.

Comparison displays:
- Percentage of template skills with a saved self-assessment.
- Recorded low self-ratings and not-yet-assessed template skills.
- Exact skill-key overlap between templates.
- Existing linked practice and approved evidence context.

Assessment coverage is only recorded-data coverage, not proficiency, employability or transition difficulty. A missing assessment does not mean the user lacks a skill. Low ratings are learner-entered reflections, not objective grades.

## Career Copilot handoff

The page can prefill a Career Copilot prompt with the selected current and alternative directions. Career data sharing remains off unless the user explicitly enables the existing per-message consent control in Career Copilot.

## Persistence and limitations

- Alternative direction selection is local UI state and is not saved as a new career goal.
- No external company or vacancy research is performed for the alternative role.
- No probability, salary, hiring, career success or job-fit score is calculated.
- Suggested experiments are prompts for exploration, not guaranteed pathways.
- No new database model or migration was introduced.
