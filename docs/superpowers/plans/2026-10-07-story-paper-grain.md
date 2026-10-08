# Story Paper Grain Implementation Plan

> **For agentic workers:** Execute inline in the existing workspace, as requested by the user. Preserve unrelated uncommitted changes.

**Goal:** Give only the light album's paper a faint grain in Add, View, and Edit Story.

**Architecture:** Keep both WebP assets unchanged. Place a decorative SVG grain image immediately after the artwork in the shared StoryJournalShell. Match its 1536 × 1024 coordinates and object-cover/object-left-top sizing; leave the first 310 source pixels transparent, then fade into grain across the next 32 pixels to exclude all leather and chrome. Render only in light mode at 3% opacity, behind story content, without pointer events.

**Tech Stack:** React, SVG, Tailwind, Vitest.

### Task 1: Shared shell regression checks

- [ ] Create `src/components/modal/memory/story-journal-shell.test.tsx` using renderWithProviders. Check original and overlay-b presentations: light gets one decorative grain image, matching artwork sizing and 0.03 opacity; dark gets none.
- [ ] Run `npm test -- src/components/modal/memory/story-journal-shell.test.tsx`; confirm light-mode tests fail because no grain exists yet.

### Task 2: Paper-only texture

- [ ] Add `src/assets/image/story-paper-grain.svg`: viewBox 0 0 1536 1024; static fine feTurbulence in a repeated 128px tile; paper-only rectangle x=310; feather mask x=310 to 342.
- [ ] Update `src/components/modal/memory/story-journal-shell.tsx` to render a shared decorative artwork layer after each existing WebP. Use the same image layout classes, aria-hidden, empty alt, pointer-events-none, and opacity 0.03. Leave dark and mobile surfaces untouched.
- [ ] Run shell, create, and view tests; lint changed TypeScript; run production build.
- [ ] Inspect light-mode Add Story in the collaborative preview and compare texture/artwork dimensions. Leave changes local; no commit, merge, or push is part of this request.
