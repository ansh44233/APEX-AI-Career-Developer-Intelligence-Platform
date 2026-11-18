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


## Application Follow-up Intelligence (Phase 25)

The route `/features/application-follow-ups` adds a private, persistent timeline to the job pipeline.

- Create job-linked events for application deadlines, recruiter follow-ups, interviews, assessments and other actions.
- Events store a title, optional notes, scheduled timestamp, type and status.
- The page separates upcoming, past-due, completed and all events. Past-due counts include only pending events whose scheduled time has passed; the learner decides whether to complete or reschedule an item.
- `GET /api/job-events` returns up to 250 events belonging to the authenticated user and includes minimal linked-job context.
- `POST /api/job-events` verifies the linked job belongs to the authenticated user.
- `PATCH` and `DELETE /api/job-events/:id` are owner-scoped. Completing an event records `completedAt`; deleting a job cascades its events.
- The dashboard links directly to this workspace.

### Limitations

This is an in-app tracker, not a notification service. No email, push, SMS, calendar integration, scheduled background worker or automatic recruiter contact is implemented. The user must open APEX to see due items. Event timestamps are stored as timezone-aware instants; the browser converts local date/time input to ISO before sending. The API returns up to 250 events, so older events beyond that cap are not shown.

### Database

Apply migration `0012_job_timeline_events` after `0011_job_preparation_tasks`, then regenerate Prisma Client:

```bash
npm run db:generate
npm run db:deploy
```


## Career Pipeline Intelligence (Phase 26)

The route `/features/career-pipeline` and dashboard panel connect three existing sources of user-entered records:

- Job applications and their saved statuses.
- Job-linked timeline events, including interviews, deadlines and follow-ups.
- Job-specific preparation checklist tasks.

### API

`GET /api/intelligence/career-pipeline` requires authentication and returns:

- Application totals and counts by saved status.
- Active application count, defined as `saved`, `applied` and `interview`.
- Timeline totals, pending/completed counts and event counts by type.
- Upcoming and overdue pending event counts, plus up to eight upcoming and five overdue event previews.
- Preparation tasks completed/in progress/to-do and completion percentage based on user-marked task status.
- Up to eight recently updated applications and their per-job preparation completion counts.

### Method and limitations

All queries are scoped to the authenticated user. Application statuses are user-reported and not synchronized with employer systems. “Active” is a product grouping, not an externally verified state. Preparation completion is self-reported checklist progress, not skill mastery. Overdue means a pending event whose scheduled timestamp is earlier than the server's current time; completed and cancelled events are excluded. The API does not compute conversion rates, employer response rates, hiring probabilities, or job-search effectiveness. No email, push, calendar integration or background notifications are implemented. The recent application preview is capped at eight; timeline previews are capped at eight upcoming and five overdue events.
