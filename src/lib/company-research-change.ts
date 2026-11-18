export type ApprovedSnapshotVersion = {
  retrievedAt: string;
  contentHash: string;
};

export type SnapshotHistoryComparison = {
  status: "changed" | "unchanged" | "insufficient-history" | "unknown";
  previousRetrievedAt: string | null;
};

/**
 * Compares the two newest moderator-approved snapshots. This is a byte-level
 * extracted-content hash signal, not semantic change detection.
 */
export function compareApprovedSnapshotHistory(
  snapshots: readonly ApprovedSnapshotVersion[],
): SnapshotHistoryComparison {
  if (snapshots.length < 2) {
    return { status: "insufficient-history", previousRetrievedAt: null };
  }

  if (snapshots.some((snapshot) =>
    !snapshot.contentHash.trim() || !Number.isFinite(Date.parse(snapshot.retrievedAt))
  )) {
    return { status: "unknown", previousRetrievedAt: null };
  }

  const ordered = [...snapshots].sort(
    (a, b) => Date.parse(b.retrievedAt) - Date.parse(a.retrievedAt),
  );
  const [latest, previous] = ordered;

  return {
    status: latest.contentHash === previous.contentHash ? "unchanged" : "changed",
    previousRetrievedAt: previous.retrievedAt,
  };
}
