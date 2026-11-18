# APEX Interview Experience Moderation

## Phase 17.4

This phase adds server-enforced moderator permissions, a review queue, review decisions, and duplicate fingerprints for first-hand interview experience submissions.

### Server-side roles

The `users.role` column defaults to `user`. The only privileged values accepted by the migration constraint are `moderator` and `admin`.

The moderation API resolves the authenticated Better Auth session and reads the role directly from the database on every request. It does not trust a client-supplied role, hidden UI state, or a request body flag.

There is intentionally no public endpoint for changing roles. A database operator must promote a trusted account through a controlled database session after verifying its identity. Example SQL (replace the placeholder with the intended account's exact email):

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'moderator@example.com';
```

Use least privilege: assign `moderator` for review-only access; reserve `admin` for trusted operators. Never expose database credentials in the client or commit them to the repository.

### Review API

- `GET /api/admin/interview-experiences` — moderator/admin only; returns up to 100 oldest pending reports, counts by status, and possible-duplicate flags.
- `PATCH /api/admin/interview-experiences` — moderator/admin only; accepts a report UUID, approve/reject decision and optional review note.
- Reports must still be pending when the decision is written. Conditional update prevents two moderators from both changing the same pending record.
- A moderator cannot review their own submission.
- Public listing continues to return approved reports only.

### Duplicate detection

Submissions receive a deterministic fingerprint based on normalized company, role, round and question text. The API rejects a matching fingerprint already present in the report table with HTTP 409. The moderator queue also flags matching pending/approved fingerprints.

The fingerprint is an operational duplicate heuristic, not a cryptographic proof of authorship or plagiarism. Different wording can evade exact matching; similar but legitimate prompts can be flagged. Human review remains necessary.

### UI

The review dashboard is at `/features/moderation/interview-experiences`. Access to its API is independently enforced, so knowing the URL does not grant moderator privileges.

### Operational limitations

- Migration `0006_interview_experience_moderation` must be applied after migration 0005.
- This repository change does not run migrations or promote a real account.
- The queue displays the first 100 pending submissions; pagination is not implemented yet.
- There is no shared rate limiter, automated spam classifier, appeal workflow, edit-request state, or immutable audit-event table.
- Review decisions are stored on the report row with reviewer ID, timestamp and optional note; they are not a full append-only audit trail.
- Configure database backups, monitoring and abuse controls before public launch.

### Rollout

```bash
npx prisma migrate deploy
npx prisma generate
```

Then promote the intended trusted reviewer using a controlled database session. Confirm the account can load the review queue and a normal user receives HTTP 403.

### Verification status

Source files were fetched from GitHub after changes. No Prisma generation, TypeScript check, build, migration execution, API integration test, role-promotion operation or browser test has been performed. No deployment has occurred.
