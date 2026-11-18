# APEX Job Description Intelligence

## Purpose

The Resume Intelligence page provides a browser-local comparison between pasted resume text and a pasted job description. It detects a limited built-in vocabulary of skill terms and suggests relevant APEX practice modules for terms not detected in the resume.

## Processing and privacy

- Both text fields are held in page state and analysed in the browser.
- The page does not submit either text field to an API, persist it to the account, or send it to an AI provider.
- Each field is capped at 20,000 characters in the UI.
- No resume file or PDF parsing is performed.

## Matching method

- The page checks 23 predefined skill categories and their listed aliases.
- Matching uses case-insensitive term boundaries to reduce accidental substring matches.
- A requirement is marked as detected in the resume only when one of its known terms appears in the resume text.
- A requirement not detected is a possible wording gap, not proof that the person lacks the skill.
- The page reports basic resume word and bullet-line counts.

## Preparation suggestions

Terms not detected in the resume are paired with a relevant APEX module and a short practice suggestion. The suggestions are deterministic and do not create or change saved roadmap tasks.

## Limitations

- The vocabulary is intentionally small and cannot understand context, infer equivalent wording reliably, or extract every requirement from arbitrary prose.
- A detected keyword does not verify experience, depth, or proficiency.
- The tool does not produce an ATS score, hiring prediction, AI review, semantic analysis, PDF parsing, or saved resume version.
- Users should review the complete job description and only include truthful skills and experience in their resume.

## Future direction

A later version could add user-reviewed requirement extraction, goal-specific roadmap integration, and optional AI analysis with explicit consent and clear retention controls. Those capabilities are not part of this implementation.