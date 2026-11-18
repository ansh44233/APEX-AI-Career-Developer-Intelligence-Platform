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
- No code execution, static analysis, vulnerability scanning or AI code review is performed.
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
