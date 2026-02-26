## Skills catalog for this project

This folder is a **single index of all skills** available to agents in the `memento` web app.
The actual skill implementations live in tool-specific directories, but this file lists them all in one place.

### Project-authored skills (`.cursor/skills/`)

These skills are created and maintained in this repo and can often be reused across projects:

- **`cross-project-code-review`**
  - Path: `.cursor/skills/cross-project-code-review/SKILL.md`
  - Purpose: Provide consistent, high-quality code reviews across languages and frameworks.

- **`component-design-system-builder`**
  - Path: `.cursor/skills/component-design-system-builder/SKILL.md`
  - Purpose: Design, implement, and review React components that adopt this project’s existing design system.

### Third-party skills installed via `skills` CLI (`.agents/skills/`)

These are external skills installed with `npx skills add ...` and are wired up for Cursor and other agents:

- **`frontend-design`**
  - Path: `.agents/skills/frontend-design/SKILL.md`
  - Source: `https://github.com/anthropics/skills`
  - Focus: High-quality frontend design workflows.

- **`code-review-excellence`**
  - Path: `.agents/skills/code-review-excellence/SKILL.md`
  - Source: `https://github.com/wshobson/agents`
  - Focus: Deep, structured code reviews with an emphasis on best practices.

- **`accessibility-compliance`**
  - Path: `.agents/skills/accessibility-compliance/SKILL.md`
  - Source: `https://github.com/wshobson/agents`
  - Focus: Ensuring UI changes follow accessibility and WCAG guidance.

- **`webapp-testing`**
  - Path: `.agents/skills/webapp-testing/SKILL.md`
  - Source: `https://github.com/anthropics/skills`
  - Focus: Automated and semi-automated web app testing workflows.

- **`typescript-advanced-types`**
  - Path: `.agents/skills/typescript-advanced-types/SKILL.md`
  - Source: `https://github.com/wshobson/agents`
  - Focus: Working with advanced TypeScript type patterns and refactors.

When adding new skills:

- Put project-authored skills under `.cursor/skills/` and add entries here.
- Install third-party skills with the `skills` CLI and then document them here for discoverability.

