export type CodeQualityFinding = {
  ruleId: string;
  severity: "info" | "low";
  title: string;
  detail: string;
  line: number;
  evidence: string;
  suggestion: string;
};

const RULES: Array<{
  id: string; severity: "info" | "low"; title: string; detail: string;
  pattern: RegExp; suggestion: string;
}> = [
  { id: "APEX-TODO", severity: "info", title: "Follow-up marker", detail: "A TODO or FIXME marker may indicate unfinished work.", pattern: /\b(?:TODO|FIXME|XXX)\b/i, suggestion: "Confirm whether the task is still relevant and track it in the project issue system." },
  { id: "APEX-DEBUGGER", severity: "low", title: "Debugger statement", detail: "A debugger statement can pause execution when developer tools are open.", pattern: /\bdebugger\s*;/, suggestion: "Remove the debugger statement before shipping if it is not intentional." },
  { id: "APEX-CONSOLE-LOG", severity: "info", title: "Console logging", detail: "Console logging may expose noisy or unintended information in production logs.", pattern: /\bconsole\.(?:log|debug)\s*\(/, suggestion: "Check whether this log is intentional and avoid logging secrets or personal data." },
  { id: "APEX-TS-IGNORE", severity: "low", title: "TypeScript suppression", detail: "A @ts-ignore comment suppresses the next line's type checking.", pattern: /@ts-ignore\b/, suggestion: "Prefer fixing the type issue or using a narrowly scoped @ts-expect-error with an explanation." },
  { id: "APEX-EMPTY-CATCH", severity: "low", title: "Empty catch block", detail: "An empty catch block can silently hide an error.", pattern: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/, suggestion: "Handle the error, add context to logging, or document why it is intentionally ignored." },
];

export function analyzeSourceText(source: string): { findings: CodeQualityFinding[]; summary: { linesScanned: number; findings: number; info: number; low: number }; methodology: string[] } {
  const lines = source.split(/\r?\n/);
  const findings: CodeQualityFinding[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        findings.push({
          ruleId: rule.id, severity: rule.severity, title: rule.title, detail: rule.detail,
          line: index + 1, evidence: trimmed.slice(0, 240), suggestion: rule.suggestion,
        });
      }
    }
    if (line.length > 180) {
      findings.push({
        ruleId: "APEX-LONG-LINE", severity: "info", title: "Long source line",
        detail: "This line exceeds 180 characters and may be harder to scan or review.",
        line: index + 1, evidence: trimmed.slice(0, 240),
        suggestion: "Consider splitting the expression or extracting a clearly named helper where it improves readability.",
      });
    }
  }
  return {
    findings: findings.slice(0, 100),
    summary: { linesScanned: lines.length, findings: findings.length, info: findings.filter((item) => item.severity === "info").length, low: findings.filter((item) => item.severity === "low").length },
    methodology: [
      "Deterministic, line-oriented pattern checks only; no code is executed.",
      "Findings are review prompts, not proof of defects or vulnerabilities.",
      "Only the selected public source file is analyzed; this is not a repository-wide audit.",
      "Patterns can miss issues and produce false positives; inspect the surrounding code.",
    ],
  };
}
