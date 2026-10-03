# Story View Composer Design

## Goal

Replace only the panel opened when a user selects a story with a full-size story canvas based on the current desktop Add Story experience. The canvas opens in read-only mode and can switch in place to editing mode.

## Scope

- Change the `view-memory` experience only.
- Preserve existing story-card behavior, creation flows, API contracts, permissions, and unrelated modals.
- Reuse existing Add Story components and visual conventions instead of copying its complete implementation.
- Keep the existing story fetch, recent-memory tracking, bookmark, share, and overflow actions where they remain applicable.
- Use the existing story update endpoint and attachment/access/tag behavior for saves.

## Architecture

Extract the reusable desktop story-canvas structure and presentation from Add Story into focused shared components. Creation and story viewing will provide their own state and actions to that shared presentation.

The story viewer owns a small mode state:

- `view`: render the selected story in the Add Story canvas with non-editable title, body, media, and details.
- `edit`: render the same canvas with the existing title, rich-text, attachment, visibility, access, and tags controls enabled.
- `saving`: keep the editing surface stable, disable duplicate submission, and show the normal saving feedback.

The viewer must not initialize creation-only behavior such as drafts, new-story submission, or creation assistant state while it is read-only.

## User Flow

1. Selecting a story opens the full-size story canvas in read-only mode.
2. The canvas loads the latest story data and presents its title, content, attachments, metadata, sharing state, and tags.
3. Selecting **Edit** changes that same canvas into editing mode without opening another modal.
4. Selecting **Save changes** updates the story through the existing API, refreshes cached story data, and returns the canvas to read-only mode with the saved values.
5. Selecting **Cancel** while editing discards the unsaved working copy and returns to read-only mode.
6. Selecting **Close** while viewing dismisses the story canvas.

If the user attempts to close or leave editing with unsaved changes, the product's established unsaved-change confirmation convention applies. Keyboard dismissal, focus restoration, disabled/loading states, and error toasts follow existing product conventions.

## Responsive Behavior

Desktop uses the reused full-size Add Story canvas. Mobile retains the repository's established modal/sheet conventions while exposing the same read-only-to-edit state transition. The implementation must not regress current mobile story access.

## Error and Empty States

- While story data is loading, show a canvas-aligned loading state.
- If the story cannot be loaded, keep the canvas dismissible and show the standard recoverable error treatment.
- A failed save leaves the user in editing mode with their working copy intact and shows standard error feedback.
- Missing optional metadata or attachments renders as an empty section rather than a broken control.

## Accessibility

- Use semantic buttons and accessible names for Edit, Save changes, Cancel, Close, share, bookmark, and overflow actions.
- Move focus predictably when entering or leaving editing and restore focus when the canvas closes.
- Preserve keyboard access to rich-text and story-detail controls.
- Keep read-only content selectable and links usable without making the content editor focusable.

## Testing

Component tests will verify:

- the viewer opens in read-only mode with fetched story content;
- Edit changes the same surface into editing mode;
- Cancel restores the original values and returns to read-only mode;
- Save sends the expected update, prevents duplicate submission, refreshes displayed data, and returns to read-only mode;
- failed saves preserve the working copy and editing state;
- unsaved changes receive the standard close/cancel protection;
- existing share, bookmark, overflow, and close actions remain available as appropriate.

Run the focused component tests, changed-file ESLint checks, the repository variable-validation workflow, and the production build before completion.
