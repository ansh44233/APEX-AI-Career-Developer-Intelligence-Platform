# Company Intelligence v2 — Implementation Notes

This document records the current state of the Company Intelligence workflow and the next implementation boundary. It supplements `company-intelligence-product-spec.md`.

## Implemented in the current iteration

- The Company Intelligence page carries selected company and role context into approved evidence, community reports, APEX practice and interview preparation.
- Approved source snapshots retain retrieval time, source URL, excerpt and SHA-256 content hash.
- Individually approved role claims retain their source snapshot and exact supporting passage.
- Employer-source snapshots and claims older than 12 months are visibly labelled historical in the Company Intelligence evidence panel. This is a conservative freshness warning, not a claim that the underlying page has changed.
- Community interview reports use the reported interview date—not submission date—to show freshness. Reports older than 90 days are marked potentially stale; reports with no interview date show freshness unknown; future interview dates are flagged for review.
- Job application and timeline-event owner-isolation tests cover unauthorised cross-user update/delete attempts and unauthenticated access.
- CI validates the Prisma schema, applies all migrations to a clean PostgreSQL service, runs TypeScript and API tests, builds production assets and executes browser smoke tests.

## Evidence interpretation

- Official source snapshots are evidence of what was captured at a URL and time. A capture hash identifies the captured content; it does not prove authenticity or current accuracy.
- Moderator approval is an inclusion decision, not a guarantee that every claim is semantically correct or applies to every requisition.
- Community reports are self-reported experiences. A date warning helps communicate age but does not establish statistical representativeness.
- APEX preparation blueprints and prompts remain original APEX material, not actual employer questions.
- Missing publication dates, missing interview dates, and unavailable sources must remain unknown rather than be replaced with guessed dates.

## Still not implemented

- Automated source refresh, change detection and freshness scheduling.
- Company-specific product/competitor/technology-stack research with citations for each claim.
- Aggregated community trend statistics with transparent sample sizes, query windows and deduplication.
- AI-generated company briefs or role-specific extraction. No AI provider is configured as a live Company Intelligence dependency.
- A complete, structured role brief for each individual job requisition.
- Full DB-backed cross-account integration tests; current ownership tests use mocked owner-scoped Prisma lookups.
- Reproducible committed npm lockfile and CI migration to `npm ci`.

## Next acceptance gates

1. Keep the full CI workflow green after each security and evidence change.
2. Add integration tests against PostgreSQL for cross-user ownership and moderator review invariants.
3. Implement source freshness metadata and safe refresh scheduling before presenting automated research as current.
4. Add company research only from permitted public sources and attach provenance to every external claim.
5. Build community trend views only when the dataset has enough approved, dated reports to justify aggregation; show sample size and time window.
6. Propagate company/role/source labels into OA Arena, Mock Interview and Career Command Center without converting weak evidence into certainty.
