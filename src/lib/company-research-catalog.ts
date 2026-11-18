export type CompanyResearchArea =
  | "products-services"
  | "technology-focus"
  | "engineering-practices"
  | "competitors-market";

export type CompanyResearchSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  sourceType: "official-company-page" | "annual-report";
  publishedAt: string | null;
  checkedAt: string;
};

export type CompanyResearchClaim = {
  id: string;
  company: string;
  area: CompanyResearchArea;
  statement: string;
  sourceId: string;
  evidenceClass: "official";
  confidence: "high" | "medium";
  scopeNote: string;
};

export type CompanyResearchProfile = {
  company: string;
  claims: CompanyResearchClaim[];
  gaps: Array<{ area: CompanyResearchArea; reason: string }>;
  apexAnalysis: string[];
};

const checkedAt = "2026-11-18";

const sources: CompanyResearchSource[] = [
  {
    id: "google-products",
    title: "Google products and services",
    url: "https://about.google/products/",
    publisher: "Google",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
  },
  {
    id: "microsoft-annual-report-2025",
    title: "Microsoft 2025 Annual Report",
    url: "https://www.microsoft.com/investor/reports/ar25/index.html",
    publisher: "Microsoft",
    sourceType: "annual-report",
    publishedAt: "2025-07-30",
    checkedAt,
  },
  {
    id: "microsoft-azure-products",
    title: "Azure products",
    url: "https://azure.microsoft.com/en-us/products/",
    publisher: "Microsoft",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
  },
  {
    id: "amazon-what-we-do",
    title: "What Amazon does",
    url: "https://www.aboutamazon.com/what-we-do",
    publisher: "Amazon",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
  },
];

const claims: CompanyResearchClaim[] = [
  {
    id: "google-products-portfolio",
    company: "Google",
    area: "products-services",
    statement: "Google's published product catalogue includes Search, YouTube, Android, Chrome, Google Maps, Google Workspace and Google Cloud.",
    sourceId: "google-products",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "Product catalogue only; availability and product scope can vary by country.",
  },
  {
    id: "google-ai-products",
    company: "Google",
    area: "technology-focus",
    statement: "Google's product catalogue includes Gemini and developer-facing offerings such as Google Cloud, Firebase, Flutter and TensorFlow.",
    sourceId: "google-products",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "This identifies published products, not the internal technology stack of a particular team.",
  },
  {
    id: "microsoft-business-portfolio",
    company: "Microsoft",
    area: "products-services",
    statement: "Microsoft describes a portfolio spanning cloud services, productivity and collaboration, personal computing, developer tools, business applications and gaming.",
    sourceId: "microsoft-annual-report-2025",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "Company-wide annual-report description; not a role-specific product assignment.",
  },
  {
    id: "microsoft-cloud-developer-platform",
    company: "Microsoft",
    area: "technology-focus",
    statement: "Microsoft's annual report describes Azure and other cloud services, GitHub cloud services, SQL Server, Windows Server and Visual Studio among its server products and cloud services.",
    sourceId: "microsoft-annual-report-2025",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "These are disclosed products and services, not proof that a given team uses every item.",
  },
  {
    id: "microsoft-azure-categories",
    company: "Microsoft",
    area: "technology-focus",
    statement: "Azure's published catalogue groups offerings across AI and machine learning, analytics, compute, containers, databases, developer tools, DevOps, networking, security and storage.",
    sourceId: "microsoft-azure-products",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "Catalogue categories indicate platform breadth, not the technology stack of a specific vacancy.",
  },
  {
    id: "amazon-business-portfolio",
    company: "Amazon",
    area: "products-services",
    statement: "Amazon describes businesses including Stores, Amazon Web Services, AI, custom chips, Devices and Alexa, entertainment, health services, and operations and supply-chain logistics.",
    sourceId: "amazon-what-we-do",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "Company-published business overview; products and services differ substantially across teams.",
  },
  {
    id: "amazon-aws-ai-infrastructure",
    company: "Amazon",
    area: "technology-focus",
    statement: "Amazon describes AWS cloud services, AI infrastructure and foundation models, and custom silicon including Trainium and Graviton.",
    sourceId: "amazon-what-we-do",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "This is a company-level product description, not a verified internal stack for a particular role.",
  },
];

const profiles: CompanyResearchProfile[] = [
  {
    company: "Google",
    claims: claims.filter((claim) => claim.company === "Google"),
    gaps: [
      { area: "engineering-practices", reason: "No reviewed, role-relevant source has been added for engineering practices." },
      { area: "competitors-market", reason: "Competitor comparisons need independent, dated market evidence; none is currently approved." },
    ],
    apexAnalysis: [
      "For software roles, use the public product portfolio to identify a team or product area before choosing practice topics. This is APEX guidance, not a statement about Google's hiring rubric.",
    ],
  },
  {
    company: "Microsoft",
    claims: claims.filter((claim) => claim.company === "Microsoft"),
    gaps: [
      { area: "engineering-practices", reason: "Company-wide product disclosures do not establish team engineering practices." },
      { area: "competitors-market", reason: "Competitor comparisons need independent, dated market evidence; none is currently approved." },
    ],
    apexAnalysis: [
      "For software roles, narrow preparation to the product group named in the vacancy; the company's broad portfolio should not be treated as a single team stack.",
    ],
  },
  {
    company: "Amazon",
    claims: claims.filter((claim) => claim.company === "Amazon"),
    gaps: [
      { area: "engineering-practices", reason: "No reviewed, role-relevant source has been added for engineering practices." },
      { area: "competitors-market", reason: "Competitor comparisons need independent, dated market evidence; none is currently approved." },
    ],
    apexAnalysis: [
      "For software roles, distinguish the target business (for example AWS, Stores, Devices or logistics) before selecting technical preparation. This is APEX guidance, not a claim about a hiring loop.",
    ],
  },
];

export function getCompanyResearchProfile(company: string): CompanyResearchProfile | null {
  return profiles.find((profile) => profile.company === company) ?? null;
}

export function getCompanyResearchSource(sourceId: string): CompanyResearchSource | null {
  return sources.find((source) => source.id === sourceId) ?? null;
}

export function getCompanyResearchSources(): CompanyResearchSource[] {
  return [...sources];
}

export function getCompanyResearchProfiles(): CompanyResearchProfile[] {
  return profiles.map((profile) => ({
    ...profile,
    claims: [...profile.claims],
    gaps: [...profile.gaps],
    apexAnalysis: [...profile.apexAnalysis],
  }));
}
