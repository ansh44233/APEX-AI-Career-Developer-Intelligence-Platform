# APEX Skills Registry API

The registry exposes the five published APEX Agent Skills as read-only metadata and Markdown instructions.

## Endpoints

### `GET /api/skills`

Returns registry metadata and the published skill list.

Example response shape:

```json
{
  "name": "APEX Skills Registry",
  "version": "1.0.0",
  "format": "agent-skills",
  "specification": "https://agentskills.io/specification",
  "count": 5,
  "skills": [
    {
      "slug": "interview-prep",
      "name": "Interview Prep",
      "description": "Prepare for technical and behavioural interviews with structured practice and honest feedback.",
      "version": "1.0.0",
      "category": "career-coaching",
      "capabilities": ["mock-interview", "answer-feedback", "practice-planning"]
    }
  ],
  "limitations": []
}
```

The example shows the response shape; the live response contains all currently registered skills and the full limitations list.

### `GET /api/skills/{slug}`

Returns metadata and the Markdown source for one allowlisted skill.

Supported slugs:
- `interview-prep`
- `coding-practice`
- `system-design`
- `project-review`
- `resume-coach`

Unknown slugs return `404`. If a registered file cannot be read, the endpoint returns `503`. The slug is validated against the registry before constructing the file path; arbitrary paths are not accepted.

## Integration example

A compatible client can:
1. Fetch `/api/skills` to discover published skill metadata.
2. Select a skill by its registered slug.
3. Fetch `/api/skills/{slug}` to retrieve its `SKILL.md` text.
4. Apply the instructions according to that client's own Agent Skills support and user permissions.

The API does not provide an agent runtime, model inference, tool execution, repository access, code execution, OAuth integration, or persistent execution logs.

## Operational and security notes

- Both endpoints are public read-only distribution endpoints.
- Responses use short public cache headers.
- Detail retrieval is limited to slugs in the server-side registry.
- The detail route reads only the registered `skills/{slug}/SKILL.md` file.
- No user-supplied prompt is executed and no user content is stored.
- Do not add private or secret material to published skill files.

## Versioning

Each skill currently declares version `1.0.0` in the registry. Update the version when its public instruction contract changes. The registry version describes the registry response contract, not an AI model version.
