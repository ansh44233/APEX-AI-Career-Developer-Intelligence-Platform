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
