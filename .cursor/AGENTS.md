## Agent workflows for this repo

This file describes the main AI/agent workflows you’re expected to use **across projects** vs **specific to this repo**.

### Cross-project (generic) workflows

These do **not** depend on this repository’s particular stack or folder layout. They should be implemented as reusable, shared skills you can apply in many projects:

- **General code review**
  - Review a diff, function, or file for clarity, correctness, and maintainability.
  - Callouts on naming, structure, dead code, and potential bugs.

- **Targeted refactorings**
  - Improve or simplify an existing function/component.
  - Extract helpers or custom hooks, split large files, or remove duplication.

- **Test authoring**
  - Add or expand unit/component tests around a specific function or component.
  - Suggest test cases and edge conditions based on the code’s behavior.

- **Documentation and comments**
  - Improve README sections, API docs, and inline comments for non-obvious behavior.
  - Summarize complex modules or flows for onboarding.

- **Code exploration and explanation**
  - Explain what a file, function, or flow does in plain language.
  - Map out how data flows through layers of the app.

### Project-specific workflows (memento-web)

These **do** depend on this repo’s tech stack (React + TypeScript + Vite, Tailwind, etc.) or its conventions, and should be configured via this repository’s `.cursor` setup:

- **React + TypeScript component work**
  - Implement or modify components under `src/` using idiomatic React 18/19 patterns.
  - Respect existing state management patterns and hooks.

- **Styling and design**
  - Use Tailwind CSS utilities and existing design tokens/components.
  - Keep UX consistent with existing components and motion patterns.

- **Routing and app structure**
  - Follow this repo’s chosen routing approach (e.g. `react-router-dom`) and file layout.
  - Place new pages, layouts, and shared UI where the current structure suggests.

- **Project-specific quality checks**
  - Respect this repo’s ESLint, TypeScript, and formatting configuration.
  - Use the existing test and build scripts defined in `package.json`.

The **generic workflows** above should be captured as reusable skills in a shared location, while the **project-specific workflows** should be guided by `.cursor/rules` and any project-scoped skills you add in this repo.

