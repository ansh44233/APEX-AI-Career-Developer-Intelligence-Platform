import { describe, expect, it } from "vitest";
import { analyzeJobDescription } from "@/lib/company-job-description";

describe("job description skill matching", () => {
  it("detects supported terms case-insensitively and links them to practice modules", () => {
    const matches = analyzeJobDescription("Build REST APIs with TypeScript, React, PostgreSQL and Docker.");
    expect(matches.map((match) => match.label)).toEqual(["TypeScript", "React", "SQL", "API design", "Docker"]);
    expect(matches.find((match) => match.label === "SQL")?.matchedTerms).toEqual(["postgresql"]);
    expect(matches.find((match) => match.label === "API design")?.practicePath).toBe("/features/system-design");
  });

  it("does not treat substrings inside unrelated words as skill matches", () => {
    const matches = analyzeJobDescription("The project uses objects, javascript-like naming, and a javaScript runtime.");
    expect(matches.map((match) => match.label)).toEqual(["JavaScript"]);
    expect(matches[0]?.matchedTerms).toEqual(["javascript"]);
  });

  it("returns no matches for empty text and caps analysis at the supported input length", () => {
    expect(analyzeJobDescription("  ")).toEqual([]);
    expect(analyzeJobDescription("x".repeat(20_000) + " Python")).toEqual([]);
    expect(analyzeJobDescription("Python")).toHaveLength(1);
  });

  it("returns one skill group even when multiple aliases are present", () => {
    const matches = analyzeJobDescription("React.js and ReactJS; SQL with MySQL and PostgreSQL.");
    expect(matches.filter((match) => match.label === "React")).toHaveLength(1);
    expect(matches.find((match) => match.label === "React")?.matchedTerms).toEqual(["react", "react.js", "reactjs"]);
    expect(matches.find((match) => match.label === "SQL")?.matchedTerms).toEqual(["postgresql", "mysql"]);
  });
});
