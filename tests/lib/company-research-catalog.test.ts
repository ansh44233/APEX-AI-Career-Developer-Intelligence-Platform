import { describe, expect, it } from "vitest";
import {
  getCompanyResearchProfile,
  getCompanyResearchProfiles,
  getCompanyResearchSource,
  getCompanyResearchSources,
} from "@/lib/company-research-catalog";

describe("company research evidence catalogue", () => {
  it("keeps every official claim attached to a registered source", () => {
    for (const profile of getCompanyResearchProfiles()) {
      for (const claim of profile.claims) {
        const source = getCompanyResearchSource(claim.sourceId);
        expect(source).not.toBeNull();
        expect(source?.url.startsWith("https://")).toBe(true);
        expect(claim.evidenceClass).toBe("official");
        expect(claim.scopeNote.length).toBeGreaterThan(10);
      }
    }
  });

  it("does not invent competitor or engineering-practice claims", () => {
    for (const profile of getCompanyResearchProfiles()) {
      expect(profile.claims.some((claim) => claim.area === "competitors-market")).toBe(false);
      expect(profile.claims.some((claim) => claim.area === "engineering-practices")).toBe(false);
      expect(profile.gaps.some((gap) => gap.area === "competitors-market")).toBe(true);
      expect(profile.gaps.some((gap) => gap.area === "engineering-practices")).toBe(true);
    }
  });

  it("keeps APEX interpretation separate from official claims", () => {
    const profile = getCompanyResearchProfile("Amazon");
    expect(profile?.apexAnalysis.length).toBeGreaterThan(0);
    expect(profile?.claims.every((claim) => claim.evidenceClass === "official")).toBe(true);
  });

  it("returns no profile for an unsupported company instead of guessing", () => {
    expect(getCompanyResearchProfile("Not a real company")).toBeNull();
  });

  it("registers only HTTPS sources with a visible checked date", () => {
    const registered = getCompanyResearchSources();
    expect(registered.length).toBeGreaterThan(0);
    expect(registered.every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(registered.every((source) => source.checkedAt === "2026-11-18")).toBe(true);
  });
});
