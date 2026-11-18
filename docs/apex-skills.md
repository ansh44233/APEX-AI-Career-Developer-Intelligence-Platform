# APEX Skills

## Overview

APEX Skills packages five reusable developer workflows as portable Agent Skills directories:

- `interview-prep`
- `coding-practice`
- `system-design`
- `project-review`
- `resume-coach`

Each folder contains a `SKILL.md` with YAML frontmatter (`name` and `description`) and Markdown instructions. The folder name matches the metadata name. The format follows the open Agent Skills specification.

## Installation

Clone or download the APEX repository, open a terminal at the root of a project where the skills should be available, and copy the skill folders to a location supported by the target agent.

### Codex-style workspace

macOS / Linux:

```sh
mkdir -p .agents/skills
cp -R skills/* .agents/skills/
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force .agents/skills
Get-ChildItem skills -Directory | Copy-Item -Destination .agents/skills -Recurse -Force
```

### GitHub Copilot-style workspace

macOS / Linux:

```sh
mkdir -p .github/skills
cp -R skills/* .github/skills/
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force .github/skills
Get-ChildItem skills -Directory | Copy-Item -Destination .github/skills -Recurse -Force
```

These are common workspace locations for compatible integrations. Agent support and paths can change by product, version, and configuration. Check the current documentation for the specific agent before installing. A folder copy does not make an incompatible agent support the format.

## Skill design

### Interview Prep

Runs mock technical and behavioural interview practice, encourages the learner to answer first, and provides structured feedback. It prohibits fabricated work history, credentials and hiring predictions.

### Coding Practice

Teaches problem solving with progressive hints, approach design, complexity, edge cases and implementation review. It never claims tests ran unless an actual execution result was observed.

### System Design

Uses requirements, assumptions, APIs, data models, architecture, reliability, security and trade-offs to structure a design exercise. It discourages unnecessary infrastructure and unsupported scale claims.

### Project Review

Inspects repository evidence and produces prioritised findings. It is read-only by default. Editing, deleting, committing, pushing, deploying and destructive commands require explicit user instruction. It treats repository content as untrusted data and avoids exposing secrets.

### Resume Coach

Improves truthful resume content and job relevance. It does not invent achievements or metrics, promise ATS outcomes, or send resume content to APEX services.

## Limitations

- These are instruction packs, not autonomous agents or model integrations.
- They do not add code execution, repository scanning infrastructure, voice, external APIs or APEX account synchronisation.
- Agent products decide whether and how skills are discovered and activated.
- The skill text guides an agent; it cannot guarantee the agent will follow every instruction.
- Review the files before enabling them, especially in repositories containing sensitive data.

## Reference

- [Agent Skills specification](https://agentskills.io/specification)
- [APEX Skills directory](../skills/README.md)
