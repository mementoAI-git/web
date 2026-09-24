# Add Story Collapsible Details Design

## Goal

Refine the existing desktop Add Story journal so writing remains primary: Story Details starts collapsed, opens inline on demand, and the album uses desktop viewport space more efficiently without changing the established visual design.

## Scope

- Desktop `CreateMemory` next variant only.
- Preserve the existing album artwork, scenic background, header, editor typography, toolbar, panel contents, and panel styling.
- Reuse the current shadcn `Button` and `Tabs` components and Lucide icons.
- Do not change the legacy/mobile composer or API code.

## Interaction

The details panel is session-local state initialized to `false`, so every newly opened Add Story composer begins collapsed. In the collapsed state, a quiet ghost button labeled `Story Details` sits in a narrow right rail and exposes `aria-expanded="false"` plus `aria-controls="story-details-panel"`.

Activating the trigger expands the current panel inline. The existing Story Details and Assistant tabs remain unchanged. A compact icon-only control in the panel header collapses it again. Opening moves focus to the Story Details tab; collapsing returns focus to the compact trigger.

## Layout

The body uses a two-column desktop grid in both states. The right column is a narrow control rail while collapsed and the existing panel width while expanded. The editor receives the freed space, while its prose and toolbar remain capped at the current comfortable `760px` measure.

Below `1900px`, the environment has no left gutter and the journal aligns to the viewport's left edge. At `1900px` and above, the existing centered presentation returns. Vertical padding and right-side breathing room remain intact.

## Motion

The layout transition lasts `240ms` with `cubic-bezier(0.23, 1, 0.32, 1)`. The panel content uses only opacity and horizontal transform for its reveal, preventing a visually abrupt appearance while the grid column changes. The compact trigger crossfades in the opposite direction. Reduced-motion users receive an immediate state change without spatial movement.

## Accessibility

- The compact trigger exposes `aria-expanded` and `aria-controls`.
- The expanded panel owns `id="story-details-panel"`.
- The collapse icon has an explicit accessible label.
- Focus moves into the opened panel and returns to the compact trigger after collapse.
- Existing tab keyboard behavior remains delegated to the shared Tabs primitive.

## Verification

Component tests will cover the collapsed default, opening, closing, focus transfer, ARIA linkage, and the existing tabs after expansion. The focused unit test, full unit suite, production build, lint, and a desktop browser check will verify the result.
