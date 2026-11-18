# Phase 20 — Intelligent Mock Interview Engine

## Route

- `/features/mock-interview`
- Linked from the Intelligent Interview Preparation workspace.

## Experience

The mock interview contains nine deterministic APEX-authored prompts across three rounds:

- Behavioural: introduction, ownership and collaboration.
- Technical: problem decomposition, debugging and trade-offs.
- System Design: service design, failure handling and security/privacy.

Each question includes a suggested time budget, follow-up prompt and a self-review rubric. Learners can save an answer, record a self-reported 1–5 rating, and move through the sequence. A browser-local countdown can be started, paused and reset. Sessions can be linked to an active career goal or left as general practice.

## Persistence

- Uses the existing authenticated `POST /api/practice/sessions` endpoint with module `interview`.
- Saves each response through `POST /api/practice/sessions/:id/attempts`.
- Reopens session history through the existing session and attempt GET endpoints.
- Completes or abandons sessions through the existing session PATCH endpoint.
- Stores the self-review rating as part of the written response text. It does not write to the numeric score field or represent the rating as an objective score.

No schema migration is required.

## Boundaries

- All nine prompts are APEX-authored simulation prompts. They are not asserted to be actual questions from any named employer.
- This phase does not merge company evidence claims or community interview reports into the mock interview script. Those remain separately available in Company Intelligence and Interview Preparation.
- The timer is browser-local, is not enforced by the server, and pauses when the user pauses or leaves the page.
- The question set is fixed and sequential; it is not dynamically adapted to answers.
- Self-review ratings are learner-entered and are not AI grading, verified skill measures or hiring predictions.
- No voice analysis, automated feedback, answer scoring service or interview outcome prediction is connected.
- Session persistence requires the existing PostgreSQL/authentication configuration and migrations.

## Verification status

The route and navigation were committed through GitHub. No local build, TypeScript check, database integration test or browser test was run for this phase.


## Adaptive Interview Intelligence (Phase 21)

The mock-interview page includes an adaptive practice panel backed by `GET /api/intelligence/interview-prep`.

- The endpoint requires authentication and derives ownership from the server session. An optional `goalId` must belong to the signed-in user; without it, analysis covers the user's saved mock-interview sessions across goals.
- It examines up to 100 recent mock-interview sessions and up to nine saved attempts per session. Only attempts with the stable `MOCK|question-id|` prefix are included.
- Coverage is based on whether an answer is saved for one of the nine fixed APEX prompts. Coverage is not a proficiency measure.
- Self-review averages use only ratings explicitly saved in the response text. A prompt is flagged for review only when its average self-review is 2/5 or lower. These ratings are learner opinions, not objective assessment.
- Next-practice priority is: low self-review average, then an unanswered prompt, then the least recently practised answered prompt.
- The API returns aggregate prompt metadata and does not return answer text. It does not use AI, infer ability, claim employer question frequency, or predict hiring outcomes.

## Verification status

Source files and documentation were committed through GitHub. No local TypeScript check, production build, database integration test, or browser test was run for this phase. The endpoint uses the existing practice-session schema and requires the previously documented database migrations.
