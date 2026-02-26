## Agent conventions for memento-web

This repo is a **React + TypeScript + Vite** application. Use these conventions when working with agents in this project.

### Tech stack and structure

- **Framework**: React + TypeScript with Vite.
- **Routing**: `react-router-dom` using `src/router.tsx` and page components under `src/pages/`.
- **UI**: Tailwind CSS (see `tailwindcss` and related tooling in `package.json`), custom components under `src/components/`, and shared utilities under `src/lib/` and `src/utility/`.

When adding or modifying code:

- **New pages**: Place under `src/pages/` and wire them up through `src/router.tsx` following existing patterns.
- **Shared UI**: Prefer adding reusable pieces under `src/components/` rather than duplicating logic inside pages.
- **Utilities and types**: Reuse or extend helpers in `src/lib/`, `src/utility/`, and `src/hooks/` when appropriate.

### How agents should behave in this repo

- **Follow project layout**
  - Keep new React components, hooks, and utilities consistent with existing file organization.
  - Prefer composition over deeply nested components when it improves readability.

- **Respect tooling**
  - Ensure changes are compatible with TypeScript, ESLint, and Prettier as configured in `package.json`.
  - Prefer idiomatic TypeScript types over `any`, aligning with how types are used in nearby files.

- **Leverage shared skills**
  - Use the cross-project code review skill (`.cursor/skills/cross-project-code-review/`) for generic review tasks.
  - Use project-specific knowledge from this rules file and the rest of `.cursor` when implementing features in this repo.

### Where to put guidance

- **Cross-project behaviors**: Capture in reusable skills under `.cursor/skills/` that do not assume this repo’s structure.
- **Project-specific behaviors**: Extend or add rules in `.cursor/rules/` when new conventions emerge (e.g., new feature areas or patterns).

