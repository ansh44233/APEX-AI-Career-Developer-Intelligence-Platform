# APEX Skill Mastery Intelligence — Phase 38

## Purpose

Phase 38 connects exact goal-linked roadmap skill keys with saved self-assessments and task-linked learner practice evaluations. It provides a skill-by-skill history in the Career Command Center.

## API

`GET /api/intelligence/skill-mastery` requires authentication and returns active goals owned by the caller only.

For each roadmap skill, the endpoint returns roadmap task counts, latest and earliest goal-linked self-assessment, self-rating direction, number of task-linked evaluated attempts, latest and average rubric averages, direction between the latest two practice self-ratings, rubric-dimension averages, repeated improvement notes, targeted deterministic next-step suggestions and the latest saved reflection.

Bounds: up to 50 active goals, 1,000 roadmap tasks, 1,000 self-assessments and 1,500 task-linked practice attempts. Attempt answer text is never selected or returned.

## Recurring improvement notes

Improvement areas are split on newlines and semicolons, normalised for whitespace and case, and grouped only when the exact normalised phrase occurs at least twice. This is intentionally not semantic or AI analysis; differently worded versions of the same issue are not merged. Suggestions use transparent deterministic rules, for example a low recorded rubric-dimension average or a repeated exact improvement note.

## UI

`SkillMasteryIntelligencePanel` is integrated into the Career Command Center after the personalised learning path. It displays goal-level coverage, skill cards, self-assessment ratings, task-linked practice evaluation history, rubric dimension averages, repeated notes and the latest saved strengths/improvement/next action.

## Interpretation and privacy

- A skill is included only when it appears as a `skillKey` on a roadmap task belonging to the active goal.
- Self-assessment ratings and practice rubric ratings are kept as separate signals; they are not blended into a synthetic mastery score.
- A higher/lower rating trend is a comparison of learner-entered values, not proof of improvement or regression.
- Rubric dimension averages are descriptive summaries, not objective grades.
- Repeated improvement notes are exact text matches, not semantic classification.
- Practice answers, private job notes, resumes and job descriptions are not returned by this endpoint.
- No AI provider is called; no automated answer grading, hiring prediction or skill certification is performed.

## Database

No new Prisma model or migration is introduced. The feature reuses career goals, roadmap tasks, skill assessments, practice sessions and `PracticeAttempt.feedbackJson`/`score`.

## Verification status

Source files were committed and reviewed for ownership filters and bounded reads. TypeScript checks, production build, live database integration and browser tests have not been run.