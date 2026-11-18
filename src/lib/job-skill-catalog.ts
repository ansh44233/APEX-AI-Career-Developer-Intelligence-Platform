export type JobSkill = { key: string; label: string; aliases: string[]; module: string; action: string };

export const jobSkillCatalog: JobSkill[] = [
  { key: "javascript", label: "JavaScript", aliases: ["javascript", " js "], module: "/features/oa-arena", action: "Practise language fundamentals, asynchronous code and problem-solving." },
  { key: "typescript", label: "TypeScript", aliases: ["typescript", " ts "], module: "/features/oa-arena", action: "Review types, narrowing, generics and safe API contracts." },
  { key: "react", label: "React", aliases: ["react", "react.js", "reactjs"], module: "/features/project-defense", action: "Explain component state, data flow, rendering and accessibility." },
  { key: "nextjs", label: "Next.js", aliases: ["next.js", "nextjs"], module: "/features/project-defense", action: "Review routing, rendering boundaries, caching and server/client responsibilities." },
  { key: "node", label: "Node.js", aliases: ["node.js", "nodejs"], module: "/features/system-design", action: "Review runtime fundamentals, API design and service boundaries." },
  { key: "python", label: "Python", aliases: ["python"], module: "/features/oa-arena", action: "Practise Python fundamentals and data-structure problems." },
  { key: "java", label: "Java", aliases: ["java"], module: "/features/oa-arena", action: "Practise Java fundamentals, collections and problem solving." },
  { key: "sql", label: "SQL", aliases: ["sql", "postgresql", "mysql"], module: "/features/oa-arena", action: "Practise joins, aggregation, indexes and query reasoning." },
  { key: "api", label: "API design", aliases: ["api design", "rest api", "restful", "graphql"], module: "/features/system-design", action: "Design endpoints, validation, errors, pagination and authorization." },
  { key: "databases", label: "Databases", aliases: ["database", "databases", "data modelling", "data modeling", "mongodb", "redis"], module: "/features/system-design", action: "Review data modelling, indexing, transactions and consistency." },
  { key: "testing", label: "Testing", aliases: ["testing", "unit test", "integration test", "jest", "playwright", "cypress"], module: "/features/project-defense", action: "Create a test strategy and explain edge cases." },
  { key: "cloud", label: "Cloud", aliases: ["cloud", "aws", "azure", "google cloud", "gcp"], module: "/features/system-design", action: "Review cloud primitives, deployment and reliability trade-offs." },
  { key: "docker", label: "Docker", aliases: ["docker", "containerization", "containers"], module: "/features/system-design", action: "Explain images, containers, networking and deployment workflow." },
  { key: "kubernetes", label: "Kubernetes", aliases: ["kubernetes", "k8s"], module: "/features/system-design", action: "Review orchestration concepts, scaling and service health." },
  { key: "ci_cd", label: "CI / CD", aliases: ["ci/cd", "continuous integration", "continuous delivery", "continuous deployment"], module: "/features/project-defense", action: "Describe a safe build, test, release and rollback pipeline." },
  { key: "linux", label: "Linux", aliases: ["linux", "unix"], module: "/features/oa-arena", action: "Practise shell, processes, permissions and filesystem fundamentals." },
  { key: "networking", label: "Networking", aliases: ["networking", "tcp/ip", "dns", "http/https"], module: "/features/system-design", action: "Explain DNS, HTTP, TCP and common network failure modes." },
  { key: "system_design", label: "System design", aliases: ["system design", "distributed systems", "scalability", "high availability"], module: "/features/system-design", action: "Practise requirements, architecture, bottlenecks and trade-offs." },
  { key: "security", label: "Security", aliases: ["security", "authentication", "authorization", "oauth", "owasp"], module: "/features/system-design", action: "Review identity, access control, input validation and common risks." },
  { key: "git", label: "Git", aliases: ["git", "github", "version control"], module: "/features/project-defense", action: "Explain branching, reviews, conflict resolution and collaboration." },
  { key: "communication", label: "Communication", aliases: ["communication", "stakeholder management", "cross-functional"], module: "/features/interview-lab", action: "Practise concise technical and behavioural explanations." },
  { key: "leadership", label: "Leadership", aliases: ["leadership", "mentoring", "team leadership"], module: "/features/interview-lab", action: "Prepare truthful examples of ownership, collaboration and mentoring." },
  { key: "problem_solving", label: "Problem solving", aliases: ["problem solving", "analytical thinking", "critical thinking"], module: "/features/oa-arena", action: "Practise structured approaches and explain trade-offs." },
];

function containsTerm(text: string, term: string) {
  const escaped = term.trim().replace(/[.*+?^$()|[\\]\\\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(text);
}

export function detectJobSkills(text: string) {
  const normalized = text.toLowerCase();
  return jobSkillCatalog.filter(skill => skill.aliases.some(alias => containsTerm(normalized, alias)));
}
