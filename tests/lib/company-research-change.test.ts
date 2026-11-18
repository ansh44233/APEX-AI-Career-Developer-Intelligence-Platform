import { describe, expect, it } from "vitest";
import { compareApprovedSnapshotHistory } from "@/lib/company-research-change";

describe("approved company snapshot change comparison", () => {
  it("reports changed extracted content between the two newest captures", () => {
    expect(compareApprovedSnapshotHistory([
      { retrievedAt: "2026-11-01T10:00:00.000Z", contentHash: "new-hash" },
      { retrievedAt: "2026-10-01T10:00:00.000Z", contentHash: "old-hash" },
    ])).toEqual({
      status: "changed",
      previousRetrievedAt: "2026-10-01T10:00:00.000Z",
    });
  });

  it("reports unchanged extracted content when hashes match", () => {
    expect(compareApprovedSnapshotHistory([
      { retrievedAt: "2026-11-01T10:00:00.000Z", contentHash: "same" },
      { retrievedAt: "2026-10-01T10:00:00.000Z", contentHash: "same" },
    ]).status).toBe("unchanged");
  });

  it("sorts captures by retrieval date instead of trusting input order", () => {
    expect(compareApprovedSnapshotHistory([
      { retrievedAt: "2026-10-01T10:00:00.000Z", contentHash: "old" },
      { retrievedAt: "2026-11-01T10:00:00.000Z", contentHash: "new" },
    ]).status).toBe("changed");
  });

  it("does not infer a change when only one approved capture exists", () => {
    expect(compareApprovedSnapshotHistory([
      { retrievedAt: "2026-11-01T10:00:00.000Z", contentHash: "only" },
    ])).toEqual({ status: "insufficient-history", previousRetrievedAt: null });
  });

  it("keeps invalid dates or missing hashes unknown", () => {
    expect(compareApprovedSnapshotHistory([
      { retrievedAt: "not-a-date", contentHash: "a" },
      { retrievedAt: "2026-10-01T10:00:00.000Z", contentHash: "b" },
    ]).status).toBe("unknown");
    expect(compareApprovedSnapshotHistory([
      { retrievedAt: "2026-11-01T10:00:00.000Z", contentHash: "" },
      { retrievedAt: "2026-10-01T10:00:00.000Z", contentHash: "b" },
    ]).status).toBe("unknown");
  });
});
