export type FreshnessState = "current" | "stale" | "unknown" | "future";

const DAY_MS = 24 * 60 * 60 * 1000;

export function companySnapshotFreshness(retrievedAt: string, now = Date.now()): FreshnessState {
  const timestamp = new Date(retrievedAt).getTime();
  if (!Number.isFinite(timestamp)) return "unknown";
  if (timestamp > now + DAY_MS) return "future";
  return now - timestamp > 365 * DAY_MS ? "stale" : "current";
}

export function communityReportFreshness(interviewDate: string | null, now = Date.now()): FreshnessState {
  if (!interviewDate) return "unknown";
  const timestamp = new Date(interviewDate).getTime();
  if (!Number.isFinite(timestamp)) return "unknown";
  if (timestamp > now + DAY_MS) return "future";
  return now - timestamp > 90 * DAY_MS ? "stale" : "current";
}

export function companySnapshotFreshnessLabel(retrievedAt: string, now = Date.now()): string {
  switch (companySnapshotFreshness(retrievedAt, now)) {
    case "stale":
      return "Historical · over 12 months old";
    case "unknown":
      return "Freshness unknown · date unavailable";
    case "future":
      return "Future-dated · review needed";
    case "current":
      return "Within 12 months";
  }
}
