# Add Story Desktop Redesign

## Objective

Rebuild the desktop Add Story composer so it closely matches the supplied journal reference: a warm, calm, editorial writing surface presented as a physical memory album. Preserve the existing Add Memory behavior and reuse its current editor, property controls, upload flows, assistant, draft handling, and publishing logic.

## Scope

This change is limited to the `memento-web` repository and the desktop `variant="next"` branch of `CreateMemoryBase`.

The following are explicitly out of scope:

- The `api` repository and all API contracts or server behavior.
- The mobile and legacy Add Memory branches.
- Database, authentication, routing, and unrelated component refactors.
- New dependencies or a second icon library.

Desktop responsiveness covers large desktop, compact desktop, and tablet-sized landscape widths. It must not modify or replace the existing mobile flow.

## Visual Direction

The interface should feel like writing inside a physical journal rather than completing a software form. The editor remains visually dominant; settings and enhancement tools are secondary.

The visual hierarchy follows the supplied screenshot first, the supplied album asset second, and the written build prompt third.

### Environment

- Fill the desktop modal viewport with the existing scenic `src/assets/image/bg/1.png` artwork.
- Use cover positioning and a restrained dark or warm overlay so the journal remains the focal surface.
- Do not add decorative effects that compete with the writing experience.

### Journal shell

- Use `src/assets/image/HD Album story bg memento.png` as the complete journal surface so its leather edge, metal rings, paper texture, and rounded upper-right corner remain coherent.
- Present the shell as a large inset surface centered within the viewport, with a maximum width close to the reference and a height based on the available viewport.
- The asset is decorative and must not receive pointer events.
- Position all interactive content over the paper region, clear of the rings.

### Content layout

- Place a header across the usable paper region.
- Below the header, use a dominant flexible writing column and a restrained Story Details panel of roughly 280–300px.
- Keep generous whitespace between the binder, editor, and property panel.
- At compact desktop/tablet widths, reduce the binder clearance, gaps, and sidebar width without changing the mobile branch.

## Interface Regions

### Header

The left side shows the existing formatted story date with a calendar icon. The right side contains a quiet save-state label, Preview, Publish, and Close.

- Preview uses the existing Button component with an outline treatment.
- Publish uses the existing warm orange primary action and existing submit state.
- Close uses the existing ghost icon button and existing close/confirmation behavior.
- Existing Draft access remains available as a quiet ghost/text action in the header before the save-state and primary actions.

### Editor

- Keep the existing Tiptap editor, slash commands, links, attachment rendering, and form state.
- Restyle the title as a large italic Garamond editorial prompt: `Give this story a title...`.
- Restyle the editor body as a borderless writing surface with the prompt `Write story here...`.
- Remove the current bordered editor card appearance. The album paper itself is the editor surface.
- Retain comfortable line length, scrolling, and attachment presentation.

### Formatting toolbar

- Recompose the existing upload, emoji, recording, and formatting controls inside a compact floating warm-neutral toolbar near the bottom of the writing column.
- Continue using the existing Button, DropdownMenu, Separator, and editor commands.
- Keep icon-only controls accessible with labels or tooltips.
- Retain active formatting feedback without bright color.

### Story Details panel

- Place the current `AccessField`, `TagsField`, Story Quality, Story Overview, and Assistant content inside a subtle bordered paper-adjacent panel.
- Use the existing tab state and assistant components. Do not rebuild their functionality.
- Rename the visible desktop tab from `Properties` to `Story Details`.
- Replace the circular Story Quality score presentation with the requested quiet five-row checklist while retaining the existing `qualityChecks` calculations.
- Keep Story Overview as an unboxed metadata list driven by the existing attachment and reading-time counts.

## Existing Behavior to Preserve

- Title and body editing.
- Tiptap formatting and slash commands.
- Emoji insertion and link editing.
- Photo, video, audio, and document uploads.
- Audio and video recording.
- Attachment previews and removal.
- Sharing/visibility controls and beneficiary selection.
- Manual tags and autotagging.
- Assistant and coming-soon states.
- Draft save/load behavior.
- Subscription and upload-gate feedback.
- Close confirmation behavior.
- Publish validation, loading state, submission, and success flow.

No new autosave or preview backend behavior will be invented. Existing functionality is preserved; unavailable actions keep their current feedback.

## Component Strategy

Recompose the existing desktop JSX in `src/components/modal/memory/create/index.tsx`. Reuse all existing domain components and shadcn primitives before adding markup.

In particular, reuse:

- `AccessField`
- `TagsField`
- `CreateMemoryAssistantPanel`
- `CreateMemoryAssistantComingSoonPanel`
- `EditorContent`
- `FileThumbnails`
- Existing Button, Card, Dialog, DropdownMenu, Separator, and related primitives

Small local render helpers are acceptable where they reduce repetition, but the work must not create duplicate replacements for existing Add Memory components.

## Motion

Motion is restrained and functional.

- One subtle journal entrance may use opacity and a small translate or scale change.
- Tabs and conditional panel content may crossfade quickly to prevent abrupt swaps.
- Pressable controls use subtle active scale feedback.
- Dropdown/popover motion must originate from the trigger when supported by the existing primitive.
- Interaction feedback remains below 300ms and uses strong ease-out curves.
- Do not animate editor typing, keyboard formatting actions, or frequently repeated writing behavior.
- Respect `prefers-reduced-motion` by removing spatial movement while preserving useful opacity/color feedback.

## Accessibility

- Preserve semantic buttons and form labels.
- Provide accessible names for icon-only controls.
- Maintain keyboard access to editor tools, menus, tabs, and close actions.
- Retain visible focus treatment that harmonizes with the warm palette.
- Keep text and control contrast at WCAG AA where applicable.
- Mark the album artwork decorative.

## Responsive Rules

- Large desktop (1280px and wider): full album composition with a 285–300px details panel.
- Compact desktop/tablet landscape (1024–1279px): reduce shell margins, binder clearance, gaps, and details-panel width to approximately 250–270px while keeping the editor dominant.
- Keep the details panel inline throughout the supported desktop range; do not introduce a new drawer or change the mobile branch.
- The existing `isMobile && variant === "legacy"` and `variant === "legacy"` render paths remain unchanged.

## Error and Loading States

- Keep existing toast and upload-gate behavior.
- Preserve current disabled/loading behavior for publishing and uploads.
- Keep close confirmation for unsaved or attached content as currently implemented.
- Avoid adding decorative loading states that obscure the editor.

## Verification

- Add or update focused component tests for the desktop composition and critical preserved interactions.
- Confirm the legacy/mobile render paths remain unchanged.
- Run the relevant Vitest suite, TypeScript/build checks, and lint where practical.
- Inspect the running desktop interface at wide and compact desktop widths.
- Verify toolbar menus, tabs, uploads, title/body editing, draft access, close behavior, and publish state.
- Verify reduced-motion behavior and keyboard focus.

## Acceptance Criteria

- The desktop Add Story page closely matches the supplied screenshot in composition, proportion, hierarchy, and warmth.
- The supplied HD album image is used directly as the journal surface.
- Existing Add Memory components and behavior are reused rather than duplicated.
- The editor is the dominant visual region and does not resemble a bordered form.
- The properties sidebar appears as the requested Story Details/Assistant panel.
- Desktop layout adapts cleanly at narrower supported widths.
- No API files or mobile/legacy Add Memory code are changed.
- Existing critical behavior remains functional and the relevant verification passes.
