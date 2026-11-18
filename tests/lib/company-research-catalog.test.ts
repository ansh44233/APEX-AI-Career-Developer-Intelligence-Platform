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

  it("fills engineering-practices only where an official source supports a scoped claim", () => {
    for (const company of ["Google", "Microsoft", "Amazon", "Apple"]) {
      const profile = getCompanyResearchProfile(company);
      expect(profile?.claims.some((claim) => claim.area === "engineering-practices")).toBe(true);
      expect(profile?.gaps.some((gap) => gap.area === "engineering-practices")).toBe(false);
    }
    for (const company of ["Google", "Amazon"]) {
      const profile = getCompanyResearchProfile(company);
      expect(profile?.claims.some((claim) => claim.area === "competitors-market")).toBe(false);
      expect(profile?.gaps.some((gap) => gap.area === "competitors-market")).toBe(true);
    }
  });

  it("adds Meta and Apple profiles only for their supported research areas", () => {
    const meta = getCompanyResearchProfile("Meta");
    expect(meta?.claims.some((claim) => claim.area === "technology-focus")).toBe(true);
    expect(meta?.gaps.some((gap) => gap.area === "products-services")).toBe(true);
    expect(meta?.gaps.some((gap) => gap.area === "competitors-market")).toBe(true);

    const apple = getCompanyResearchProfile("Apple");
    expect(apple?.claims.some((claim) => claim.area === "technology-focus")).toBe(true);
    expect(apple?.claims.some((claim) => claim.area === "engineering-practices")).toBe(true);
    expect(apple?.gaps.some((gap) => gap.area === "competitors-market")).toBe(true);
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
    expect(registered.every((source) => source.checkedAt === "2026-11-19")).toBe(true);
    expect(registered.find((source) => source.id === "microsoft-annual-report-2025")?.reviewIntervalDays).toBe(365);
    expect(registered.filter((source) => source.sourceType === "official-company-page").every((source) => source.reviewIntervalDays === 90)).toBe(true);
    expect(registered.find((source) => source.id === "google-sre-resources")?.publisher).toBe("Google");
    expect(registered.find((source) => source.id === "amazon-builders-library")?.publisher).toBe("Amazon");
    expect(registered.find((source) => source.id === "meta-engineering-blog")?.publisher).toBe("Meta");
    expect(registered.find((source) => source.id === "apple-ml-ai-teams")?.publisher).toBe("Apple");
  });
});
