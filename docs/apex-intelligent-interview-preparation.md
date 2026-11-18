# Phase 19 — Intelligent Interview Preparation

## Route

- `/features/interview-prep`
- Query parameters: `company` and `role`; both are validated against the static company and role directories before being applied.

## What it does

- Selects a company and role from the existing Company Intelligence directory.
- Loads only moderator-approved evidence claims for the exact company/role pair through `GET /api/company-intelligence/claims`.
- Converts each approved claim into an original practice prompt asking the learner to demonstrate the capability. It does not reproduce the claim as if it were an actual employer interview question.
- Adds two APEX-authored general role-practice prompts when there is no approved evidence.
- Displays the exact supporting passage, source title/URL, capture date and a shortened SHA-256 snapshot hash for evidence-backed prompts.
- Uses the existing authenticated practice-session and attempt APIs to save written answers, reopen sessions, inspect saved answers, and complete or abandon sessions.
- Allows an optional active career-goal link; the existing practice API verifies ownership.

## Evidence and content boundaries

- Employer claims are loaded from the approved-only claims API. Pending or rejected claims are not exposed by that API.
- Explicit requirements and employer guidance retain separate labels.
- Evidence claims are role-scoped by the moderator review workflow; the UI requests an exact company and role match.
- APEX-authored prompts are generated deterministically from the approved claim text and a fixed rubric. They are not questions known to have been asked by the employer.
- The general project walkthrough and problem-solving prompts are APEX-authored practice content.
- Community-submitted interview experiences remain a separate source and are not merged into employer evidence.
- No hiring likelihood, question frequency, or interview outcome is inferred.

## Current limitations

- No AI generation, AI grading, voice interview, timer, automatic rubric scoring or adaptive follow-up service is connected.
- Claim-to-prompt conversion is deterministic and uses a shared demonstration-oriented prompt template.
- The session history list shows the latest 30 sessions, filtered client-side to the interview module.
- Practice persistence requires PostgreSQL, applied Prisma migrations, and a configured authentication environment.
- Existing practice APIs store responses as submitted; the UI does not currently store a structured self-review score for this route.
- No local build, typecheck, database migration, API integration test or browser test was run as part of this phase.

## Related routes and APIs

- Company Intelligence: `/features/company-intelligence`
- Approved claims: `GET /api/company-intelligence/claims?company=...&role=...`
- Practice sessions: `GET/POST /api/practice/sessions`
- Session attempts: `GET/POST /api/practice/sessions/:id/attempts`
- Career goals: `GET /api/career-goals`

