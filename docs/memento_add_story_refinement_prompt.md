# Memento Add Story — Refinement Pass

Update the existing **Memento Add Story page**. Do not redesign or rebuild the page from scratch.

I will provide a **reference screenshot** showing the intended default state and responsive positioning. Use that screenshot alongside the existing implementation.

The current implementation already looks very good. Preserve the existing visual direction and make only the changes described below.

---

## Important: Preserve the Current Design

Do **not** change the following:

- the current scenic background image
- the album / binder artwork
- the overall cream journal surface
- the writing canvas
- the story title/body typography
- the formatting toolbar
- the date placement
- the `Drafts` placement in the top navigation
- `Draft saved` / autosave treatment
- Preview button
- Publish Story button
- close button
- the existing Story Details panel contents and styling
- the overall warm editorial aesthetic

The current background image is correct and should remain exactly as it is.

The current `Drafts` placement is also correct and should remain in the header.

This is a refinement task, not a redesign.

---

# 1. Story Details Panel — Default Collapsed State

The biggest change is the default behavior of the right-side **Story Details / Properties panel**.

Currently the Story Details panel is open by default.

Change this so that:

**The panel is collapsed by default.**

When collapsed, the editor should gain the horizontal space previously occupied by the panel.

On the right side of the writing canvas, show a compact trigger:

`Story Details`

Use the supplied screenshot as the exact visual reference for its placement.

Suggested structure:

```tsx
<Button
  variant="ghost"
  onClick={() => setDetailsOpen(true)}
  className="..."
>
  <ListFilterIcon />
  Story Details
</Button>
```

Use an appropriate existing Lucide icon such as:

- `ListFilter`
- `PanelRight`
- `SlidersHorizontal`

Choose whichever most closely matches the supplied reference screenshot.

Do not make this look like a large CTA.

It should feel like a quiet secondary control.

---

# 2. Opening the Story Details Panel

When the user clicks `Story Details`, animate the existing panel into view.

Do **not** create a modal, dialog, popover, or overlay.

The panel should open **inline as part of the journal layout**, exactly like the Story Details panel that is already implemented.

When open:

```text
Writing canvas | Story Details panel
```

When closed:

```text
Expanded writing canvas | Story Details trigger
```

The Story Details content itself is already built. Reuse that existing component.

Do not duplicate the component or create a second implementation.

---

# 3. Panel Animation

The transition between collapsed and expanded states should feel subtle and polished.

Use a short animation around:

`200–300ms`

Suggested easing:

```css
ease-out
```

Animate a combination of:

- panel width
- opacity
- transform

For example:

### Closed

```css
width: 0;
opacity: 0;
transform: translateX(16px);
```

### Open

```css
width: 285px;
opacity: 1;
transform: translateX(0);
```

The writing canvas should smoothly expand or contract at the same time.

Avoid abrupt layout jumps.

Do not use overly elastic or playful animation.

The motion should feel quiet and premium.

---

# 4. Closing the Panel

When the Story Details panel is open, provide a clear but subtle way to collapse it again.

Prefer one of these approaches:

- clicking the active `Story Details` control again
- a small panel-collapse icon near the panel header

Avoid adding a large close button inside the panel.

Closing the panel should return the interface to the collapsed state shown in the reference screenshot.

---

# 5. Default Page State

On first load, the page should look like the supplied **collapsed-state screenshot**:

- writing canvas occupies most of the journal
- no Story Details panel visible
- `Story Details` appears as a small control on the right
- formatting toolbar remains aligned to the writing area
- header remains unchanged
- Drafts remains visible in the top navigation

This is the **default Add Story state**.

The goal is to prioritize writing and keep settings secondary.

---

# 6. Responsive Album Positioning

There is an important responsive behavior for the overall journal container.

Use the supplied screenshot as the visual reference.

## Viewports below 1900px wide

For screens with:

```css
width < 1900px
```

the **left edge of the album/journal must sit flush against the left edge of the viewport**.

There should be:

```css
left: 0;
```

and no visible gap between the browser edge and the leather album edge.

Visually:

```text
VIEWPORT
|ALBUM BINDING------------------------------|
^
flush with screen edge
```

The right side may retain breathing room.

This is important because the physical binder occupies a significant amount of horizontal space. On smaller desktop displays, centering the entire journal wastes useful editor space.

---

# 7. Large-Screen Album Positioning

For screens:

```css
width >= 1900px
```

keep the existing centered presentation.

The journal should remain centered horizontally with whitespace around it, exactly as it behaves in the current implementation.

Conceptually:

```css
@media (min-width: 1900px) {
  .journal-shell {
    margin-inline: auto;
  }
}
```

Below that breakpoint:

```css
@media (max-width: 1899px) {
  .journal-shell {
    margin-left: 0;
    margin-right: auto;
  }
}
```

Do not blindly use these exact CSS rules if they conflict with the existing layout system. Implement the equivalent behavior using the existing Tailwind/container conventions.

The important behavior is:

### `< 1900px`
Album flush left.

### `>= 1900px`
Album centered.

---

# 8. Preserve Journal Dimensions

Do not aggressively scale the album down just to fit smaller desktop widths.

Instead, prioritize:

1. keeping the binder artwork visually correct
2. keeping the writing canvas comfortable
3. collapsing Story Details by default
4. positioning the album flush-left when horizontal space becomes limited

The physical album metaphor should remain visually convincing.

---

# 9. Writing Canvas Behavior

With Story Details collapsed, allow the editor to use the freed space.

Do not leave an empty `285px` column where the panel used to be.

The title, body and toolbar should belong to the expanded editor area.

However, preserve a comfortable text measure.

Do not stretch the actual paragraph text across the entire width.

For example, the editor container may expand while the prose itself uses:

```css
max-width: 760px;
```

or the appropriate width based on the current implementation.

The extra space should create breathing room rather than excessively long lines.

---

# 10. Formatting Toolbar

Keep the existing toolbar design.

When Story Details opens/closes, the toolbar should remain aligned with the editor region.

It should smoothly reposition with the editor layout rather than staying attached to a fixed viewport coordinate.

Do not redesign the toolbar.

---

# 11. Existing Story Details Panel

Reuse the panel that already exists.

It should retain:

### Tabs
- Story Details
- Assistant

### Visibility
- explanatory copy
- visibility Select

### Tags
- Add Tags
- Auto tag
- tag input

### Story quality
- Characters
- Places
- Dates
- Emotions
- Sensory details

### Story overview / other existing panel content
Keep anything already implemented unless specifically changed elsewhere.

Do not simplify or rewrite the existing panel as part of this task.

---

# 12. State Structure

Keep the implementation simple.

Something like:

```tsx
const [isStoryDetailsOpen, setIsStoryDetailsOpen] = useState(false);
```

Default:

```tsx
false
```

Then drive the layout from that state.

For example:

```tsx
<JournalEditor
  detailsOpen={isStoryDetailsOpen}
/>

{isStoryDetailsOpen ? (
  <StoryDetailsPanel
    onCollapse={() => setIsStoryDetailsOpen(false)}
  />
) : (
  <StoryDetailsTrigger
    onClick={() => setIsStoryDetailsOpen(true)}
  />
)}
```

Reuse existing components rather than duplicating markup.

---

# 13. Accessibility

The Story Details trigger should include:

```tsx
aria-expanded={isStoryDetailsOpen}
aria-controls="story-details-panel"
```

The panel should have the corresponding:

```tsx
id="story-details-panel"
```

Icon-only collapse controls should use an accessible label such as:

`Collapse story details`

Keep keyboard focus states intact.

---

# 14. Do Not Change

Do not change:

- background artwork
- background positioning/style unless necessary for responsive sizing
- binder image
- page colors
- title typography
- body typography
- toolbar appearance
- Drafts location
- autosave placement
- Preview styling
- Publish styling
- date styling
- existing Story Details content
- overall journal dimensions without a strong layout reason

Avoid introducing new visual ideas.

This pass should make the current implementation feel more intentional and polished, not different.

---

# Final Expected Behavior

### Initial state

The page opens with:

```text
Date                           Drafts  Draft saved  Preview  Publish  ×

Story title                                          Story Details
Story body

Formatting toolbar
```

The writing experience is dominant.

---

### After clicking Story Details

The editor contracts smoothly and the existing panel slides/fades into place:

```text
Date                           Drafts  Draft saved  Preview  Publish  ×

Story title                           | Story Details
Story body                            | Assistant
                                      |
                                      | Visibility
                                      | Tags
                                      | Story quality

Formatting toolbar                    |
```

The user can collapse it again.

---

# Reference Screenshot

A screenshot is attached to this request.

Use it as the primary visual reference for:

- the default collapsed Story Details state
- location of the Story Details trigger
- spacing
- proportions
- alignment
- journal positioning
- flush-left behavior on narrower desktop screens

Use the **existing implementation** as the source of truth for elements that are already correct.

Do not attempt to reinterpret the design.

The objective is to preserve what is working while making the Story Details interaction and responsive journal positioning match the supplied reference.
