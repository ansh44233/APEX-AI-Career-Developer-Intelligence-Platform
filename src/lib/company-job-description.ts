export type JobSkillMatch = {
  label: string;
  matchedTerms: string[];
  practicePath: string;
};

const skillDefinitions: Array<{ label: string; terms: string[]; practicePath: string }> = [
  { label: "JavaScript", terms: ["javascript", "js"], practicePath: "/features/question-bank" },
  { label: "TypeScript", terms: ["typescript"], practicePath: "/features/question-bank" },
  { label: "React", terms: ["react", "react.js", "reactjs"], practicePath: "/features/question-bank" },
  { label: "Next.js", terms: ["next.js", "nextjs"], practicePath: "/features/question-bank" },
  { label: "Node.js", terms: ["node.js", "nodejs"], practicePath: "/features/question-bank" },
  { label: "Python", terms: ["python"], practicePath: "/features/oa-arena" },
  { label: "Java", terms: ["java"], practicePath: "/features/oa-arena" },
  { label: "SQL", terms: ["sql", "postgresql", "mysql"], practicePath: "/features/question-bank" },
  { label: "API design", terms: ["api design", "rest api", "restful", "graphql"], practicePath: "/features/system-design" },
  { label: "Databases", terms: ["database", "databases", "mongodb", "redis", "data modelling", "data modeling"], practicePath: "/features/question-bank" },
  { label: "Testing", terms: ["testing", "unit test", "integration test", "jest", "playwright", "cypress"], practicePath: "/features/project-defense" },
  { label: "Cloud", terms: ["cloud", "aws", "azure", "google cloud", "gcp"], practicePath: "/features/system-design" },
  { label: "Docker", terms: ["docker", "containerization", "containers"], practicePath: "/features/system-design" },
  { label: "Kubernetes", terms: ["kubernetes", "k8s"], practicePath: "/features/system-design" },
  { label: "System design", terms: ["system design", "distributed systems", "scalability", "high availability"], practicePath: "/features/system-design" },
  { label: "Security", terms: ["security", "authentication", "authorization", "oauth", "owasp"], practicePath: "/features/question-bank" },
  { label: "Networking", terms: ["networking", "tcp/ip", "dns", "http/https"], practicePath: "/features/question-bank" },
  { label: "Communication", terms: ["communication", "stakeholder management", "cross-functional"], practicePath: "/features/interview-lab" },
  { label: "Leadership", terms: ["leadership", "mentoring", "team leadership"], practicePath: "/features/interview-lab" },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
}

function containsTerm(text: string, term: string) {
  const escaped = escapeRegExp(term);
  return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(text);
}

/**
 * Finds mentions from a deliberately small vocabulary. This is lexical matching,
 * not a skills assessment, requirement extractor, or ATS score.
 */
export function analyzeJobDescription(description: string): JobSkillMatch[] {
  const text = description.slice(0, 20_000).toLowerCase();
  if (!text.trim()) return [];

  return skillDefinitions.flatMap((skill) => {
    const matchedTerms = skill.terms.filter((term) => containsTerm(text, term));
    return matchedTerms.length
      ? [{ label: skill.label, matchedTerms, practicePath: skill.practicePath }]
      : [];
  });
}
