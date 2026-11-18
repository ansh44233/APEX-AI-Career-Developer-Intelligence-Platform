export type SourceReviewState = "not-reviewed" | "due" | "scheduled-window" | "unknown" | "future";

const DAY_MS = 24 * 60 * 60 * 1000;

export function companySourceReviewStatus(
  retrievedAt: string | null,
  reviewIntervalDays: number,
  now = Date.now(),
): SourceReviewState {
  if (!retrievedAt) return "not-reviewed";
  if (!Number.isInteger(reviewIntervalDays) || reviewIntervalDays < 1) return "unknown";
  const timestamp = new Date(retrievedAt).getTime();
  if (!Number.isFinite(timestamp)) return "unknown";
  if (timestamp > now + DAY_MS) return "future";
  return now - timestamp >= reviewIntervalDays * DAY_MS ? "due" : "scheduled-window";
}

export function companySourceReviewLabel(
  retrievedAt: string | null,
  reviewIntervalDays: number,
  now = Date.now(),
): string {
  switch (companySourceReviewStatus(retrievedAt, reviewIntervalDays, now)) {
    case "not-reviewed":
      return "Review due · no approved snapshot";
    case "due":
      return "Review overdue · capture needs re-check";
    case "scheduled-window":
      return "Review not yet due";
    case "unknown":
      return "Review status unknown · date or interval unavailable";
    case "future":
      return "Review status unknown · future-dated snapshot";
  }
}
