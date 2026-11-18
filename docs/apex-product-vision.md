# APEX Product Vision

## North star

APEX is a web-first interview preparation and career intelligence platform. It takes inspiration from the breadth and composable interview workflows demonstrated by Cracked, while building an original product, interface, data model and learning experience. It must not copy another project's branding, source code, proprietary content or unlicensed datasets.

The goal is not a static question directory. A candidate should be able to discover what to prepare, practise under realistic conditions, receive evidence-based feedback, track progress and decide what to do next—all in one connected workspace.

## Product pillars

### 1. Candidate profile and preparation memory
- Target roles, experience level, skills, preferred programming language and target companies.
- A user-controlled practice journal, scorecards, saved stories and preparation plan.
- Session history that can inform future recommendations without inventing skill or performance claims.

### 2. Company and role intelligence
- Company search and role/level-specific preparation hubs.
- Publicly sourced hiring process information, official company values and role requirements.
- Community-reported question trends with source, time window, sample context and freshness labels.
- Clear separation between official company material, community reports, APEX-authored practice questions and unverified hypotheses.
- Never label community-reported questions as official or leaked.

### 3. Interview practice
- DSA mock interviews with clarification, hints, approach, coding, testing and follow-up stages.
- Timed online assessment simulations and transparent grading when code execution is available.
- Pattern coaching, CS fundamentals and SQL practice.
- System design (HLD/LLD), behavioural/HR and project-defense rounds.
- Session scorecards with specific evidence, strengths, improvement points and next drills.

### 4. Getting shortlisted
- Resume review and role-specific resume blueprint.
- Resume-to-job-description matching with explainable evidence.
- GitHub profile and public repository review.
- Project improvement plans and project-defense preparation.
- Professional outreach/referral message drafting.

### 5. Career strategy
- Adaptive week-by-week preparation plans.
- Rejection debriefs that convert candidate-provided feedback into next steps.
- Offer comparison and compensation education with transparent assumptions.
- Readiness and skill coverage that distinguish self-reported ratings from measured outcomes.

## Current foundation

The repository already contains:
- Authentication and user-scoped practice APIs.
- Career goals, practice sessions, skill assessments, progress analytics and deterministic recommendations.
- Interview Lab, OA Arena, System Design Studio, Project Defense, Resume Intelligence, Company Intelligence and Offer Intelligence.
- Agent Workbench and public GitHub repository intelligence, including bounded source inspection, advisory reviews, patch proposals and static test-planning tools.
- A searchable APEX-authored Interview Question Bank with hints, evaluation checklists, follow-ups and saved written practice attempts.

Many modules are still prototypes or deterministic previews. PostgreSQL, AI provider configuration, end-to-end verification and production deployment remain outstanding.

## Build roadmap

### Priority A — Make the core interview loop real
1. Company and role intelligence with source provenance and freshness.
2. Expand question bank across DSA, language/runtime, frontend, backend, databases, OS, networking, system design, HR and project interviews.
3. Structured mock interview flows and evidence-based scorecards.
4. Coding/OA runner using a separately reviewed isolated execution provider.
5. Candidate profile, practice journal and adaptive preparation plan.

### Priority B — Improve shortlisting outcomes
1. Resume review and job description gap analysis with clear evidence.
2. Company-specific resume preparation.
3. GitHub and project review connected to interview practice.
4. Behavioural story bank and project-defense question generation.

### Priority C — Differentiation
1. Explainable question provenance: source type, date, role/level, frequency window and confidence.
2. Cross-module learning graph connecting interview answers, coding attempts, project evidence and skill assessments.
3. Personalised practice queues based on observed attempts and user-confirmed goals.
4. Interview replay and rubric-based review of reasoning, testing and communication.
5. Company/role comparison that explains evidence gaps rather than generating unsupported rankings.

## Product quality rules

- Source every external hiring claim and show when it was checked.
- Label community-reported material as community-reported, never official or leaked.
- Do not fabricate company interview rounds, question frequency, salary benchmarks, ATS scores, candidate metrics or test results.
- Distinguish AI suggestions, deterministic heuristics, user self-reports and independently verified facts.
- Treat candidate data as private; provide clear controls for saving and deleting it.
- Do not execute repository code in the application server. Any future runner must be isolated, disposable, resource-limited and secret-free.
- Every feature should have a useful empty state, loading/error handling, keyboard-accessible controls and clear data provenance.
- Do not call the product production-ready until build, typecheck, integration, security and deployment checks are completed.

## Reference

Cracked is a public reference for a broad, composable set of candidate workflows, including company intelligence, mock interviews, OAs, pattern coaching, CS fundamentals, system design, HR, resume/GitHub/project work and preparation strategy. APEX uses this as a capability benchmark only; the implementation and user experience remain original.
