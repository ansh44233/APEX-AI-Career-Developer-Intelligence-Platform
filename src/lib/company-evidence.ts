import { companyDirectory } from "@/lib/company-directory";

export type EvidenceKind = "official-careers" | "official-interview-guidance" | "apex-authored" | "community-reported";
export type CompanyEvidenceSource = {
  id: string;
  company: string;
  kind: EvidenceKind;
  title: string;
  url: string;
  authority: "employer" | "apex";
  scope: string;
  verification: "official-destination-link" | "apex-original-content";
  lastCheckedAt: null;
};

const officialSources: CompanyEvidenceSource[] = companyDirectory.flatMap((company) => {
  const sources: CompanyEvidenceSource[] = [{
    id: company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-careers",
    company: company.name,
    kind: "official-careers",
    title: company.name + " official careers portal",
    url: company.careersUrl,
    authority: "employer",
    scope: "Employer-controlled careers destination. APEX does not claim this link proves a vacancy is open or describes an interview process.",
    verification: "official-destination-link",
    lastCheckedAt: null,
  }];
  if (company.officialInterviewUrl && company.officialInterviewLabel) {
    sources.push({
      id: company.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-interview-guidance",
      company: company.name,
      kind: "official-interview-guidance",
      title: company.officialInterviewLabel,
      url: company.officialInterviewUrl,
      authority: "employer",
      scope: "Employer-published interview guidance. Follow the source itself for its current scope and applicability.",
      verification: "official-destination-link",
      lastCheckedAt: null,
    });
  }
  return sources;
});

export function getCompanyEvidenceSources(company: string) {
  return officialSources.filter((source) => source.company === company);
}

export const companyEvidencePolicy = {
  official: "Employer-controlled destination; the page's current contents and role applicability must be checked at the source.",
  community: "First-hand community submission; unverified until reviewed and never equivalent to an employer statement.",
  apex: "APEX-authored practice or preparation content; not an employer interview record.",
} as const;
