"use client";

import Editor from "@monaco-editor/react";

type QuestionCodeEditorProps = {
  value: string;
  language: string;
  onChange: (value: string) => void;
};

const editorLanguages: Record<string, string> = {
  Python: "python",
  JavaScript: "javascript",
  TypeScript: "typescript",
  Java: "java",
  C: "c",
  "C++": "cpp",
  "C#": "csharp",
  Go: "go",
  Rust: "rust",
  PHP: "php",
  Ruby: "ruby",
  Kotlin: "kotlin",
  Swift: "swift",
  SQL: "sql",
};

export default function QuestionCodeEditor({ value, language, onChange }: QuestionCodeEditorProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[#080d12]">
      <Editor
        height="340px"
        language={editorLanguages[language] ?? "plaintext"}
        theme="vs-dark"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        loading={<div className="flex h-[340px] items-center justify-center text-xs text-slate-400">Loading code editor…</div>}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          tabSize: 4,
          wordWrap: "on",
          padding: { top: 14, bottom: 14 },
          renderLineHighlight: "line",
          bracketPairColorization: { enabled: true },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          accessibilitySupport: "auto",
        }}
      />
    </div>
  );
}
