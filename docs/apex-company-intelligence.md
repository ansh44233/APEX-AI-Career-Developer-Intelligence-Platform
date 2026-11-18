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
