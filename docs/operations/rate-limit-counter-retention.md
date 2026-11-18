# API rate-limit counter retention

## Policy

The PostgreSQL-backed fixed-window limiter stores one row per user and bucket. Rows are updated when that user next uses the bucket, and old windows are reset atomically on the next request. A row whose `updated_at` is more than 48 hours old is therefore safe to remove: all current rate-limit windows are much shorter than that retention period, and a future request recreates or resets the row.

The cleanup command defaults to a **48-hour minimum retention**. It does not run automatically and no production scheduler is configured by this change.

## Dry run

Run from the repository root in an environment with the intended `DATABASE_URL` and generated Prisma Client:

```sh
npm run db:cleanup-rate-limits
```

This only counts matching rows and prints the cutoff. It does not modify the database.

## Explicit deletion

Only run after verifying that `DATABASE_URL` points to the intended environment and that the database backup/retention policy is satisfied.

Bash:

```sh
APEX_ALLOW_RATE_LIMIT_CLEANUP=1 npm run db:cleanup-rate-limits -- --apply
```

PowerShell:

```powershell
$env:APEX_ALLOW_RATE_LIMIT_CLEANUP = "1"
npm run db:cleanup-rate-limits -- --apply
Remove-Item Env:APEX_ALLOW_RATE_LIMIT_CLEANUP
```

The script refuses deletion unless both `--apply` and `APEX_ALLOW_RATE_LIMIT_CLEANUP=1` are present. The default is always a dry run. To retain rows longer, use `--retention-hours=72` (or another whole number of at least 48) before `--apply`.

## Scheduling

A deployment owner may schedule this command through the hosting platform's approved scheduler or a protected maintenance job after production database access, secret handling, observability, and backup expectations are configured. Do not add a public HTTP cleanup endpoint or a GitHub workflow that assumes production database credentials exist. Monitor the number of rows scanned/deleted and adjust retention only after reviewing the longest configured rate-limit window.
