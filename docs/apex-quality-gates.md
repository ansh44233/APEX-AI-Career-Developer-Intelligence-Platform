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

- Route-level Vitest security tests use mocked Prisma persistence; they are not full database-backed API integration tests. Browser end-to-end tests are not yet configured.
- Prisma schema validation does not prove that all historical SQL migrations can be applied to a clean PostgreSQL instance or safely upgraded from an existing database.
- TypeScript and production build checks do not prove authentication, authorization, ownership isolation, or database transaction behaviour at runtime.
- CI dependency installation currently uses `npm install` because the repository does not contain a committed npm lockfile. Dependency versions may therefore drift within declared semver ranges. Add and commit a lockfile before switching CI to `npm ci`.
- No CI result should be described as passing until an actual GitHub Actions run completes successfully.

## Recommended next validation steps

1. Commit an npm lockfile and use `npm ci`.
2. Expand API integration coverage and add browser smoke tests for sign-in, goal creation, interview practice, job preparation, Career Twin and Career Command Center.
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

These tests mock authentication and Prisma calls. They verify route authorization and query scoping, not live database behaviour. The full CI workflow has completed successfully on the preceding commit, including clean PostgreSQL migration deployment, TypeScript, the first seven security tests and the production build; the new Phase 47.4 tests require their own CI run before being called passing.
