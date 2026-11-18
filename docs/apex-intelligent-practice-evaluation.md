# APEX Intelligent Practice Evaluation — Phase 37

## Purpose

Phase 37 adds a learner-controlled structured evaluation to saved Interview Lab and OA Arena attempts. It records rubric ratings, strengths, improvement areas and a next practice action, then feeds task-linked self-rating history into the personalised learning path.

## API

`PATCH /api/practice/sessions/:id/attempts` accepts an attempt UUID, 1–8 unique rubric dimensions rated 1–5, and bounded learner-entered strengths, improvement areas and next action.

The route verifies session ownership and verifies that the attempt belongs to that session before updating it. It stores a versioned `feedbackJson` object with source `learner_self_evaluation` and a numeric `score` equal to the mean of the rubric ratings. The GET endpoint returns saved evaluation metadata alongside each attempt.

## UI

- Reusable `PracticeEvaluationForm` appears below saved answers/submissions in Interview Lab and OA Arena.
- Three default dimensions: correctness/relevance, reasoning/explanation, and examples/tests/edge cases.
- Learners record strengths, improvement areas and one next action.
- Existing evaluations are restored when history is reloaded and can be updated.

## Learning path integration

`GET /api/intelligence/learning-path` reads up to 1,000 task-linked attempts and includes only evaluations explicitly marked `learner_self_evaluation`. For each incomplete roadmap task, it reports evaluation count, average rating, latest rating and direction between the latest two ratings (`higher_self_rating`, `lower_self_rating`, `unchanged`, or `insufficient_data`).

Only task-linked attempts are attributed to a roadmap task. No general attempt is guessed to belong to a task.

## Interpretation and limits

- Ratings are the learner's own reflection, not an automated grade or independently verified measure of ability.
- The average rubric rating is descriptive, not a proficiency or readiness score.
- A higher self-rating does not prove improvement; a lower rating does not prove regression. These comparisons only order suggested practice steps and do not label the learner as weak or proficient.
- No answer text is sent to an AI provider by this feature.
- No code execution, hidden test cases, answer correctness checks, AI grading, hiring prediction or employer scoring is implemented.
- Evaluation does not automatically mark roadmap tasks complete.
- Existing `PracticeAttempt.feedbackJson` and `score` fields are reused; Phase 37 introduces no database migration.

## Verification status

Source updates were committed. TypeScript checks, production build, database integration and browser tests have not been run. Pending database migrations from earlier phases still need to be applied in order and Prisma Client regenerated before database-backed use.