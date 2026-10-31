# Memento Web Agent Guidelines

Read the project conventions and applicable rules in `.cursor/rules/` before implementation. Global skills live in `/Users/admin/.codex/skills`.

## Verify the running product before reporting completion

- Always inspect the implementation against every part of the user's request before reporting it as done.
- For UI changes, open the actual running app, refresh/reload it from this checkout, and visually verify the requested layout and interaction states. Passing source checks, tests, typecheck, or lint alone is not visual verification.
- Confirm the development server is serving the edited checkout and the device/browser has received the latest bundle. If the user reports no visible change, investigate the running app and server connection first.
- Fix any mismatch found during verification. Report only what was actually verified; if a check is blocked, state the concrete blocker and do not claim the affected requirement is complete.
