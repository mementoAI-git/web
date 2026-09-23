# White Page Canvas and Sticky Memory Search

## Goal

Restore pure white page canvases in light mode and prevent memory-page content from showing through the spacing above the sticky search controls while scrolling.

## Design

- Change the light-mode `--background` semantic token from the warm off-white value to `#ffffff`.
- Leave the dark-mode `--background` value unchanged.
- Continue using `bg-background` for page canvases so all pages that rely on the shared semantic token receive the corrected light-mode color consistently.
- Extend the memory page's sticky search background through its 16px sticky top offset. The search and view controls remain visually and behaviorally unchanged; only the opaque masking area grows.

## Scope

This is a presentation-layer change only. It does not alter data loading, routing, search behavior, memory filters, or backend contracts. Intentional card, control, and tinted surface colors remain unchanged unless they explicitly use the shared page-background token.

## Verification

- Add or update the memory header component test to assert that the sticky region includes the top-offset masking treatment.
- Run the focused memory header test and the relevant build or type check.
- Visually verify that light-mode page canvases are white, dark mode is unchanged, and memory cards no longer appear above or through the sticky search area during scrolling.
