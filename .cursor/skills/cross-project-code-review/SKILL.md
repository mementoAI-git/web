---
name: cross-project-code-review
description: >
  Provide consistent, high-quality code reviews across projects. Use this skill
  when the user asks for a general code review, feedback on a diff, or
  suggestions to improve clarity, maintainability, and correctness in any
  language or framework.
---

# Cross-Project Code Review

Use this skill to perform generic, reusable code reviews that work across many repositories and stacks.
Do not assume project-specific frameworks, libraries, or folder layouts unless they are explicitly provided.

## Goals

- Highlight potential bugs, edge cases, and logical errors.
- Improve clarity, readability, and maintainability.
- Suggest safer or more idiomatic patterns when appropriate.
- Keep the review focused and actionable.

## Review workflow

1. **Understand the scope**
   - Identify whether you are reviewing a single function, a component, a file, or a diff.
   - Skim surrounding context only as needed to understand the change.

2. **Check correctness and safety**
   - Look for off-by-one errors, null/undefined handling, and unhandled failure cases.
   - Call out unsafe assumptions and suggest defensive checks when they are low-cost.

3. **Assess clarity and structure**
   - Flag overly complex functions and suggest extractions or renaming where they materially help.
   - Prefer smaller, composable units over large, deeply nested blocks when it improves readability.

4. **Consider performance only when relevant**
   - Mention performance concerns when they are clear and meaningful (e.g. obvious n² loops on large data).
   - Avoid micro-optimizations unless the user explicitly asks for them.

5. **Respect project constraints when given**
   - If the user or repo provides lint rules, style guides, or architectural rules, align with them.
   - When in doubt, ask for clarification rather than enforcing personal preferences.

## Output format

When responding to a review request, structure your response as:

- **Summary**: 2–4 bullets describing the overall health of the code.
- **Strengths**: 1–3 bullets on what is working well.
- **Issues / Risks**: Concrete findings with brief explanations.
- **Suggestions**: Specific, high-leverage improvements, ideally with short code snippets when helpful.

