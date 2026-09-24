# Text Story Card Ratio and Palette Design

## Goal

Make text-only story cards with substantial body content use the grid's tallest media-card proportion, while reducing text-card surfaces to four approved theme-aware colors.

## Scope

This change is limited to text-only cards in the stories grid. Media cards, list views, API data, story detail views, and backend behavior remain unchanged.

## Card sizing

- Only the rendered story body determines whether a card is tall. The title and tags do not contribute to the threshold.
- Measure the body at the card's current rendered width.
- When the body occupies at least five rendered lines, the text card uses a `3:4` width-to-height ratio.
- Shorter text cards retain the existing compact sizing behavior.
- Recalculate when the card width or body content changes so the result remains correct across responsive layouts.
- Keep existing overflow protection and body clamping so long content cannot escape the fixed card frame.

## Color palette

Assign one of four surfaces deterministically from the story's stable seed. A story keeps the same palette entry between renders while the set remains visually varied.

| Surface | Light mode | Dark mode |
| --- | --- | --- |
| Orange | `#F7A21A` at 20% | `#F7A21A` at 20% |
| Blue | `#1A80F7` at 20% | `#1A80F7` at 20% |
| Lime | `#C7F71A` at 20% | `#C7F71A` at 20% |
| Neutral | `#0F0700` at 4% | `#FFFFFF` at 6% |

Existing neutral borders and readable theme text colors remain in place. No gradients are introduced.

## Implementation boundary

The grid card component owns both behaviors. A small body-line measurement hook or helper observes the body element and exposes whether it meets the five-line threshold. Palette selection reuses the existing stable story hash and maps it to literal light/dark Tailwind surface classes.

## Verification

- A body measuring fewer than five lines stays compact.
- A body measuring five or more lines receives the `3:4` aspect class.
- Title wrapping does not affect the result.
- The palette has exactly four stable choices with the specified light and dark opacity values.
- Existing media-card ratios, captions, menus, tags, and story-opening behavior remain unchanged.
- Focused component tests and the production build pass.
