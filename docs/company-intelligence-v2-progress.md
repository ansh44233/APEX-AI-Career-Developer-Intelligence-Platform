# Company Intelligence v2 — Implementation Notes

This document records the current state of the Company Intelligence workflow and the next implementation boundary. It supplements `company-intelligence-product-spec.md`.

## Implemented in the current iteration

- The Company Intelligence page carries selected company and role context into approved evidence, community reports, APEX practice and interview preparation.
- The role research brief groups approved claims into role requirements, hiring process, engineering culture, technology focus, products/services, and competitors/market. These keyword-matched groups are discovery aids, not a claim that a complete company profile exists.
- Official source registry links are labelled by purpose and explicitly disclose that automatic revalidation is not enabled.
- Approved source snapshots retain retrieval time, source URL, excerpt and SHA-256 content hash.
- Individually approved role claims retain their source snapshot and exact supporting passage.
- Employer-source snapshots and claims older than 12 months are visibly labelled historical in the Company Intelligence evidence panel. This is a conservative freshness warning, not a claim that the underlying page has changed.
- Community interview reports use the reported interview date—not submission date—to show freshness. Reports older than 90 days are marked potentially stale; reports with no interview date show freshness unknown; future interview dates are flagged for review.
- Selected cross-account integration tests use real PostgreSQL and actual route handlers, with only authenticated identity mocked. Coverage includes career goals, job applications, timeline events, practice sessions and attempts, roadmap tasks, job preparation, company preparation, guided practice plans, recommendation reads/actions, intelligence graph reads, and skill assessments.
- Selected moderator integration tests use real PostgreSQL and actual route handlers. They verify ordinary-user denial for moderator queues, prevent moderators from reviewing their own captures/claims/reports, and verify conflicting concurrent decisions cannot both succeed for the same source capture or interview report.
- These are focused security regression tests for selected routes and invariants, not exhaustive coverage of every API endpoint or every ownership path.
- CI validates the Prisma schema, applies all migrations to a clean PostgreSQL service, runs TypeScript and API tests, builds production assets and executes browser smoke tests. The latest workflow run covering the moderation invariants completed successfully.

## Evidence interpretation

- Official source snapshots are evidence of what was captured at a URL and time. A capture hash identifies the captured content; it does not prove authenticity or current accuracy.
- Moderator approval is an inclusion decision, not a guarantee that every claim is semantically correct or applies to every requisition.
- Community reports are self-reported experiences. A date warning helps communicate age but does not establish statistical representativeness.
- APEX preparation blueprints and prompts remain original APEX material, not actual employer questions.
- Missing publication dates, missing interview dates, and unavailable sources must remain unknown rather than be replaced with guessed dates.

## Still not implemented

- Automated source refresh, change detection and freshness scheduling.
- Comprehensive company-specific product/competitor/technology-stack research with independently sourced citations and structured provenance for each claim. Current research-area grouping only organizes already-approved claims; it does not populate missing facts.
- Aggregated community trend statistics with transparent sample sizes, query windows and deduplication.
- AI-generated company briefs or role-specific extraction. No AI provider is configured as a live Company Intelligence dependency.
- A complete, structured role brief for each individual job requisition.
- Exhaustive DB-backed cross-account integration coverage for every API route and nested resource. Current tests cover selected high-risk paths and should be expanded as new routes/resources are added.
- Automated retention/cleanup for expired API rate-limit counter rows; the limiter currently retains one counter row per user and bucket.
- Reproducible committed npm lockfile and CI migration to `npm ci`.

## Next acceptance gates

1. Keep the full CI workflow green after each security and evidence change.
2. Expand PostgreSQL integration tests to additional ownership-sensitive API routes and nested resources.
3. Implement source freshness metadata and safe refresh scheduling before presenting automated research as current.
4. Add company research only from permitted public sources and attach provenance to every external claim.
5. Build community trend views only when the dataset has enough approved, dated reports to justify aggregation; show sample size and time window.
6. Propagate company/role/source labels into OA Arena, Mock Interview and Career Command Center without converting weak evidence into certainty.
7. Define an operational retention policy and scheduler for expired rate-limit counters before enabling automated cleanup in a deployed environment.
