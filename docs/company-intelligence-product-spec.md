# APEX Company Intelligence — Product Specification

## Purpose

Turn Company Intelligence from a static directory into a source-grounded preparation brief that feeds the rest of APEX. The feature must help a candidate understand a target employer, role, hiring process, and preparation priorities without presenting uncertain information as fact.

## Core workflow

1. Select a company, target role, and experience level.
2. Load the latest available company brief, or show that no researched brief exists.
3. Build or refresh a brief from permitted public sources and APEX's approved evidence store.
4. Review each claim with its source, publication/observation date, source class, and confidence.
5. Convert relevant findings into a role-specific preparation plan.
6. Carry company and role context into Question Bank, OA Arena, Mock Interview, Resume Intelligence, System Design, and Career Command Center.
7. Track preparation activity and update priorities from completed practice.

## Brief sections

- Company overview: products, markets, engineering domains, and official careers entry points.
- Role and level context: responsibilities and skill expectations from the specific job description when supplied.
- Hiring process: rounds, format, duration, and assessment areas, only when supported by dated sources.
- Coding and OA trends: community-reported questions/topics with dataset name, dataset update date, query window, and explicit community-reported label.
- Technical focus: role-appropriate DSA, CS fundamentals, system design, debugging, and project discussion.
- Values and behavioural themes: official company-published values separated from candidate-reported interview themes.
- Resume screen: role-specific requirements grounded in official job descriptions, not speculative recruiter preferences.
- Gotchas and open questions: conflicting reports, low-confidence claims, and details to verify with a recruiter.

## Evidence and provenance rules

Every displayed finding must be one of:
- **Official** — directly supported by a company-controlled page or document.
- **Community-reported** — attributed to a named public community source or dataset; never described as official, leaked, guaranteed, or exhaustive.
- **APEX analysis** — an inference or preparation recommendation authored by APEX and visibly labelled as such.

Store the source URL, source title, source type, observed/published date when available, retrieval date, and a short supporting excerpt or content hash. Show stale-data warnings. Preserve conflicting reports instead of silently selecting one. Do not fabricate interview loops, OA formats, question frequency, values, salary ranges, or resume thresholds.

## Data and safety boundaries

- Prefer official public company sources and approved public community sources.
- Do not bypass access controls, paywalls, robots restrictions, or rate limits.
- Avoid collecting personal or sensitive information about employees/interviewers.
- Do not scrape private communities or store personal identifiers from candidate reports.
- Keep user-provided job descriptions and private notes under existing privacy boundaries.
- Treat third-party skill packs and datasets as references for product requirements, not code or content to copy wholesale; review licenses before using any dataset or implementation.

## Freshness policy

- Display last researched date and source dates.
- Mark company-process reports older than 12 months as historical unless reaffirmed by a newer source.
- Mark community datasets older than 90 days as potentially stale.
- A brief with no current evidence must say so and fall back to clearly labelled general role guidance.

## Integration contract

Company Intelligence should provide a stable company + role context object to downstream modules. Each downstream module must preserve source labels:
- Question Bank: keep APEX-authored prompts separate from community-reported prompts.
- OA Arena: use reported topic/difficulty mix only when provenance and freshness are available.
- Mock Interview: use company context to select focus areas, not to claim a guaranteed interview script.
- Resume Intelligence: compare supplied resume/JD vocabulary against official role requirements; do not invent ATS scores.
- System Design: distinguish company-relevant public engineering context from generic architecture practice.
- Career Command Center: convert evidence-backed gaps into trackable preparation actions.

## Delivery phases

### CI and account security foundation
- Complete authentication lifecycle E2E coverage.
- Add cross-user ownership tests for core account data.
- Commit a reproducible package lock and move CI to `npm ci`.
- Add public auth abuse controls, rate-limit retention, and production operations checks.

### Company Intelligence v2
- Define typed company brief and source schemas.
- Add brief freshness and provenance UI.
- Add company/role-specific public source research and moderation/review workflow.
- Add community-reported question trends only after dataset license, provenance, freshness, and update mechanism are reviewed.
- Add company context integration to downstream practice modules.

### Career intelligence loop
- Connect job applications, evidence, preparation tasks, practice outcomes, skill gaps, and recommendations.
- Explain why each recommendation exists and which evidence supports it.
- Keep user confirmation for consequential actions and external integrations.

## Acceptance criteria

- No unsupported company interview claims appear as facts.
- Every non-APEX company claim links to its source and shows provenance.
- Stale and conflicting evidence is visible.
- Company + role selection survives navigation into supported preparation modules.
- Practice outcomes can inform next-step recommendations without presenting self-ratings as objective hiring predictions.
- Unit, API security, and browser tests cover the end-to-end workflow.
