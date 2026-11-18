# APEX data model and persistence rollout

## Initial schema

The first PostgreSQL migration is at prisma/migrations/0001_initial_schema/migration.sql.

It defines:
- users and external authentication identities
- hashed opaque sessions with expiry
- career goals
- practice sessions and individual attempts
- dated, user-entered skill assessments
- versioned user consent records

The schema is a starting point, not a connected database. No production credentials are configured and no migration has been applied to a live database.

## Important implementation rules

1. Authenticate every request on the server; never accept a browser-supplied user ID as identity.
2. Scope every user-owned query by the authenticated user.
3. Store only a hash of random session tokens; set cookies Secure in production, HttpOnly and an appropriate SameSite policy.
4. Validate all request bodies and cap input sizes.
5. Do not log resume text, interview answers, tokens, provider keys, or raw database errors.
6. Add retention and deletion flows before storing user-submitted career documents or practice responses.
7. Add rate limits before enabling paid AI operations.

## Next integration steps

1. Select a PostgreSQL host and configure DATABASE_URL in deployment secrets.
2. Add a migration runner and test the migration against a disposable database.
3. Choose an authentication implementation and connect identities and sessions.
4. Add server-side data access and authenticated APIs for goals and practice sessions.
5. Add integration tests for authorization, ownership isolation, session expiry and deletion.
6. Only then enable persistent user-facing workflows.

## Current status

The schema is committed for review. The API health endpoint still reports database, authentication, AI and background jobs as not configured until those services are actually connected.
