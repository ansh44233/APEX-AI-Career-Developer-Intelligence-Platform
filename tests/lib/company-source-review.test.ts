import { describe, expect, it } from "vitest";
import { companySourceReviewLabel, companySourceReviewStatus } from "@/lib/company-source-review";

const NOW = Date.parse("2026-11-18T12:00:00.000Z");

describe("company source review status", () => {
  it("requires a first approved capture before a source can be considered reviewed", () => {
    expect(companySourceReviewStatus(null, 90, NOW)).toBe("not-reviewed");
    expect(companySourceReviewLabel(null, 90, NOW)).toBe("Review due · no approved snapshot");
  });

  it("marks a source due at its configured review interval", () => {
    const retrievedAt = new Date(NOW - 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(companySourceReviewStatus(retrievedAt, 90, NOW)).toBe("due");
    expect(companySourceReviewLabel(retrievedAt, 90, NOW)).toBe("Review overdue · capture needs re-check");
  });

  it("does not mark a source overdue before its interval", () => {
    const retrievedAt = new Date(NOW - 89 * 24 * 60 * 60 * 1000).toISOString();
    expect(companySourceReviewStatus(retrievedAt, 90, NOW)).toBe("scheduled-window");
  });

  it("keeps invalid dates and invalid intervals unknown", () => {
    expect(companySourceReviewStatus("not-a-date", 90, NOW)).toBe("unknown");
    expect(companySourceReviewStatus("2026-11-01T00:00:00.000Z", 0, NOW)).toBe("unknown");
  });

  it("flags future-dated captures for review rather than treating them as fresh", () => {
    const future = new Date(NOW + 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(companySourceReviewStatus(future, 90, NOW)).toBe("future");
    expect(companySourceReviewLabel(future, 90, NOW)).toBe("Review status unknown · future-dated snapshot");
  });
});
