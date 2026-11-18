# APEX Job Intelligence

Phase 23 adds a private job pipeline connected to APEX career goals.

## User experience

- Save a job with company, role, location, optional source URL, pasted job description and private notes.
- Optionally link the listing to one of the user's active career goals.
- Analyse the pasted description against a bounded built-in vocabulary of 20 skill areas.
- Track status as saved, applied, interview, offer, rejected or withdrawn.
- Search and filter the user's most recently updated listings.
- Open the original source URL when supplied.
- Compare resume content and continue to interview preparation through existing APEX modules.

## API

- `GET /api/jobs` — list up to 100 job records belonging to the authenticated user.
- `POST /api/jobs` — create a job record; optional goal must belong to the authenticated user.
- `PATCH /api/jobs/:id` — update an owned job and validate any linked goal ownership.
- `DELETE /api/jobs/:id` — delete an owned job only.

The server derives ownership from the Better Auth session. A user ID is never accepted from the request body. Job descriptions are capped at 20,000 characters, notes at 4,000 characters, and source URLs must use HTTP or HTTPS.

## Data and limitations

- Job records are private and cascade-delete with their owner. Deleting a career goal sets its linked job goal reference to null.
- APEX does not scrape job boards or fetch arbitrary job URLs. Users paste the job description and optionally save the official listing URL.
- APEX does not assert that a saved listing is currently open or live.
- Skill detection is deterministic phrase matching against a small vocabulary. The detected terms are not an ATS score, complete requirement extraction, candidate proficiency assessment, or hiring prediction.
- Terms absent from the pasted text are not necessarily missing requirements; job descriptions vary.
- Status tracking is user-reported and is not synchronized with an employer's application system.

## Database

Apply migration `0010_job_intelligence` and regenerate Prisma Client before using this feature:

```bash
npm run db:generate
npm run db:deploy
```

For local development, use the project's normal migration workflow and verify the migration against a development database before deployment.
