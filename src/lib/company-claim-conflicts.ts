const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "into", "is", "it", "of", "on", "or", "the", "their", "this", "to", "with",
  "will", "would", "should", "must", "can", "may", "role", "team", "company",
]);

function terms(value: string) {
  return new Set(
    value.toLowerCase().match(/[a-z0-9+#.]+/g)?.filter((term) => term.length > 2 && !stopWords.has(term)) ?? [],
  );
}

function polarity(value: string): "positive" | "negative" {
  // Deliberately narrow: only explicit negation is considered. This is a review
  // signal, not natural-language inference or a claim that two statements conflict.
  const normalized = value.toLowerCase().replace(/\bnot only\b/g, "");
  return /\b(no|not|never|without|cannot|can't|cant|isn't|isnt|doesn't|doesnt|won't|wont)\b/.test(normalized)
    ? "negative"
    : "positive";
}

export type ConflictCandidate = {
  first: string;
  second: string;
  sharedTerms: string[];
};

export function findPotentialClaimConflicts<T extends { id: string; claimType: string; claimText: string }>(
  claims: T[],
): ConflictCandidate[] {
  const conflicts: ConflictCandidate[] = [];
  for (let left = 0; left < claims.length; left += 1) {
    for (let right = left + 1; right < claims.length; right += 1) {
      const a = claims[left];
      const b = claims[right];
      if (a.claimType !== b.claimType || polarity(a.claimText) === polarity(b.claimText)) continue;
      const aTerms = terms(a.claimText);
      const bTerms = terms(b.claimText);
      const sharedTerms = [...aTerms].filter((term) => bTerms.has(term)).sort();
      const smallerSetSize = Math.min(aTerms.size, bTerms.size);
      if (smallerSetSize < 3 || sharedTerms.length / smallerSetSize < 0.6) continue;
      conflicts.push({ first: a.id, second: b.id, sharedTerms });
    }
  }
  return conflicts;
}
