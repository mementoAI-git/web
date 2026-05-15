## Agent conventions for memento-web

This repo is a **React + TypeScript + Vite** application. Use these conventions when working with agents in this project.

### Tech stack and structure

- **Framework**: React + TypeScript with Vite.
- **Routing**: `react-router-dom` using `src/router.tsx` and page components under `src/pages/`.
- **UI**: Tailwind CSS (see `tailwindcss` and related tooling in `package.json`), shadcn-style UI building blocks, reusable components under `src/components/`, and shared utilities under `src/lib/` and `src/utility/`.
- **Icons**: See `.cursor/rules/icons.mdc` — HeroUI built-in icons when a HeroUI control provides them; otherwise default to `lucide-react`.

When adding or modifying code:

- **New pages**: Place under `src/pages/` and wire them up through `src/router.tsx` following existing patterns.
- **Shared UI**: Prefer adding reusable pieces under `src/components/` rather than duplicating logic inside pages.
- **Existing components first**: Before writing custom UI structure, prefer existing shadcn-style components already available in the project and existing shared components under `src/components/`. Only build custom markup when the existing component set genuinely does not fit the need.
- **Utilities and types**: Reuse or extend helpers in `src/lib/`, `src/utility/`, and `src/hooks/` when appropriate.

### How agents should behave in this repo

- **Follow project layout**
  - Keep new React components, hooks, and utilities consistent with existing file organization.
  - Prefer composition over deeply nested components when it improves readability.
  - Prefer composing from existing components before introducing one-off custom UI primitives.

- **Respect tooling**
  - Ensure changes are compatible with TypeScript, ESLint, and Prettier as configured in `package.json`.
  - Prefer idiomatic TypeScript types over `any`, aligning with how types are used in nearby files.

- **Leverage shared skills**
  - Use the installed global skills from `/Users/admin/.codex/skills` when a task matches them.
  - In particular, prefer the global `shadcn` skill when choosing or composing UI components, and the global `documentation-lookup` skill for version-sensitive library/framework questions.
  - Use project-specific knowledge from this rules file and the rest of `.cursor` when implementing features in this repo.

### Where to put guidance

- **Cross-project behaviors**: Capture in reusable global skills rather than repo-local skill folders.
- **Project-specific behaviors**: Extend or add rules in `.cursor/rules/` when new conventions emerge (e.g., new feature areas or patterns).
