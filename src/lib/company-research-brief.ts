export const companyResearchAreas = [
  { id: "role-requirements", label: "Role requirements", terms: /requirement|qualif|must have|experience|proficien|degree|skill|responsibilit/i },
  { id: "hiring-process", label: "Hiring process", terms: /interview|assessment|screen|hiring process|recruit|round|application/i },
  { id: "engineering-practice", label: "Engineering practices", terms: /engineering|development|code review|testing|deployment|reliability|architecture|agile|team/i },
  { id: "technology-focus", label: "Technology focus", terms: /technology|tech stack|platform|framework|language|cloud|database|infrastructure|tooling/i },
  { id: "products-market", label: "Products and market", terms: /product|service|customer|market|competitor|competition|business model/i },
] as const;

export type ResearchClaim = { claimText: string; supportingExcerpt: string };

export function groupApprovedResearchClaims<T extends ResearchClaim>(claims: T[]) {
  return companyResearchAreas.map(area => ({
    ...area,
    claims: claims.filter(claim => area.terms.test(claim.claimText + " " + claim.supportingExcerpt)),
  }));
}
