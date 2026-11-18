# APEX Skills

Portable, task-focused instruction packs for Agent Skills-compatible AI coding agents.

## Available skills

| Skill | Folder | Use it for |
|---|---|---|
| Interview Prep | `interview-prep` | Technical and behavioural interview coaching |
| Coding Practice | `coding-practice` | Algorithms, hints, complexity and code review |
| System Design | `system-design` | Architecture, APIs, reliability and trade-offs |
| Project Review | `project-review` | Evidence-based repository review and project defence |
| Resume Coach | `resume-coach` | Truthful resume editing and job-description comparison |

Every skill contains a `SKILL.md` with required `name` and `description` frontmatter and the task instructions. Folder names match the skill names.

## Install

From the root of a cloned APEX repository, copy the skill folders into a directory supported by your agent:

**Codex-style workspace**
```sh
mkdir -p .agents/skills
cp -R skills/* .agents/skills/
```

**GitHub Copilot-style workspace**
```sh
mkdir -p .github/skills
cp -R skills/* .github/skills/
```

The Windows PowerShell equivalents and additional context are documented in [APEX Skills setup](../docs/apex-skills.md).

These are common integration locations, not a guarantee that every version or product will automatically discover the skills. Follow the current documentation for the agent you use.

## Safety and scope

- Review skill instructions before enabling them.
- Project Review is read-only by default and requires explicit user approval before edits or other side effects.
- Skills must not invent experience, metrics, test results, hiring requirements or repository findings.
- No skill is an executable sandbox, code runner, security scanner, or APEX API integration.
- The skills do not upload project, resume or interview content to APEX servers.

## Format

APEX uses the open [Agent Skills specification](https://agentskills.io/specification). The format packages instructions in a directory with a `SKILL.md`; compatible agents decide how discovery and activation work.
