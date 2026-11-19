import { describe, expect, it } from "vitest";
import { findResumeSkillEvidence } from "@/lib/resume/skill-evidence";

describe("resume skill evidence", () => {
  it("returns original lines containing a matching alias", () => {
    const resume = ["Frontend developer", "Built accessible React components.", "Used SQL for reporting."].join(String.fromCharCode(10));
    expect(findResumeSkillEvidence(resume, ["react", "react.js"])).toEqual(["Built accessible React components."]);
  });
  it("uses token boundaries rather than matching inside unrelated words", () => {
    expect(findResumeSkillEvidence("I enjoy reacting quickly.", ["react"])).toEqual([]);
  });
  it("limits evidence lines and ignores blank lines", () => {
    const resume = ["React app", "", "React tests", "React hooks"].join(String.fromCharCode(10));
    expect(findResumeSkillEvidence(resume, ["react"], 2)).toEqual(["React app", "React tests"]);
  });
  it("returns no evidence for empty aliases or invalid limits", () => {
    expect(findResumeSkillEvidence("React developer", [])).toEqual([]);
    expect(findResumeSkillEvidence("React developer", ["react"], 0)).toEqual([]);
  });
});
