/**
 * Returns original resume lines containing a listed skill alias.
 * Lexical matching surfaces evidence for review, not proof of proficiency.
 */
export function findResumeSkillEvidence(resumeText: string, aliases: readonly string[], limit = 2): string[] {
  if (!Number.isInteger(limit) || limit < 1) return [];
  const terms = aliases.map((alias) => alias.trim().toLowerCase()).filter(Boolean);
  return resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).filter((line) => {
    const normalized = line.toLowerCase();
    return terms.some((term) => {
      const index = normalized.indexOf(term);
      if (index < 0) return false;
      const before = index === 0 ? "" : normalized[index - 1];
      const afterIndex = index + term.length;
      const after = afterIndex >= normalized.length ? "" : normalized[afterIndex];
      const wordChar = (character: string) => /[a-z0-9+#]/i.test(character);
      return (!before || !wordChar(before)) && (!after || !wordChar(after));
    });
  }).slice(0, limit);
}
