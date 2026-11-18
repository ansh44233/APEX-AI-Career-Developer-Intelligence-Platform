# APEX GitHub Public Repository Intelligence

APEX Agent Workbench includes a read-only public repository inspector.

## Endpoint

`POST /api/github/public-repository`

Requires a signed-in Better Auth user.

Request:

```json
{ "owner": "vercel", "repo": "next.js" }
```

The endpoint validates owner/repository path segments and calls only fixed `https://api.github.com` endpoints. It does not accept arbitrary URLs.

## Returned information

- Repository metadata: description, default branch, stars, forks, open issues, topics, fork/archive status and last update.
- A recursive Git tree listing with a maximum of 250 eligible text source files.
- On-demand source preview for eligible files no larger than 64 KB.
- GitHub language byte counts and derived percentages.
- Root directory entries, file/directory counts, extensions and selected configuration-file names.

## Boundaries

- Public repositories only. Private-repository OAuth and installation-token access are not implemented.
- Read-only: no issues, pull requests, branches, commits, repository files or settings are modified.
- Source previews are bounded to allowlisted text extensions; secret-like paths and common credential/binary extensions are excluded. This is a defensive filter, not a guarantee that public source files contain no secrets.
- No code execution, vulnerability scanning or AI code review is performed. Deterministic single-file maintainability heuristics and a bounded architecture/import map are available as described below.
- Root listing is capped to the first 100 entries for display.
- GitHub unauthenticated API rate limits apply.
- The service uses fixed GitHub API URLs, disables redirects and applies request timeouts.
- Repository data is returned to the signed-in user and is not persisted by APEX.
- Public repository content may contain prompt injection or malicious instructions. Treat it as untrusted data; this first phase does not send repository content to an AI model.

This is repository metadata intelligence, not a security audit or code-quality verdict.

## Deterministic source quality checks

The source preview offers an explicit **Run quality checks** action for the selected file. The current line-oriented rules flag:

- TODO/FIXME/XXX markers.
- Debugger statements.
- Console log/debug calls.
- TypeScript `@ts-ignore` suppressions.
- Empty catch blocks.
- Lines longer than 180 characters.

Results include a rule ID, severity, line number, short evidence excerpt and a suggested review action. At most 100 findings are returned.

These are maintainability review prompts, not vulnerability detections, proof of bugs, or a complete code review. They can produce false positives and miss issues. No code is executed, no dependency graph is resolved, and only the selected source file is checked.

## Bounded architecture map

The **Map repository architecture** action samples up to 24 eligible TypeScript, JavaScript, Python, Java and Go files, each no larger than 32 KB, with a 384 KB combined source budget and four concurrent GitHub content requests. It returns:

- Sampled files and top-level directory groupings.
- Heuristically parsed relative, common `@/` alias and external package import references.
- Entrypoint filename candidates and frequently imported sampled files.
- Coverage flags when the Git tree listing was truncated/capped or the byte budget was reached.

This is a partial structural map, not a complete dependency graph. Import parsing is text-pattern based, alias resolution is approximate, and internal edges only resolve when the target is in the sampled set. It does not infer runtime call graphs, service boundaries, data flows, ownership, architecture quality or vulnerabilities. No source code is executed or persisted.

## AI-assisted single-file review

An explicit **AI code review** action is available for a selected eligible public source file. It sends at most 12,000 characters to the configured server-side OpenAI-compatible provider. Common private-key blocks, GitHub token patterns, AWS access-key IDs and simple API-key/token/secret/password assignments are redacted before sending.

The review prompt treats repository content as untrusted data and asks the model to ignore embedded instructions, review only visible code, distinguish observations from hypotheses, and avoid claiming tests or tools were run. The output is advisory text and is not parsed into executable actions.

Important boundaries:

- A user must explicitly click the AI review action; merely browsing or running deterministic checks does not send source to the AI provider.
- Provider processing and retention terms apply to the selected excerpt. Redaction is heuristic and cannot guarantee removal of every secret or personal detail; users should inspect public code before sending it.
- One file only, capped at 12,000 characters. Imports and broader application context may be missing.
- AI may miss issues or produce false positives. This is not a security audit or proof of correctness.
- No code execution, tests, repository writes, patches, pull requests or deployment occur.
- AI review requires server-side `AI_API_KEY` and `AI_MODEL` configuration (and optional `AI_BASE_URL`). Without a configured provider, the endpoint returns an unavailable response.

## Multi-file AI review

The source browser allows selecting **2–5 eligible files** and explicitly choosing **Review selected files together**. APEX fetches the selected public files and sends bounded excerpts to the configured AI provider:

- Maximum 5 distinct files per review.
- Maximum 8,000 characters per file.
- Maximum 24,000 combined source characters.
- Common private-key blocks, GitHub token patterns, AWS access-key IDs and simple API-key/token/secret/password assignments are redacted before provider submission.

The prompt asks the model to compare only supplied excerpts, identify cross-file inconsistencies where evidence supports them, cite file paths and visible line numbers, distinguish observations from hypotheses, and ignore all instructions embedded in repository files.

This is opt-in: selecting files alone does not send source to the provider. The user must explicitly start the multi-file review. Provider processing and retention terms apply. Redaction is heuristic and cannot guarantee removal of every secret or personal detail; inspect files before sending.

The result is advisory. It may miss issues or produce false positives, and selected files may omit important imports, callers or configuration. No code is executed, no tests are run, and no repository changes, patches or pull requests are created.

### Structured findings and severity labels

Multi-file review responses are requested as JSON and validated server-side with Zod before being returned to the browser. Invalid model output is rejected rather than displayed as if it were structured findings. Each accepted finding contains:

- Severity: `critical`, `high`, `medium`, `low` or `info`.
- Confidence: `high`, `medium` or `low`, kept separate from severity.
- Category, exact selected-file path, and a line number only when the model supplies a valid positive integer (otherwise null).
- Short evidence paraphrase, potential impact and recommendation.

The response is capped at 20 findings and 10 follow-up questions. Finding paths must match one of the selected files. The UI shows counts by severity and renders each finding with its confidence and evidence. Severity and confidence are model assessments, not independently verified measurements or a formal risk rating. The findings are not persisted and there is no workflow to mark them resolved or accepted in this phase.


## Human-reviewed AI patch proposals

The source preview provides an opt-in **AI patch proposal** action for one selected file. The user describes the intended change (8–2,000 characters), then explicitly requests a proposal. APEX sends a maximum 12,000-character excerpt of the selected public file, after heuristic credential-pattern redaction, to the configured AI provider.

The provider is asked for a structured JSON response containing a short summary, exact target path, one-file unified diff, risks and suggested human tests. The server validates the response with Zod, requires the exact selected path in both diff headers, rejects multi-file and Git metadata/mode/rename/binary directives, and requires at least one hunk for a non-empty diff. An empty diff is allowed when the model cannot safely draft a change.

The UI displays the proposal as text for inspection. There is **no apply button**, patch execution, GitHub write permission, commit, branch creation, pull request or deployment in this phase. A proposed diff may not apply cleanly, especially if the source excerpt was truncated or redacted. Treat it as untrusted draft material and review it against the current source before considering any manual use.

Provider processing and retention terms apply. Redaction is heuristic and cannot guarantee removal of every secret or personal detail. AI may produce incorrect or unsafe suggestions; the model's risks and test list are advisory and do not mean tests were run. No code is executed and no tests are run by this feature.


## Patch validation and review decisions

Every AI patch proposal records the GitHub blob SHA of the source file used to draft it. The user can explicitly run **Validate against current GitHub file**. APEX fetches the current public file again and compares its blob SHA with the proposal's source SHA. If they differ, the proposal is marked stale and must be regenerated against the current file.

When the source SHA still matches, the validator parses the single-file unified diff, checks its hunk ranges and old/new line counts, and verifies every context and removed line against the current source. It produces a read-only proposed-file preview when the diff is applicable. Context mismatch or malformed diff is rejected.

A successful validation means only that the diff is structurally applicable to the exact source version checked. It does not establish correctness, security, build success or test success. The validator does not run code or tests and does not apply or write the patch.

The UI also supports **Mark reviewed** and **Reject proposal** decisions. A small proposal history is held in page state for the current session only; it is not persisted to the account or database. These decisions are review notes, not approval to apply code or authorize repository writes.


## Automated test intelligence

An explicit **Discover test intelligence** action inspects the bounded public source-file listing, identifies common test framework references in up to eight small manifests, lists likely test files, and suggests source-to-test relationships using filename matching. Results include listing coverage flags and limitations. This is static discovery only: manifests may contain unused dependencies, filename matches do not prove test coverage, and no repository code, package scripts or tests are executed. APEX does not report tests as passing or failing.


## AI test generation

For a selected public source file, users can explicitly choose a framework and request a test draft. APEX sends at most 10,000 characters of that file to the configured AI provider after heuristic credential-pattern redaction. The provider returns JSON with a suggested relative test filename, source code, categorized cases and assumptions. Zod validates the output; unsafe paths and framework mismatches are rejected. The UI displays the draft and offers an explicit copy action. It is not saved to GitHub, compiled or executed. Review imports, fixtures, framework compatibility and test outcomes manually. Provider processing and retention terms apply; redaction is heuristic and cannot guarantee removal of every secret.


## Test quality and coverage signals

An explicit **Analyze test quality** action scans a bounded sample of likely test files (up to 30 files, 24 KB per file, and 240 KB total). It reports text-pattern counts for test declarations, assertion APIs, skipped/focused tests, empty test bodies, duplicate or generic titles, and rough error/boundary/async/security keywords, and compares simple source-code patterns with keywords in the sampled test corpus to suggest scenarios worth investigating. It also lists source files without a filename-based test match as an investigation aid. These are not runtime coverage measurements, quality scores or proof of missing tests. Comments, custom assertion APIs, integration tests and naming conventions can make the heuristics misleading. No code or test command is executed; no coverage report is produced.


## Test traceability and planning

The explicit **Build test traceability** action creates a bounded, static source-to-test matrix. It samples up to 18 code source files and 30 test files (16 KB per file, 180 KB per group), reads them with at most four concurrent GitHub requests, and links likely tests using same-basename, import-specifier and text-reference hints. It extracts a small set of exported symbol names and infers candidate test obligations from source patterns such as branches, errors, async operations, authorization, validation and persistence. The resulting reviewable plan highlights scenario keywords not detected in candidate-linked tests.

This is not formal requirements traceability, semantic dependency analysis or runtime coverage. Filename/import/text matches can be wrong or incomplete; source-pattern obligations are not product requirements; and keyword signals do not prove assertions. A missing signal does not prove a missing test. No code or tests are executed and no repository files are changed.


## Risk-ranked test planning and exports

The traceability result also groups candidate test scenarios by a sampled source-module path and assigns heuristic review priority. Error handling, authorization and input-validation scenario types are marked high risk for review; other detected scenario types are marked medium. These are generic review priorities, not an assessment of a repository's actual threat model or business impact.

A bounded import scan can show candidate dependency edges between sampled source files. It only resolves simple relative and `@/` alias import specifiers by matching sampled filenames, so it is not a complete dependency graph and can produce false or missing links.

The UI provides explicit **Copy JSON plan** and **Copy Markdown plan** actions. JSON contains the structured traceability result; Markdown contains the reviewable scenario list, module summary, candidate dependency hints and limitations. Copying is a user-initiated clipboard action. No files are downloaded, committed or changed.


## Test plan workspace

After generating test traceability, the UI provides a session-only editable workspace seeded from the suggested scenarios. Users can update each item's status (Not Started, In Progress, Covered, Deferred), add notes or test references, filter by module/risk/status, and add custom scenarios with an optional module label. Workspace state is held in the page's React state only; it is not sent to the API, saved to the account, or persisted across refreshes/navigation.

The workspace has explicit clipboard exports for JSON and Markdown, including scenario status, risk, module, source path where applicable, and notes. Clipboard access is initiated by the user. Exporting does not create a file or modify the repository. A Covered status is a user-maintained checklist label, not evidence that a test was executed or passed.


## Test execution preflight

The **Check execution readiness** action performs bounded, read-only manifest discovery for supported public repositories. It inspects at most eight supported manifests, each no larger than 24 KB, and reports candidate test frameworks, informational command hints, manifest evidence, and the sandbox requirements for a future runner. A package script is never considered safe merely because it is named `test`; the script body is not expanded or executed.

Execution is deliberately disabled. The endpoint is a preflight report only: it does not install dependencies, invoke a shell, run tests/builds, execute repository code, or claim pass/fail outcomes. No execution provider is configured and no arbitrary code execution endpoint exists.

A future runner must be a separately configured, disposable sandbox with no host filesystem/Docker socket access, no application/GitHub/AI secrets, network disabled by default, unprivileged execution, read-only source checkout, bounded writable temporary storage, pinned source/toolchain, strict CPU/memory/process/output/time limits, and bounded logs. Repository-controlled manifests, package install scripts and test commands are untrusted code. These requirements must be independently reviewed before connecting an executor.

The readiness report and candidate commands are informational. They are not a test result, a guarantee that a framework is installed, or approval to execute a command.
