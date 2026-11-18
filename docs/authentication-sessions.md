# APEX authentication session primitives

## Implemented

- Opaque 256-bit random session tokens.
- SHA-256 token hashes stored in the PostgreSQL sessions table; raw tokens are never stored in the database.
- HttpOnly, SameSite=Lax cookies with Secure enabled in production.
- Server-side session lookup and expiry enforcement.
- Session revocation and cookie clearing.
- GET /api/auth/session returns the current user's safe profile fields or 401.
- DELETE /api/auth/session revokes the current session.

## Important limitation

These are session-management primitives, not a complete sign-in system. There is no registration, password handling, OAuth callback, email verification, recovery flow, or trusted identity provider wired yet. Do not call createUserSession until a trusted sign-in flow has independently verified the user's identity.

## Before production

- Add a reviewed authentication provider or implement a complete, independently reviewed identity flow.
- Add CSRF protections appropriate to every state-changing route.
- Add rate limiting and abuse monitoring to login and recovery endpoints.
- Add session rotation after privilege changes and revoke sessions on account security events.
- Add integration tests for expiry, logout, missing users, cookie flags, and cross-user isolation.
- Configure secure secrets and HTTPS in the deployment environment.
