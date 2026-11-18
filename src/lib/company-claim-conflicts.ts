const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "into", "is", "it", "of", "on", "or", "the", "their", "this", "to", "with",
  "will", "would", "should", "must", "can", "may", "role", "team", "company",
]);

const negationWords = new Set([
  "no", "not", "never", "without", "cannot", "cant", "isnt", "doesnt", "wont",
]);

function terms(value: string) {
  return new Set(
    value.toLowerCase().match(/[a-z0-9+#.]+/g)?.filter((term) => term.length > 2 && !stopWords.has(term)) ?? [],
  );
}

function hasNegationNearSharedSubject(value: string, sharedTerms: string[]) {
  const shared = new Set(sharedTerms);
  // Treat punctuation as a boundary so a negation in a separate clause or sentence
  // (for example, "no relocation") cannot reverse the polarity of the shared subject.
  const segments = value.toLowerCase().replace(/['’]/g, "").split(/[.;!?\n]+/);
  return segments.some((segment) => {
    const tokens = segment.match(/[a-z0-9+#.]+/g) ?? [];
    const subjectPositions = tokens.flatMap((token, index) => shared.has(token) ? [index] : []);
    const negationPositions = tokens.flatMap((token, index) => negationWords.has(token) ? [index] : []);
    if (!subjectPositions.length || !negationPositions.length) return false;

    // "not only" is additive wording, not a negative claim.
    const additiveNotOnly = /\bnot\s+only\b/.test(segment);
    if (additiveNotOnly && negationPositions.some((negation) =>
      tokens[negation + 1] === "only" && subjectPositions.some((subject) => Math.abs(subject - negation) <= 3),
    )) return false;

    return subjectPositions.some((subject) =>
      negationPositions.some((negation) => Math.abs(negation - subject) <= 3),
    );
  });
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
      if (a.claimType !== b.claimType) continue;
      const aTerms = terms(a.claimText);
      const bTerms = terms(b.claimText);
      const sharedTerms = [...aTerms].filter((term) => bTerms.has(term)).sort();
      const smallerSetSize = Math.min(aTerms.size, bTerms.size);
      if (smallerSetSize < 3 || sharedTerms.length / smallerSetSize < 0.6) continue;

      const aNegative = hasNegationNearSharedSubject(a.claimText, sharedTerms);
      const bNegative = hasNegationNearSharedSubject(b.claimText, sharedTerms);
      if (aNegative === bNegative) continue;
      conflicts.push({ first: a.id, second: b.id, sharedTerms });
    }
  }
  return conflicts;
}
