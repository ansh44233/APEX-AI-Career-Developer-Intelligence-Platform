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
  reviewIntervalDays: number;
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
    reviewIntervalDays: 90,
  },
  {
    id: "google-sre-resources",
    title: "Google Site Reliability Engineering resources",
    url: "https://sre.google/resources/",
    publisher: "Google",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
    reviewIntervalDays: 90,
  },
  {
    id: "microsoft-annual-report-2025",
    title: "Microsoft 2025 Annual Report",
    url: "https://www.microsoft.com/investor/reports/ar25/index.html",
    publisher: "Microsoft",
    sourceType: "annual-report",
    publishedAt: "2025-07-30",
    checkedAt,
    reviewIntervalDays: 365,
  },
  {
    id: "microsoft-azure-products",
    title: "Azure products",
    url: "https://azure.microsoft.com/en-us/products/",
    publisher: "Microsoft",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
    reviewIntervalDays: 90,
  },
  {
    id: "amazon-what-we-do",
    title: "What Amazon does",
    url: "https://www.aboutamazon.com/what-we-do",
    publisher: "Amazon",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
    reviewIntervalDays: 90,
  },
  {
    id: "amazon-builders-library",
    title: "The Amazon Builders' Library",
    url: "https://aws.amazon.com/builders-library/",
    publisher: "Amazon",
    sourceType: "official-company-page",
    publishedAt: null,
    checkedAt,
    reviewIntervalDays: 90,
  },
];

const claims: CompanyResearchClaim[] = [
  {
    id: "google-products-portfolio",
    company: "Google",
    area: "products-services",
    statement: "Google's published product catalogue includes Search, Android, Chrome, Google Maps Platform, Google Workspace and Google Cloud.",
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
    id: "google-sre-practices",
    company: "Google",
    area: "engineering-practices",
    statement: "Google's SRE resource library documents engineering practices for reliable production systems, including service-level objectives, monitoring, incident management, postmortems, testing for reliability and software engineering in SRE.",
    sourceId: "google-sre-resources",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "These are published SRE practices and resources, not proof that every Google engineering team uses the same operating model.",
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
    id: "microsoft-engineering-priorities",
    company: "Microsoft",
    area: "engineering-practices",
    statement: "Microsoft's 2025 annual report identifies security, quality and AI innovation as core priorities, and describes work on secure-by-design practices, change management, incident management, platform resiliency and service health.",
    sourceId: "microsoft-annual-report-2025",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "Company-wide published priorities and initiatives; not a guarantee of identical practices in every team.",
  },
  {
    id: "microsoft-competition-context",
    company: "Microsoft",
    area: "competitors-market",
    statement: "Microsoft's 2025 annual report says Azure competes with cloud providers and open-source offerings; its AI products compete with hyperscalers, emerging providers and open-source alternatives; and developer products face major technology-provider and open-source competition.",
    sourceId: "microsoft-annual-report-2025",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "This summarizes Microsoft's own competition disclosures; it is not an independent market ranking and does not name a complete competitor set.",
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
  {
    id: "amazon-builders-library-practices",
    company: "Amazon",
    area: "engineering-practices",
    statement: "Amazon's Builders' Library describes engineering practices used to develop, architect, release and operate technology, with articles covering architecture, software delivery and operations.",
    sourceId: "amazon-builders-library",
    evidenceClass: "official",
    confidence: "high",
    scopeNote: "The library describes practices and lessons from Amazon; Amazon explicitly notes that approaches vary by team and situation, so this is not a universal team playbook.",
  },
];

const profiles: CompanyResearchProfile[] = [
  {
    company: "Google",
    claims: claims.filter((claim) => claim.company === "Google"),
    gaps: [
      { area: "competitors-market", reason: "Competitor comparisons need independent, dated market evidence; none is currently approved." },
    ],
    apexAnalysis: [
      "For software roles, use the public product portfolio to identify a team or product area before choosing practice topics. This is APEX guidance, not a statement about Google's hiring rubric.",
    ],
  },
  {
    company: "Microsoft",
    claims: claims.filter((claim) => claim.company === "Microsoft"),
    gaps: [],
    apexAnalysis: [
      "For software roles, narrow preparation to the product group named in the vacancy; the company's broad portfolio should not be treated as a single team stack.",
    ],
  },
  {
    company: "Amazon",
    claims: claims.filter((claim) => claim.company === "Amazon"),
    gaps: [
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
