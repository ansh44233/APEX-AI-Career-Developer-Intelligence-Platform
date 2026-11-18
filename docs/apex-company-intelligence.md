# APEX Company-Specific Preparation Intelligence

## Purpose

The Company Intelligence page combines a selected illustrative company profile, a user-entered target role, and a pasted job description into a preparation brief.

## Current behaviour

- Company profiles are fixed examples for Google, Microsoft and Amazon.
- Users can enter a target role, paste a job description and add private research notes.
- The page detects terms from a built-in vocabulary of 23 skill categories using case-insensitive term-boundary matching.
- Detected terms are paired with deterministic preparation suggestions and links to APEX practice modules.
- The user can copy a brief containing the selected company, role, illustrative themes, detected terms and notes.

## Privacy

- Job description and research note values remain in client-side page state.
- The page does not submit them to an API or persist them to the user's account.
- The job description field is capped at 20,000 characters; research notes at 5,000 characters.
- Copying the brief explicitly writes the composed text to the user's clipboard.

## Limitations

- Company themes are illustrative static examples, not verified hiring practices or role requirements.
- No live vacancies, company career pages, interview loops or market data are fetched.
- Skill detection is limited phrase matching. It can miss synonyms and context, and detected terms do not verify proficiency.
- This feature does not generate an ATS score, hiring prediction or AI analysis.
- Users should verify all requirements against the official job listing and current company sources.

## Future direction

Potential future work includes official-source research with citations, user-reviewed requirement extraction, comparison against a selected career goal, and optional AI analysis with explicit consent and retention controls. These capabilities are not implemented here.

## Phase 17.1 — searchable company directory

The Company Intelligence page now includes a starter directory of 19 companies across three broad categories:

- Global technology: Google, Microsoft, Amazon, Meta, Apple, Netflix, NVIDIA, Adobe, Atlassian and Uber.
- Enterprise software: Salesforce, Oracle, IBM and Cisco.
- India technology: Tata Consultancy Services, Infosys, Wipro, Zoho and Accenture.

Each record includes a company-controlled careers portal and a short product/focus description. These links are navigation aids, not a live job feed; APEX does not currently fetch vacancies, guarantee that a listing is active, or verify hiring eligibility.

### Role preparation workspace

The page lets a candidate select a target role and experience band, then view an APEX-authored preparation blueprint. Available role tracks include software engineering, frontend, backend, full-stack, data, DevOps/platform, mobile, QA, security and product management.

The preparation blueprint is generic study guidance. It is not a representation of a company's actual interview loop, an interview-frequency statistic, a leaked question set or an employer endorsement.

Microsoft's official hiring guidance is linked separately at https://careers.microsoft.com/v2/global/en/hiring-tips. Other companies' pages in this initial release link to their official careers portals only; they do not imply an official interview guide exists.

### Job description analysis

- The user may paste up to 20,000 characters.
- Matching runs in the browser against a small built-in vocabulary.
- Detected terms link to APEX practice modules.
- No pasted job description or research note is submitted to an API or saved to the account by this page.
- Phrase matching is not semantic analysis. A term not detected is not proof that the candidate lacks the skill.

### Preparation plan export

The user can copy a plan containing the selected company, role, experience band, careers URL, generic preparation blueprint, locally detected terms and their own research notes.

### Provenance and future work

The next iteration should add role-specific source records rather than invent interview rounds:

1. Official employer guidance with canonical URL and last-checked timestamp.
2. Public job-description requirements attached to a specific job URL and retrieval date.
3. Community-reported interview experiences with source attribution, report date, role/level context and clear unverified labels.
4. APEX-authored practice questions kept distinct from external reports.
5. A freshness workflow to flag stale or unavailable links.

Never label a community report as official or leaked. Never claim question frequency without a transparent dataset, time window and sample size.

### Verification status

The directory data module, Company Intelligence page, dashboard description and README were committed to the default branch. Source-level checks were performed by fetching the updated files from GitHub. A local TypeScript check, production build, browser test and live link audit have not yet been run. No database, external API, AI provider or deployment is required for this browser-local phase.


The role selector now changes a separate APEX-authored practice track for each of the 11 role families. Company context and role-specific guidance are displayed in separate sections and both are labelled as preparation guidance rather than employer-confirmed interview requirements.


## Phase 17.2 — company-linked question practice

The question bank accepts optional `company` and `role` query parameters. Company Intelligence passes the selected company and role into the question bank, where the user can adjust both. The role selector applies an APEX-authored topic/category track, and the company selector supplies preparation context and an official careers link.

The question prompts remain the original APEX practice library. The company selector does not claim that a selected prompt was asked by that employer. No community reports, external question-frequency claims or verified company interview rounds are currently included.

The question bank retains its existing practice-answer save flow. Saving requires authentication and the configured practice database. The new company/role selectors are client-side and do not send job-description text or notes to an API.


## Phase 17.5 — evidence provenance and source trail

The company workspace now includes an evidence panel that separates three distinct information classes:

- **Employer-published destinations:** the selected company's official careers portal, plus an official interview-guidance destination only where the directory explicitly contains one (currently Microsoft). These are destination links; APEX does not claim that a link proves a vacancy is open, that its contents were fetched, or that the guidance applies to every role.
- **Community-reported experiences:** links to the approved-report library, clearly labelled as first-hand community submissions rather than employer statements. Approval is a moderation decision, not independent verification of every factual claim.
- **APEX-authored material:** the role-linked question bank and preparation blueprint, explicitly not represented as actual employer questions or a confirmed interview loop.

The source registry records the source kind, authority, scope and verification mode. `lastCheckedAt` is intentionally null because no automated or manual link-audit timestamp has been recorded. The UI therefore displays “last checked: not recorded” rather than inventing freshness. No live vacancy ingestion, source-page extraction, hiring-process change detection, interview-round inference, or question-frequency calculation is implemented.

This phase improves provenance and the company → role → source types → practice journey without fabricating employer evidence. A future source-ingestion phase should store canonical URL, retrieval timestamp, content hash, extracted claim, role applicability and review status, and should retain a visible stale/failed-fetch state.

### Verification status

The source registry and evidence panel are committed to the default branch and wired into Company Intelligence. This is source-level implementation only: no local typecheck/build, browser test, external link audit, database migration or deployment has been run.


## Phase 17.6 — bounded employer-source capture preview

Company Intelligence now offers an **Inspect page** action for registered employer sources. The authenticated `POST /api/company-intelligence/capture` endpoint accepts a source ID only; it never accepts an arbitrary URL. The server resolves that ID against the static company evidence registry, then performs a bounded HTML fetch.

### Capture controls

- Registered HTTPS employer sources only; no user-supplied destination URL.
- Redirects are not followed.
- 10-second request timeout and 1 MB response-body limit.
- HTML/XHTML content types only; non-HTML responses are rejected.
- Extracts a bounded page title, meta description and plain-text excerpt.
- Returns capture timestamp, HTTP status and SHA-256 hash of the fetched HTML.
- Requires an authenticated session; response is marked `unreviewed` and `persisted: false`.
- The user can copy the capture record for external review.

### Important boundaries

This is a preview, not a durable evidence store. Captures are not saved to PostgreSQL, compared against prior versions, indexed for search, or promoted into role requirements. The UI does not infer interview rounds or requirements from page text. The SHA-256 hash identifies the captured bytes; it does not prove the page is authentic, authoritative for a particular role, or unchanged since an independently trusted date. HTML extraction is intentionally lightweight and may omit content rendered by JavaScript.

The endpoint uses a source ID resolved only from the server-side registry, preventing arbitrary-URL fetches through this API. It does not follow redirects, which means some official sites may require opening their careers link directly. Authentication is required, but shared rate limiting and durable capture audit logs are not yet implemented.

### Next step

Add a durable source-capture record with canonical URL, retrieval timestamp, response metadata, content hash, extracted claims, role applicability, reviewer identity and review decision. Only approved, source-attributed claims should feed role preparation. Preserve the raw capture or a defensible content snapshot under an explicit retention policy before enabling change comparison.

### Verification status

The capture endpoint, registered-source lookup and Company Intelligence preview UI are committed. GitHub source files were fetched after the changes. No local TypeScript check, build, browser test, external source fetch test, database migration or deployment has been run.
