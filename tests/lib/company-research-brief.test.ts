import { describe, expect, it } from "vitest";
import { groupApprovedResearchClaims } from "@/lib/company-research-brief";

describe("company research brief evidence grouping", () => {
  it("groups approved role claims into relevant research areas", () => {
    const groups = groupApprovedResearchClaims([
      { claimText: "Candidates should have experience with distributed systems", supportingExcerpt: "Experience with cloud infrastructure is preferred." },
      { claimText: "The process includes a technical interview and assessment", supportingExcerpt: "Applicants may complete a coding assessment." },
      { claimText: "The team uses code review and automated testing", supportingExcerpt: "Engineering practices include continuous deployment." },
      { claimText: "The role supports a customer analytics product", supportingExcerpt: "The product serves enterprise customers." },
    ]);
    expect(groups.find(group => group.id === "role-requirements")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "hiring-process")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "engineering-practice")?.claims).toHaveLength(1);
    expect(groups.find(group => group.id === "products-market")?.claims).toHaveLength(1);
  });

  it("leaves areas empty when there is no approved evidence instead of inventing claims", () => {
    const groups = groupApprovedResearchClaims([]);
    expect(groups).toHaveLength(5);
    expect(groups.every(group => group.claims.length === 0)).toBe(true);
  });

  it("does not classify generic role text as a verified technology stack", () => {
    const groups = groupApprovedResearchClaims([
      { claimText: "Strong communication and collaboration skills", supportingExcerpt: "Work with cross-functional stakeholders." },
    ]);
    expect(groups.find(group => group.id === "technology-focus")?.claims).toHaveLength(0);
  });
});
