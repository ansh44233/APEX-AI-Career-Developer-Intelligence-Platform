import { describe, expect, it } from "vitest";
import { findPotentialClaimConflicts } from "@/lib/company-claim-conflicts";

describe("potential approved-claim conflict signals", () => {
  it("flags closely matching claims with explicit opposing wording", () => {
    const claims = [
      { id: "positive", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience" },
      { id: "negative", claimType: "explicit_requirement", claimText: "The role does not require Java and cloud experience" },
    ];
    expect(findPotentialClaimConflicts(claims)).toEqual([
      { first: "positive", second: "negative", sharedTerms: ["cloud", "experience", "java"] },
    ]);
  });

  it("recognizes negation after the shared subject", () => {
    expect(findPotentialClaimConflicts([
      { id: "positive", claimType: "explicit_requirement", claimText: "Java and cloud experience are required" },
      { id: "negative", claimType: "explicit_requirement", claimText: "Java and cloud experience are not required" },
    ])).toHaveLength(1);
  });

  it("does not treat an unrelated negative phrase as a conflict", () => {
    expect(findPotentialClaimConflicts([
      { id: "positive", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience" },
      { id: "other", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience; no relocation is required" },
    ])).toEqual([]);
  });

  it("does not compare different claim types", () => {
    expect(findPotentialClaimConflicts([
      { id: "a", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience" },
      { id: "b", claimType: "employer_guidance", claimText: "The role does not require Java and cloud experience" },
    ])).toEqual([]);
  });

  it("does not flag claims without shared subject matter", () => {
    expect(findPotentialClaimConflicts([
      { id: "a", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience" },
      { id: "b", claimType: "explicit_requirement", claimText: "The role does not require design and product research" },
    ])).toEqual([]);
  });

  it("ignores the phrase not only rather than treating it as negation", () => {
    expect(findPotentialClaimConflicts([
      { id: "a", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience" },
      { id: "b", claimType: "explicit_requirement", claimText: "The role requires not only Java and cloud experience" },
    ])).toEqual([]);
  });

  it("returns no conflicts for an empty or single-claim set", () => {
    expect(findPotentialClaimConflicts([])).toEqual([]);
    expect(findPotentialClaimConflicts([
      { id: "a", claimType: "explicit_requirement", claimText: "The role requires Java and cloud experience" },
    ])).toEqual([]);
  });
});
