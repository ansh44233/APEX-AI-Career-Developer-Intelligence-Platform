import { describe, expect, it } from "vitest";
import { companyDirectory } from "@/lib/company-directory";
import { getCompanyEvidenceSourceById, getCompanyEvidenceSources } from "@/lib/company-evidence";

describe("company evidence source registry", () => {
  it("uses unique registered identifiers and HTTPS destinations", () => {
    const all = companyDirectory.flatMap(company => getCompanyEvidenceSources(company.name));
    const ids = all.map(source => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const source of all) {
      expect(new URL(source.url).protocol).toBe("https:");
      expect(source.authority).toBe("employer");
      expect(source.verification).toBe("official-destination-link");
      expect(source.lastCheckedAt).toBeNull();
    }
  });

  it("does not mislabel a careers portal as interview guidance", () => {
    const source = getCompanyEvidenceSourceById("google-careers");
    expect(source?.kind).toBe("official-careers");
    expect(source?.scope).toContain("does not claim");
  });

  it("preserves the historical qualification on Google's interview article", () => {
    const source = getCompanyEvidenceSourceById("google-interview-guidance");
    expect(source?.title).toContain("historical guidance");
    expect(source?.url).toContain("blog.google");
  });

  it("registers employer interview guidance separately when available", () => {
    expect(getCompanyEvidenceSourceById("microsoft-interview-guidance")?.kind).toBe("official-interview-guidance");
    expect(getCompanyEvidenceSourceById("amazon-interview-guidance")?.kind).toBe("official-interview-guidance");
  });

  it("does not resolve unregistered source identifiers", () => {
    expect(getCompanyEvidenceSourceById("unknown-company-source")).toBeNull();
  });
});
