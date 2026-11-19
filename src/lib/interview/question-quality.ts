export type InterviewQuestionQualityInput = {
  title: string;
  prompt: string;
  followUp: string;
  rubric: string[];
};

/**
 * Accept only complete, non-duplicated interview prompts.
 * Fingerprints intentionally normalize punctuation and whitespace so trivial
 * formatting changes do not bypass duplicate detection.
 */
export function hasValidInterviewQuestionSet(
  questions: readonly InterviewQuestionQualityInput[],
): boolean {
  if (questions.length === 0) return false;

  const fingerprints = questions.map((question) =>
    question.prompt.toLowerCase().replace(/\W/g, "").slice(0, 140),
  );

  return (
    questions.every(
      (question) =>
        question.title.trim().length > 0 &&
        question.prompt.trim().length >= 40 &&
        question.followUp.trim().length > 0 &&
        question.rubric.filter((item) => item.trim().length > 0).length >= 2,
    ) && new Set(fingerprints).size === fingerprints.length
  );
}
