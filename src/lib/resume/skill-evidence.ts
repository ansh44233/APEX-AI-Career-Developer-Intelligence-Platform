/** Returns original resume lines containing a listed skill alias. */
export function findResumeSkillEvidence(resumeText: string, aliases: readonly string[], limit = 2): string[] {
  if (!Number.isInteger(limit) || limit < 1) return [];
  const terms = aliases.map((alias) => alias.trim().toLowerCase()).filter(Boolean);
  return resumeText.split(String.fromCharCode(10)).map((line) => line.trim()).filter(Boolean).filter((line) => {
    const normalized = line.toLowerCase();
    return terms.some((term) => {
      let index = normalized.indexOf(term);
      while (index >= 0) {
        const before = index === 0 ? "" : normalized[index - 1];
        const afterIndex = index + term.length;
        const after = afterIndex >= normalized.length ? "" : normalized[afterIndex];
        const boundary = (value: string) => !value || !/[a-z0-9+#]/i.test(value);
        if (boundary(before) && boundary(after)) return true;
        index = normalized.indexOf(term, index + 1);
      }
      return false;
    });
  }).slice(0, limit);
}
