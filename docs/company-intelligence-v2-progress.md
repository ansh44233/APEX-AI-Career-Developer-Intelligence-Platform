# Company Intelligence v2 — Implementation Notes

This document records the current state of the Company Intelligence workflow and the next implementation boundary. It supplements `company-intelligence-product-spec.md`.

## Implemented in the current iteration

- The Company Intelligence page carries selected company and role context into approved evidence, community reports, APEX practice and interview preparation.
- The role research brief groups approved claims into role requirements, hiring process, engineering culture, technology focus, products/services, and competitors/market. These keyword-matched groups are discovery aids, not a claim that a complete company profile exists.
- Official source registry links are labelled by purpose and explicitly disclose that automatic revalidation is not enabled.
- The curated Google, Microsoft and Amazon research URLs are registered in the same allow-listed source-capture registry as careers and interview sources. They can be inspected through the bounded capture flow and enter the existing human moderation queue; the static catalogue itself remains a manually curated summary, not a substitute for an approved capture or claim.
- The research profile panel checks approved captures for each catalogue source and distinguishes a manually curated source link from a moderator-approved snapshot. When a snapshot exists, it shows retrieval date and a shortened content hash; otherwise it explicitly says no approved snapshot is available yet. Snapshot status is fetched from the existing evidence endpoint and is not inferred from the catalogue check date. Approved snapshots are labelled recent (within 12 months), historical (older than 12 months), or freshness-unknown for invalid/future timestamps. The UI explains that capture age is not proof of current accuracy; it displays the latest approved capture per source.
- Registry tests ensure every curated research source resolves to the same company, URL and source identifier in the moderated capture registry, preventing source links from silently bypassing the capture allow-list.
- Approved source snapshots retain retrieval time, source URL, excerpt and SHA-256 content hash.
- Individually approved role claims retain their source snapshot and exact supporting passage.
- Employer-source snapshots and claims older than 12 months are visibly labelled historical in the Company Intelligence evidence panel. This is a conservative freshness warning, not a claim that the underlying page has changed.
- Community interview reports use the reported interview date—not submission date—to show freshness. Reports older than 90 days are marked potentially stale; reports with no interview date show freshness unknown; future interview dates are flagged for review.
- Selected cross-account integration tests use real PostgreSQL and actual route handlers, with only authenticated identity mocked. Coverage includes career goals, job applications, timeline events, practice sessions and attempts, roadmap tasks, job preparation, company preparation, guided practice plans, recommendation reads/actions, intelligence graph reads, and skill assessments.
- Selected moderator integration tests use real PostgreSQL and actual route handlers. They verify ordinary-user denial for moderator queues, prevent moderators from reviewing their own captures/claims/reports, and verify conflicting concurrent decisions cannot both succeed for the same source capture or interview report.
- These are focused security regression tests for selected routes and invariants, not exhaustive coverage of every API endpoint or every ownership path.
- CI validates the Prisma schema, applies all migrations to a clean PostgreSQL service, audits production dependencies, runs TypeScript and API tests, builds production assets and executes browser smoke tests. Workflow run #167 passed all checks, including the session endpoint privacy/cache assertions and Company Intelligence changes. The later approved-snapshot provenance UI change is pending its own CI run.
- Expired API rate-limit counters have a guarded manual cleanup script. It defaults to dry-run, requires an explicit environment-variable opt-in plus `--apply` to delete, and enforces a 48-hour minimum retention. CI verifies the dry-run against its temporary database; no production scheduler is configured.


- A first curated company-research catalogue is available for Google, Microsoft and Amazon. It attaches company-level product/platform claims to official company pages or an annual report, distinguishes those disclosures from APEX preparation interpretation, and explicitly leaves engineering-practice and competitor areas unestablished until appropriate evidence is reviewed. This is a limited starter catalogue, not a comprehensive or automatically refreshed market-intelligence dataset.

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
- A production scheduler for the guarded rate-limit cleanup command; cleanup remains an operator-run task and must not be exposed as a public endpoint.
- Reproducible committed npm lockfile and CI migration to `npm ci`.

## Next acceptance gates

1. Keep the full CI workflow green after each security and evidence change.
2. Configure an approved operational scheduler for rate-limit counter cleanup only after a deployment environment and its secret/permission model are defined.
3. Expand PostgreSQL integration tests to additional ownership-sensitive API routes and nested resources.
4. Implement source freshness metadata and safe refresh scheduling before presenting automated research as current.
5. Add company research only from permitted public sources and attach provenance to every external claim.
6. Build community trend views only when the dataset has enough approved, dated reports to justify aggregation; show sample size and time window.
7. Propagate company/role/source labels into OA Arena, Mock Interview and Career Command Center without converting weak evidence into certainty.
8. Define and test the deployment-specific retention schedule before enabling automated cleanup in a deployed environment.
