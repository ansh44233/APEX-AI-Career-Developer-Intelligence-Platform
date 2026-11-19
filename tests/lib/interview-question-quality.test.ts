import { describe, expect, it } from "vitest";
import { hasValidInterviewQuestionSet, type InterviewQuestionQualityInput } from "@/lib/interview/question-quality";

const completeQuestion = (overrides: Partial<InterviewQuestionQualityInput> = {}): InterviewQuestionQualityInput => ({
  title: "Explain a caching strategy",
  prompt: "Describe how you would design a caching strategy for a high-traffic application and explain the trade-offs.",
  followUp: "How would you invalidate stale entries?",
  rubric: ["Explains cache choices", "Discusses invalidation and consistency"],
  ...overrides,
});

describe("interview question quality validation", () => {
  it("accepts a complete original question set", () => {
    expect(hasValidInterviewQuestionSet([completeQuestion()])).toBe(true);
  });

  it("rejects an empty set", () => {
    expect(hasValidInterviewQuestionSet([])).toBe(false);
  });

  it("rejects missing titles, short prompts, follow-ups, or rubric criteria", () => {
    expect(hasValidInterviewQuestionSet([completeQuestion({ title: " " })])).toBe(false);
    expect(hasValidInterviewQuestionSet([completeQuestion({ prompt: "Too short." })])).toBe(false);
    expect(hasValidInterviewQuestionSet([completeQuestion({ followUp: "" })])).toBe(false);
    expect(hasValidInterviewQuestionSet([completeQuestion({ rubric: ["Only one criterion"] })])).toBe(false);
  });

  it("rejects duplicate prompts despite punctuation and spacing changes", () => {
    const first = completeQuestion();
    const duplicate = completeQuestion({
      title: "Another title",
      prompt: "Describe how you would design a caching strategy for a high traffic application and explain the trade offs",
    });
    expect(hasValidInterviewQuestionSet([first, duplicate])).toBe(false);
  });

  it("accepts distinct prompts in the same set", () => {
    const second = completeQuestion({
      title: "Explain database indexing",
      prompt: "Explain how database indexes improve read performance and describe their costs for writes and storage.",
    });
    expect(hasValidInterviewQuestionSet([completeQuestion(), second])).toBe(true);
  });
});
