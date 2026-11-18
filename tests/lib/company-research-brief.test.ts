import { describe, expect, it } from "vitest";
import { groupApprovedResearchClaims, summarizeResearchCoverage } from "@/lib/company-research-brief";

describe("company research brief evidence grouping", () => {
  it("groups approved role claims into relevant research areas", () => {
    const groups = groupApprovedResearchClaims([
      { claimText: "Candidates should have experience with distributed systems", supportingExcerpt: "Experience with cloud infrastructure is preferred." },
      { claimText: "The process includes a technical interview and assessment", supportingExcerpt: "Applicants may complete a coding assessment." },
      { claimText: "The team uses code review and automated testing", supportingExcerpt: "Engineering practices include continuous deployment." },
      { claimText: "The role supports a customer analytics product", supportingExcerpt: "The product serves enterprise customers." },
      { claimText: "The company competes in the enterprise analytics market", supportingExcerpt: "It competes with other analytics platforms." },
    ]);
    expect(groups.find(group => group.id === "role-requirements")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "hiring-process")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "engineering-culture")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "products-services")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "competitors-market")?.claims).toHaveLength(1);
  });

  it("leaves areas empty when there is no approved evidence instead of inventing claims", () => {
    const groups = groupApprovedResearchClaims([]);
    expect(groups).toHaveLength(6);
    expect(groups.every(group => group.claims.length === 0)).toBe(true);
  });

  it("does not classify generic role text as a verified technology stack", () => {
    const groups = groupApprovedResearchClaims([
      { claimText: "Strong communication and collaboration skills", supportingExcerpt: "Work with cross-functional stakeholders." },
    ]);
    expect(groups.find(group => group.id === "technology-focus")?.claims).toHaveLength(0);
  });
});


describe("company research brief coverage summary", () => {
  it("reports evidenced and empty areas without double-counting claims", () => {
    const groups = groupApprovedResearchClaims([
      { claimText: "The role requires cloud experience", supportingExcerpt: "Cloud experience is preferred." },
      { claimText: "The role requires cloud experience", supportingExcerpt: "Cloud experience is preferred." },
    ]);
    expect(summarizeResearchCoverage(groups)).toEqual({
      totalAreas: 6,
      areasWithEvidence: 2,
      areasWithoutEvidence: 4,
      uniqueClaims: 1,
    });
  });

  it("reports zero coverage when no approved claims exist", () => {
    expect(summarizeResearchCoverage(groupApprovedResearchClaims([]))).toEqual({
      totalAreas: 6,
      areasWithEvidence: 0,
      areasWithoutEvidence: 6,
      uniqueClaims: 0,
    });
  });
});
