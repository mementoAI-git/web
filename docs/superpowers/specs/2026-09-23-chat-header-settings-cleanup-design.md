# Chat Header and Settings Drawer Cleanup

## Goal

Simplify the conversation chrome without introducing a new visual pattern. Keep search available, make Voice mode a primary conversation-header action, and consolidate memory information and chat preferences into one right-hand Settings drawer.

## Header behavior

- Keep the existing Search action and behavior unchanged.
- Remove the Share conversation action from the conversation header.
- Put the existing Voice mode action in the former Share position.
- The Voice mode action navigates to `/chat/:id/voice`, matching the behavior and accessible naming already used by the chat input.
- Remove the separate Info/memory-sidebar action from the conversation header.
- Keep the existing Settings action as the only trigger for the right-hand drawer.

## Unified Settings drawer

- The Settings action opens the existing inline right-hand conversation drawer.
- The drawer uses one continuous scroll surface, not tabs.
- Present the current memory information first: enrichment status when available, memory actions, properties, and stats.
- Present existing chat preferences after the memory information: plan upgrade, background music, and voice selection.
- Reuse the existing `SidebarDetails`, `MemorySections`, `ChatPreferencesPanel`, shadcn `Button`, `Badge`, and `Separator` implementations.
- Preserve the current mobile sheet behavior and desktop inline drawer behavior.
- Keep existing semantic V3 design tokens and the current Memento styling. No new colors, typography, dependencies, backend behavior, or API contracts are introduced.

## State and data flow

- Conversation chrome exposes a Voice mode target/action instead of the Share header action.
- The Settings callback opens the existing sidebar in its unified configuration.
- Info-only and chat-only drawer entry paths are removed from the conversation header.
- Existing memory modal actions, export, edit, delete, tagging, enrichment data, and chat preference controls keep their current callbacks and data sources.

## Accessibility and interaction

- The Voice mode control is a semantic link with the accessible name `Voice mode`.
- The Settings control retains its accessible name and keyboard behavior.
- Existing drawer dismissal, focus behavior, and mobile sheet gestures remain unchanged.
- No additional animation is introduced; the existing drawer transition remains the sole spatial transition.

## Verification

- Update dashboard-header tests to verify Search remains, Share and Info are absent, Voice mode links to `/chat/:id/voice`, and Settings remains available.
- Update sidebar tests to verify one unified drawer renders both memory information and chat preference content.
- Update conversation tests where needed to verify Settings opens the unified drawer.
- Run the focused unit tests, variable validation workflow, lint, and production build.

## Out of scope

- Search redesign or removal.
- Changes to voice-call functionality or subscription gating.
- Changes to share functionality outside the removed header shortcut.
- Backend, API, database, authentication, or billing changes.
