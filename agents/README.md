## Agents in this project

This folder is the **single place to discover agents and skills** used in the `memento` web app.
Executable behavior is still configured by the underlying tools, but this folder is your index.

### Agent types and scope

- **Cross-project (generic) agents**
  - Backed by reusable skills that do not depend on this repo’s specific stack or structure.
  - Examples: general code review, refactoring a function, improving documentation, or adding tests around a specific function/component.

- **Project-specific agents**
  - Rely on rules and project-scoped skills when a task depends on this repo’s React + TypeScript + Vite setup, routing, or UI patterns.
  - Examples: adding a new dashboard page, updating routing in `src/router.tsx`, or extending Tailwind-based UI components in `src/components/`.

### Logical layout (single Agent + Skills index)

- **Agents (this folder)**
  - Use this folder as the **authoritative index** of agents/skills:
    - `.cursor/AGENTS.md`: high-level list of generic vs project-specific workflows.
    - `../skills/README.md`: human-friendly catalog of all skills available in this repo.

- **Skills (unified view)**
  - **Project-authored skills**
    - `.cursor/skills/cross-project-code-review/`
    - `.cursor/skills/component-design-system-builder/`
  - **Third-party skills installed via `skills` CLI**
    - `.agents/skills/frontend-design/`
    - `.agents/skills/code-review-excellence/`
    - `.agents/skills/accessibility-compliance/`
    - `.agents/skills/webapp-testing/`
    - `.agents/skills/typescript-advanced-types/`

The underlying directories (`.cursor/skills/` and `.agents/skills/`) are kept in place so tools continue to work,
but you can treat **`agents/` and `skills/` as your single source of truth** for discovering and organizing agents.


