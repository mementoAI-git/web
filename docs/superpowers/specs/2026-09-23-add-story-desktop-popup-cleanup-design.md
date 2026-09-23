# Add Story Desktop Popup Cleanup Design

## Goal

Refine the desktop Add Story composer so its attachment menu, emoji popup, and unsaved-exit confirmation inherit shadcn/Radix interaction behavior while preserving the existing mobile composer unchanged.

## Scope

- Change only the desktop `next` Add Story experience.
- Do not modify API behavior or the legacy mobile layout and confirmation flow.
- Reuse the existing upload inputs, emoji picker, draft persistence, buttons, and shadcn components.
- Preserve all previously approved journal styling except for the requested square left corners.

## Desktop interaction surfaces

### Attachments

Replace the desktop attachment `DropdownMenu` with the official shadcn `ContextMenu`. The existing plus control becomes the context-menu trigger and the existing Photos, Videos, Audio, and Documents actions remain unchanged. The menu uses native context-menu semantics: secondary click or the keyboard context-menu command opens it.

### Emoji picker

Replace the custom `createPortal` positioning with the existing shadcn `Popover` primitive. Keep the emoji-mart picker as the content. Replace the monochrome Lucide smile icon with a native yellow smiley glyph while retaining the `Insert emoji` accessible name.

### Unsaved exit

Remove the Save Draft footer from the desktop Story Details panel. When the desktop composer contains unsaved work, closing it opens an inline-composed shadcn `Dialog` with three actions:

- `Save draft and exit` persists the current draft, retains its uploaded attachment references, and force-closes the composer.
- `Discard` deletes uploaded files using the existing cleanup path and force-closes the composer.
- `Keep editing` dismisses the dialog and returns to the composer.

Empty or already-saved desktop stories close immediately. The existing `CloseWithFilesConfirmation` component remains available to the legacy mobile composer and is not modified.

## Album corners

The desktop journal shell has square top-left and bottom-left corners and keeps the existing right-side radius. The album artwork follows the same corner treatment. Mobile surfaces are unchanged.

## Accessibility and behavior

- shadcn/Radix owns focus trapping, Escape handling, dismissal, and focus restoration for the Popover, ContextMenu, and Dialog.
- The Dialog has an accessible title and description.
- The yellow emoji remains hidden from assistive technology because the button already supplies its accessible name.
- The context-menu trigger remains keyboard reachable.

## Testing

Update component tests to verify:

- the desktop attachment control exposes context-menu behavior and still invokes each upload input;
- the emoji picker opens through the shadcn Popover and the trigger displays the yellow glyph;
- the desktop panel no longer includes Save Draft;
- unsaved close offers all three choices;
- saving persists a draft before closing, discarding cleans up files, and keeping editing leaves the composer open;
- empty and already-saved stories close without prompting;
- the legacy mobile composer still renders its existing sheet and confirmation flow.
