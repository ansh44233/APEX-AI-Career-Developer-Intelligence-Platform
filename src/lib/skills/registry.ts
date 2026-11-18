export const APEX_SKILLS = [
  {
    slug: "interview-prep",
    name: "Interview Prep",
    description: "Prepare for technical and behavioural interviews with structured practice and honest feedback.",
    version: "1.0.0",
    category: "career-coaching",
    capabilities: ["mock-interview", "answer-feedback", "practice-planning"],
    entrypoint: "skills/interview-prep/SKILL.md",
  },
  {
    slug: "coding-practice",
    name: "Coding Practice",
    description: "Coach algorithms, progressive hints, complexity analysis, edge cases and debugging.",
    version: "1.0.0",
    category: "coding",
    capabilities: ["algorithm-coaching", "progressive-hints", "code-review"],
    entrypoint: "skills/coding-practice/SKILL.md",
  },
  {
    slug: "system-design",
    name: "System Design",
    description: "Guide requirements, architecture, APIs, reliability, security and engineering trade-offs.",
    version: "1.0.0",
    category: "architecture",
    capabilities: ["architecture-coaching", "api-design", "tradeoff-analysis"],
    entrypoint: "skills/system-design/SKILL.md",
  },
  {
    slug: "project-review",
    name: "Project Review",
    description: "Review available repository evidence and prepare prioritised, read-only technical findings.",
    version: "1.0.0",
    category: "code-quality",
    capabilities: ["repository-review-guidance", "evidence-based-findings", "project-defence"],
    entrypoint: "skills/project-review/SKILL.md",
  },
  {
    slug: "resume-coach",
    name: "Resume Coach",
    description: "Improve truthful resume content and compare supplied experience with a target role.",
    version: "1.0.0",
    category: "career-coaching",
    capabilities: ["resume-feedback", "job-description-comparison", "bullet-editing"],
    entrypoint: "skills/resume-coach/SKILL.md",
  },
] as const;

export type ApexSkill = (typeof APEX_SKILLS)[number];

export function isApexSkillSlug(value: string): value is ApexSkill["slug"] {
  return APEX_SKILLS.some((skill) => skill.slug === value);
}
