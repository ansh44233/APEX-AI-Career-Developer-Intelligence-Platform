# APEX Company-Specific Preparation Intelligence

## Purpose

The Company Intelligence page combines a selected illustrative company profile, a user-entered target role, and a pasted job description into a preparation brief.

## Current behaviour

- Company profiles are fixed examples for Google, Microsoft and Amazon.
- Users can enter a target role, paste a job description and add private research notes.
- The page detects terms from a built-in vocabulary of 23 skill categories using case-insensitive term-boundary matching.
- Detected terms are paired with deterministic preparation suggestions and links to APEX practice modules.
- The user can copy a brief containing the selected company, role, illustrative themes, detected terms and notes.

## Privacy

- Job description and research note values remain in client-side page state.
- The page does not submit them to an API or persist them to the user's account.
- The job description field is capped at 20,000 characters; research notes at 5,000 characters.
- Copying the brief explicitly writes the composed text to the user's clipboard.

## Limitations

- Company themes are illustrative static examples, not verified hiring practices or role requirements.
- No live vacancies, company career pages, interview loops or market data are fetched.
- Skill detection is limited phrase matching. It can miss synonyms and context, and detected terms do not verify proficiency.
- This feature does not generate an ATS score, hiring prediction or AI analysis.
- Users should verify all requirements against the official job listing and current company sources.

## Future direction

Potential future work includes official-source research with citations, user-reviewed requirement extraction, comparison against a selected career goal, and optional AI analysis with explicit consent and retention controls. These capabilities are not implemented here.