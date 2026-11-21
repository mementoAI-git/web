# Memento Web Agent Guidelines

Read the project conventions and applicable rules in `.cursor/rules/` before implementation. Global skills live in `/Users/admin/.codex/skills`.

## Keep components theme adaptive

When a component is built or reused, ensure it is visible across all themes (light sky, light, dark, deep sky, and system). See `.cursor/rules/theme-adaptive-components.mdc`.

## Use the shared modal layout

Prefer `FormDialog` from `src/components/modal/form-dialog.tsx` when building modals. New desktop modals use one of two sizes: Modal A (358×480, Invite Friends) or Modal B (432 wide, Share Post). New mobile bottom sheets use the Publish post sheet's sizing (full width, 524 minimum height, `92dvh` maximum). See `.cursor/rules/modal-layout.mdc`.

## Verify the running product before reporting completion

- Always inspect the implementation against every part of the user's request before reporting it as done.
- For UI changes, open the actual running app, refresh/reload it from this checkout, and visually verify the requested layout and interaction states. Passing source checks, tests, typecheck, or lint alone is not visual verification.
- Confirm the development server is serving the edited checkout and the device/browser has received the latest bundle. If the user reports no visible change, investigate the running app and server connection first.
- Fix any mismatch found during verification. Report only what was actually verified; if a check is blocked, state the concrete blocker and do not claim the affected requirement is complete.

## Use Memento's product language

In all user-facing copy, call the AI "your Memento" (for example "Talk to your Memento"); it doubles as the user's digital mind. Never call it an "AI twin" or "digital twin". Say "people" and "connection" for the people a user invites, never "beneficiary". Internal code names such as `beneficiary` routes and types may stay. Memento has launched with open signup, so don't describe it as a private beta.
