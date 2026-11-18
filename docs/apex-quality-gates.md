# APEX Quality Gate — Phase 47

## Automated checks

The GitHub Actions workflow at `.github/workflows/quality.yml` runs on pushes to `main` and pull requests targeting `main`.

It performs, in order:

1. Install project dependencies.
2. Validate `prisma/schema.prisma` against the configured Prisma provider.
3. Generate Prisma Client from the checked-in schema.
4. Run the strict TypeScript check (`npm run typecheck`).
5. Run the Next.js production build (`npm run build`).

The workflow uses placeholder CI-only environment values. It does not connect to a real database, apply migrations, seed data, or deploy the application.

## Current validation limitations

- The repository currently has no automated unit, API integration, or browser end-to-end test suite.
- Prisma schema validation does not prove that all historical SQL migrations can be applied to a clean PostgreSQL instance or safely upgraded from an existing database.
- TypeScript and production build checks do not prove authentication, authorization, ownership isolation, or database transaction behaviour at runtime.
- CI dependency installation currently uses `npm install` because the repository does not contain a committed npm lockfile. Dependency versions may therefore drift within declared semver ranges. Add and commit a lockfile before switching CI to `npm ci`.
- No CI result should be described as passing until an actual GitHub Actions run completes successfully.

## Recommended next validation steps

1. Commit an npm lockfile and use `npm ci`.
2. Add PostgreSQL service-container migration tests using `prisma migrate deploy` on an empty database.
3. Add API integration tests for unauthenticated access, cross-user resource access, invalid input, closed practice sessions and moderator-only endpoints.
4. Add browser smoke tests for sign-in, goal creation, interview practice, job preparation, Career Twin and Career Command Center.
5. Keep deployment as a separate, explicitly approved release step.


## Phase 47.2 — first CI findings

The first completed TypeScript run failed and surfaced syntax defects that had not been caught by earlier source-pattern checks. The following corrections were committed:

- Dashboard module and activity declarations contained literal escaped newline characters.
- Company Intelligence preparation-plan array contained a literal escaped newline.
- Public repository path filtering used an invalid regular-expression escape.
- Public repository test traceability sort expression had an incorrectly placed `.slice()`.
- GitHub repository intelligence JSX contained a duplicated, unwrapped test-plan section.

The initial CI run had already passed Prisma schema validation and Prisma Client generation before the TypeScript step failed. A later workflow revision adds a PostgreSQL 16 service and runs `prisma migrate deploy` against a clean, disposable CI database before typechecking.

The corrected files must be confirmed by a completed CI run. No local compiler or build result is claimed here.
