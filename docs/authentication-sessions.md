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

The repository has not yet been installed or tested against a live PostgreSQL database. Do not treat sign-in as production-ready until migrations and sign-up/sign-in/sign-out integration tests pass.

## Current limitations and production checklist

- Email verification is currently disabled because no email delivery provider is configured. Do not collect real user accounts until verification and password-recovery email delivery are configured.
- No OAuth providers are configured.
- Add rate-limit monitoring and abuse controls appropriate to deployment traffic.
- Configure HTTPS, trusted origins and production secrets.
- Add account deletion, data export and session management controls.
- Add tests for sign-up, sign-in, invalid credentials, expiry, sign-out and cross-user access.
- Keep private resume content and practice responses out of logs.

## API

- `GET /api/auth/session`: safe authenticated user profile, or 401.
- `DELETE /api/auth/session`: signs out the current session.
- Better Auth handlers: `/api/auth/*`.
