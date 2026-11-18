# APEX Interview Experience Intelligence

## Phase 17.3 — moderated first-hand reports

APEX now has a dedicated interview experience page at /features/interview-experiences and an API at /api/interview-experiences.

### Data model

The Prisma model InterviewExperienceReport stores company, target role, experience level, round type, difficulty, approximate interview date, question/topic recollection, optional context, optional HTTPS source URL, submission status, review timestamp, submitter relation and timestamps.

Migration: prisma/migrations/0005_interview_experience_reports/migration.sql.

### Submission and publication

- POST /api/interview-experiences requires authentication.
- Strict Zod validation limits fields and accepted enum values.
- Contributors must affirm first-hand experience and permission to share.
- Reports are created with pending status.
- Public GET /api/interview-experiences returns only approved reports, supports company/role/round filters and caps results at 100.
- Public responses never expose submitter identity or user ID.
- No endpoint lets a normal user approve, reject or edit another person's report.

The UI warns against submitting confidential interview material, NDA-covered content, personal data or recruiter contact details. Community reports remain separate from official company resources and APEX-authored questions.

### Moderation limitation

This phase intentionally has no self-service moderation dashboard or public approval endpoint. Pending reports remain invisible. A trusted, authenticated moderator workflow and operational abuse controls must be implemented before opening submissions broadly.

The current API does not include rate limiting, spam scoring, duplicate detection or automated content review. Deploying this feature to an open public audience without those controls is not recommended.

### Storage and rollout

Apply the new migration before using the API:

    npx prisma migrate deploy
    npx prisma generate

The repository change does not apply migrations to any live database. Until the migration is applied, API storage calls will return a safe 503 response.

### Verification status

Repository files were fetched after commits for source-level inspection. No Prisma generation, typecheck, build, database migration, API integration test or browser test has been run. No deployment has occurred.
