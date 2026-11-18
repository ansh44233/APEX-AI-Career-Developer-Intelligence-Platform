import { describe, expect, it } from "vitest";
import { companySnapshotFreshness, communityReportFreshness } from "@/lib/company-intelligence-freshness";

const NOW = Date.parse("2026-11-18T12:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();

describe("company evidence freshness", () => {
  it("marks snapshots older than one year as stale", () => {
    expect(companySnapshotFreshness(daysAgo(366), NOW)).toBe("stale");
  });

  it("keeps snapshots within one year current", () => {
    expect(companySnapshotFreshness(daysAgo(364), NOW)).toBe("current");
  });

  it("does not treat missing or invalid dates as current", () => {
    expect(companySnapshotFreshness("not-a-date", NOW)).toBe("unknown");
  });

  it("flags future snapshot timestamps for review", () => {
    expect(companySnapshotFreshness(new Date(NOW + 2 * 24 * 60 * 60 * 1000).toISOString(), NOW)).toBe("future");
  });
});

describe("community interview report freshness", () => {
  it("marks reports older than 90 days as stale", () => {
    expect(communityReportFreshness(daysAgo(91), NOW)).toBe("stale");
  });

  it("keeps reports within 90 days current", () => {
    expect(communityReportFreshness(daysAgo(89), NOW)).toBe("current");
  });

  it("marks absent and invalid interview dates as unknown", () => {
    expect(communityReportFreshness(null, NOW)).toBe("unknown");
    expect(communityReportFreshness("invalid", NOW)).toBe("unknown");
  });

  it("flags future interview dates for review", () => {
    expect(communityReportFreshness(new Date(NOW + 2 * 24 * 60 * 60 * 1000).toISOString(), NOW)).toBe("future");
  });
});

describe("company evidence freshness labels", () => {
  it("distinguishes historical, unknown, future-dated and current snapshots", async () => {
    const { companySnapshotFreshnessLabel } = await import("@/lib/company-intelligence-freshness");
    expect(companySnapshotFreshnessLabel(daysAgo(366), NOW)).toBe("Historical · over 12 months old");
    expect(companySnapshotFreshnessLabel("not-a-date", NOW)).toBe("Freshness unknown · date unavailable");
    expect(companySnapshotFreshnessLabel(new Date(NOW + 2 * 24 * 60 * 60 * 1000).toISOString(), NOW)).toBe("Future-dated · review needed");
    expect(companySnapshotFreshnessLabel(daysAgo(10), NOW)).toBe("Within 12 months");
  });
});
