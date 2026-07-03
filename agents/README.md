# AI Config Map

This folder is the human-readable map for AI tooling in `memento-web`.

The goal is simple:
- keep reusable skills global
- keep project-specific rules local
- avoid duplicate skill trees inside the repo

## What Lives Where

### Global reusable skills

Reusable skills are installed globally in:

- `/Users/admin/.codex/skills`

Use the project index here for the current installed list:

- [global skills index](/Users/admin/Codebase/projects/Memento%20AI/.agents/skills/README.md)

These are the right place for things like:
- git / PR workflow help
- frontend design methods
- reusable testing skills
- cross-project code review skills

### Project-local config that should stay in this repo

These files are tied to `memento-web` and should remain local:

- [.cursor/AGENTS.md](/Users/admin/Codebase/projects/Memento%20AI/memento-web/.cursor/AGENTS.md)
- [.cursor/commands/check-variables.md](/Users/admin/Codebase/projects/Memento%20AI/memento-web/.cursor/commands/check-variables.md)
- [.cursor/rules/](/Users/admin/Codebase/projects/Memento%20AI/memento-web/.cursor/rules)
- `.claude/settings.local.json`

These are not generic skills. They are project-specific tool configuration.

## Cleanup Decision

We removed duplicate or empty local skill folders from:

- `memento-web/.agents/skills/`
- `memento-web/.claude/skills/`
- `memento-web/.cursor/skills/`
- `memento-web/.windsurf/skills/`
- `memento-web/.agent/skills/`
- `memento-web/.kiro/skills/`
- `memento-web/skills/`

That keeps the repo from carrying multiple half-overlapping skill systems.

## Rule of Thumb

- If it is reusable across projects, install it globally.
- If it depends on this repo’s stack, conventions, or tool wiring, keep it local.
- If it is empty, duplicated, or only there because of older experiments, remove it.
