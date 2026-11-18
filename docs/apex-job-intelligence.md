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


## Job-to-Preparation Intelligence (Phase 24)

The route `/features/job-preparation?jobId=<uuid>` connects a saved job to a preparation workspace.

- `GET /api/jobs/:id/preparation` requires authentication and verifies the job belongs to the current user.
- On first read, it idempotently seeds `JobPreparationTask` rows from exact phrase matches in the saved job description using the shared 23-skill catalog.
- `PATCH /api/jobs/:id/preparation` updates a task status only when that task belongs to the user's selected job.
- Checklist states are `todo`, `in_progress`, and `completed`; completion is self-reported.
- The page compares the saved job description against pasted resume text in the browser. The resume is not sent to the API or persisted.
- It distinguishes terms detected in both texts from job-description terms not detected in the resume and links each requirement to an existing practice module.
- The job tracker links each saved listing to its own preparation workspace.

### Limitations

The shared catalog is deterministic phrase matching, not semantic understanding. It can miss synonyms, context and requirements outside the catalog. A term missing from a resume does not prove the user lacks the skill; a matching term does not prove proficiency. Checklist tasks are practice suggestions, not verified hiring criteria. No ATS score, AI grading, employer verification, hiring prediction or automatic job-board scraping is provided.

### Database

Apply migration `0011_job_preparation_tasks` and regenerate Prisma Client after migration `0010_job_intelligence`:

```bash
npm run db:generate
npm run db:deploy
```
