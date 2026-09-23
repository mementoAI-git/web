# Add Story Desktop Toolbar State Design

## Scope

Refine only the desktop Add Story editor. Mobile rendering and API behavior remain unchanged.

## Attachment Menu

The plus button uses the existing shadcn `DropdownMenu` because the expected interaction is a normal primary click. The menu continues to expose Photos, Videos, Audio, and Documents and closes with Escape without closing the editor.

## Formatting Controls

Bold, italic, strikethrough, underline, insert link, and bullet list use individual shadcn `Toggle` components. Individual toggles are appropriate because multiple inline marks can be active at the same time, while link and bullet list retain their existing editor commands.

Each control preserves the editor selection on pointer down, has an accessible label, and exposes its current state through `aria-pressed` and the shadcn active-state styling.

The toolbar subscribes to Tiptap transaction and selection state through `useEditorState`. Active indicators therefore update immediately when a command runs or the cursor moves into differently formatted content, without depending on unrelated form renders.

The link toggle appears active while the current selection has a link mark or while the existing link input is open. The list control remains a single bulleted-list toggle.

## Unsaved Exit Dialog

The existing desktop-only shadcn `Dialog` remains responsible for Save draft and exit, Discard, and Keep editing. Its overlay and content receive explicit stacking classes above the full-screen Add Story modal (`z-100`).

The shared shadcn dialog wrapper gains an optional `overlayClassName` prop so this instance can raise its overlay without changing the stacking of unrelated dialogs. The Add Story confirmation uses an overlay above the editor and content above that overlay.

## Testing

Component tests cover:

- opening the attachment menu with a normal click;
- shadcn toggle semantics and pressed states for the six formatting controls;
- active-state changes sourced from editor state rather than incidental parent renders;
- the desktop unsaved-exit dialog overlay and content stacking above the editor;
- unchanged mobile rendering.

The focused component tests, full unit suite, production build, lint, and desktop browser behavior will be verified before handoff.
