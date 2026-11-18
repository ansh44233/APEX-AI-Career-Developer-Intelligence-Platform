import "server-only";

export type ApexToolId = "text-inspector" | "skill-term-extractor";

export const APEX_TOOLS = [
  {
    id: "text-inspector",
    name: "Text Inspector",
    description: "Count words, characters and non-empty lines in text you provide.",
    input: "text",
    sideEffect: "none",
    approval: "explicit-user-click",
  },
  {
    id: "skill-term-extractor",
    name: "Skill Term Extractor",
    description: "Find a limited set of predefined developer skill terms in text you provide.",
    input: "text",
    sideEffect: "none",
    approval: "explicit-user-click",
  },
] as const;

const SKILL_TERMS = [
  "javascript", "typescript", "react", "next.js", "node.js", "python", "java",
  "sql", "postgresql", "mongodb", "rest api", "graphql", "html", "css",
  "tailwind", "git", "github", "docker", "kubernetes", "aws", "azure",
  "testing", "jest", "playwright", "ci/cd", "system design", "data structures",
  "algorithms", "machine learning", "security", "accessibility",
];

export function isApexToolId(value: string): value is ApexToolId {
  return APEX_TOOLS.some((tool) => tool.id === value);
}

export function executeApexTool(toolId: ApexToolId, input: string) {
  if (toolId === "text-inspector") {
    const words = input.trim() ? input.trim().split(/\\s+/).length : 0;
    const nonEmptyLines = input.split(/\\r?\\n/).filter((line) => line.trim()).length;
    return { toolId, result: { characters: input.length, words, nonEmptyLines } };
  }

  const normalized = input.toLocaleLowerCase();
  const found = SKILL_TERMS.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
    return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i").test(normalized);
  });
  return { toolId, result: { matchedTerms: found, matchCount: found.length, vocabularySize: SKILL_TERMS.length } };
}
