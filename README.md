# APEX

### AI Career & Developer Intelligence Platform

APEX is an early-stage career preparation platform bringing interview practice, coding assessments, company research, resume review and developer workflows into one connected workspace.

## Product experiences

- **Interview Lab** — technical and behavioural interview practice prototype.
- **OA Arena** — coding assessment practice prototype.
- **Company Intelligence** — company and role research workspace prototype.
- **Resume Intelligence** — local resume and job-description keyword comparison prototype.
- **System Design Studio** — architecture practice workspace prototype.
- **Career Readiness Engine** — self-reported skill assessment prototype.

These are frontend experiences, not yet connected to AI grading or persistent user accounts. Sample and self-entered scores are not hiring predictions.

## Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Tailwind CSS
- PostgreSQL data model with Prisma 6
- Next.js Route Handlers for the API

## Local setup

Requirements: Node.js 20 or newer and a PostgreSQL database.

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file based on `.env.example` and set `DATABASE_URL` to your own PostgreSQL connection string. Never commit real credentials.

3. Generate the Prisma client:

```bash
npm run db:generate
```

4. Apply the development migration after reviewing the schema:

```bash
npm run db:migrate
```

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
npm run typecheck
npm run build
npm run db:generate
npm run db:migrate
npm run db:deploy
```

Use `db:migrate` for local development and `db:deploy` to apply already-created migrations in a deployment environment.

## API status

- `GET /api/health` — reports the web/API process and configured service status.
- `GET /api/ready` — performs a database connectivity check and returns HTTP 503 if the database is not configured or unavailable.

The Prisma client is server-only. Do not import it into client components.

## Current implementation status

- Responsive marketing site and sample dashboard.
- Six interactive feature prototypes.
- Initial PostgreSQL SQL migration and Prisma data models.
- Server-side Prisma client singleton.
- Health and database readiness endpoints.
- Backend architecture and data-model documentation.

## Not connected yet

- Live PostgreSQL database and deployed credentials.
- Authentication provider, registration, login and session lifecycle.
- User-owned persistent practice APIs.
- AI provider, model evaluations and usage controls.
- Private resume file storage and background processing.
- Automated build, typecheck and integration-test verification.

## Security principles

- Authenticate requests on the server and authorize every user-owned record.
- Keep database and AI credentials server-side; never use a `NEXT_PUBLIC_` prefix for secrets.
- Validate untrusted input and cap request sizes.
- Avoid logging private resume text, practice answers, tokens or provider keys.
- Add retention, export and deletion controls before collecting sensitive user content.

## License

License to be decided.
