# APEX authentication

APEX uses Better Auth with the Prisma PostgreSQL adapter.

## Implemented

- Email/password sign-up and sign-in screens at `/sign-up` and `/sign-in`.
- Better Auth route handler at `/api/auth/[...all]`.
- Server-side session lookup through `auth.api.getSession`.
- Session sign-out and a no-store status endpoint at `/api/auth/session`.
- Password minimum length of 12 characters and maximum length of 128.
- Prisma models and SQL migration for users, sessions, accounts and verifications.
- Practice APIs reuse the Better Auth session to scope all records to the authenticated user.

## Environment

Set these variables in `.env.local`:

- `DATABASE_URL`: PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: unique random secret, at least 32 bytes of entropy.
- `BETTER_AUTH_URL`: canonical application origin, for example `http://localhost:3000`.

Generate a secret locally with `openssl rand -base64 32`. Never commit real credentials.

## Database migration

The second migration adds Better Auth fields and tables. It invalidates any sessions created by the earlier custom session primitive because the old session tokens cannot be converted. Existing user, career-goal, practice-session and assessment records are preserved.

Run:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run typecheck
npm run dev
```

GitHub Actions currently validates Prisma, applies all migrations to a clean PostgreSQL 16 service, runs API/security tests, builds the production app, and runs browser smoke tests that include account sign-up. This is a CI verification environment, not a production-like deployment test. Sign-in should not be treated as production-ready until the remaining authentication lifecycle and abuse-control checks below are completed.

## Current limitations and production checklist

- Email verification is disabled because no email delivery provider is configured. Treat this as a pre-production blocker before collecting real accounts; add verified email and password-recovery delivery first.
- No OAuth providers are configured.
- Authenticated high-cost APIs use a PostgreSQL-backed per-user fixed-window limiter. This does not protect anonymous sign-up/sign-in endpoints against distributed credential stuffing or signup abuse; add edge/IP-aware controls and monitoring before public launch.
- Expired rate-limit counter rows are not yet pruned automatically; add a bounded cleanup job or retention policy.
- Configure HTTPS, trusted origins and production secrets.
- Add account deletion, data export and session management controls.
- Expand authentication integration coverage for invalid credentials, session expiry, sign-out, email verification, password recovery and cross-user access. Current browser coverage includes sign-up and a protected career-goal flow.
- Keep private resume content and practice responses out of logs.
- The session cookie cache is enabled for five minutes; review this trade-off against immediate revocation requirements before production.

## API

- `GET /api/auth/session`: safe authenticated user profile, or 401.
- `DELETE /api/auth/session`: signs out the current session.
- Better Auth handlers: `/api/auth/*`.
