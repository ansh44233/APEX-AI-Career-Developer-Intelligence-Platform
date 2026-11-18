# APEX Quality Gate — Phase 47

## Automated checks

The GitHub Actions workflow at `.github/workflows/quality.yml` runs on pushes to `main` and pull requests targeting `main`.

It performs, in order:

1. Install project dependencies.
2. Validate `prisma/schema.prisma` against the configured Prisma provider.
3. Generate Prisma Client from the checked-in schema.
4. Apply every checked-in migration to a clean PostgreSQL 16 service database using `prisma migrate deploy`.
5. Run the strict TypeScript check (`npm run typecheck`).
6. Run route-level API security regression tests (`npm test`).
7. Run the Next.js production build (`npm run build`).

The workflow uses placeholder CI-only environment values. It does not connect to a real database, apply migrations, seed data, or deploy the application.

## Current validation limitations

- Route-level Vitest security tests use mocked Prisma persistence; they are not full database-backed API integration tests. Playwright browser smoke tests cover public entry points and core preparation pages, but do not yet exercise authenticated end-to-end workflows.
- Prisma schema validation does not prove that all historical SQL migrations can be applied to a clean PostgreSQL instance or safely upgraded from an existing database.
- TypeScript and production build checks do not prove authentication, authorization, ownership isolation, or database transaction behaviour at runtime.
- CI dependency installation currently uses `npm install` because the repository does not contain a committed npm lockfile. Dependency versions may therefore drift within declared semver ranges. Add and commit a lockfile before switching CI to `npm ci`.
- No CI result should be described as passing until an actual GitHub Actions run completes successfully.

## Recommended next validation steps

1. Commit an npm lockfile and use `npm ci`.
2. Expand database-backed API integration coverage and authenticated browser workflows for goal creation, interview practice, job preparation, Career Twin and Career Command Center.
3. Keep deployment as a separate, explicitly approved release step.


## Phase 47.2 — first CI findings

The first completed TypeScript run failed and surfaced syntax defects that had not been caught by earlier source-pattern checks. The following corrections were committed:

- Dashboard module and activity declarations contained literal escaped newline characters.
- Company Intelligence preparation-plan array contained a literal escaped newline.
- Public repository path filtering used an invalid regular-expression escape.
- Public repository test traceability sort expression had an incorrectly placed `.slice()`.
- GitHub repository intelligence JSX contained a duplicated, unwrapped test-plan section.

The initial CI run had already passed Prisma schema validation and Prisma Client generation before the TypeScript step failed. A later workflow revision adds a PostgreSQL 16 service and runs `prisma migrate deploy` against a clean, disposable CI database before typechecking.

The corrected files must be confirmed by a completed CI run. No local compiler or build result is claimed here.


## Phase 47.3 — API security regression tests

A Vitest-based route test suite now exercises the recommendation-action API with mocked authentication and Prisma boundaries:

- unauthenticated list, create and completion requests return 401 without database writes;
- list queries are constrained to the authenticated user ID;
- external destinations are rejected before persistence;
- a career goal not owned by the caller cannot be attached to a new action;
- an action belonging to another user cannot be completed.

These are route-level security regression tests with mocked persistence, not full PostgreSQL-backed API integration tests. The clean PostgreSQL migration test remains a separate CI step. The tests do not call a live database or modify production data.


## Phase 47.4 — practice ownership and moderator authorization

The route regression suite now also covers:

- attempt history and attempt creation are blocked when the practice session is not owned by the caller;
- a learner cannot evaluate an attempt that is not part of their selected session;
- unauthenticated practice evaluation is rejected;
- unauthenticated users and ordinary users cannot load the interview-experience moderation queue;
- a moderator can load the pending moderation queue.

These tests mock authentication and Prisma calls. They verify route authorization and query scoping, not live database behaviour. The full CI workflow has completed successfully on the preceding commit, including clean PostgreSQL migration deployment, TypeScript, the first seven security tests and the production build; the Phase 47.4 tests subsequently passed in run 44244558094, including the production build.


## Phase 47.5 — browser smoke coverage

Playwright runs against the built Next.js server in CI. Chromium smoke tests verify that the landing page, sign-in, sign-up, Company Intelligence, Question Bank and Interview Experiences routes return successfully and render their expected page headings. The interview-experience page also exercises its public approved-report read against the disposable CI PostgreSQL database.

These are public-page smoke tests, not authenticated user journeys or visual-regression tests. They do not create accounts, submit reports, mutate career data, or test protected dashboard workflows.


## Phase 47.6 — connected journey and interaction tests

The browser suite now includes two interaction checks in addition to the six public-page smoke tests:

- Select a role in Company Intelligence, follow its Question Bank link, and verify that company and role context are carried into the destination page.
- Search the Question Bank for a known prompt and verify that unrelated prompts are filtered out.

The expanded suite has eight tests. The six-test baseline passed in CI run 44245045455. The new interaction coverage must be treated as pending until the corresponding GitHub Actions run reports success. These tests still do not create authenticated accounts or mutate saved career records.
