export const companyResearchAreas = [
  { id: "role-requirements", label: "Role requirements", terms: /requirement|qualif|must have|experience|proficien|degree|skill|responsibilit/i },
  { id: "hiring-process", label: "Hiring process", terms: /interview|assessment|screen|hiring process|recruit|round|application/i },
  { id: "engineering-culture", label: "Engineering culture", terms: /engineering culture|code review|testing|deployment|reliability|architecture|agile|team practice|on.call|incident|ownership|collaboration/i },
  { id: "technology-focus", label: "Technology focus", terms: /technology|tech stack|platform|framework|language|cloud|database|infrastructure|tooling|programming/i },
  { id: "products-services", label: "Products and services", terms: /product|service|customer|offering|solution|business model/i },
  { id: "competitors-market", label: "Competitors and market", terms: /market|competitor|competition|industry|market share|alternative|rival/i },
] as const;

export type ResearchClaim = { claimText: string; supportingExcerpt: string };

export function groupApprovedResearchClaims<T extends ResearchClaim>(claims: T[]) {
  return companyResearchAreas.map(area => ({
    ...area,
    claims: claims.filter(claim => area.terms.test(claim.claimText + " " + claim.supportingExcerpt)),
  }));
}
