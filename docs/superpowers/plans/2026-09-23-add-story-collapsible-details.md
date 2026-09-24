# Add Story Collapsible Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing desktop Add Story details panel collapsed by default, accessible, smoothly expandable inline, and correctly aligned across desktop viewport widths.

**Architecture:** Keep the behavior inside the current desktop `CreateMemoryBase` implementation, using one boolean state and focus refs around the existing panel markup. Use state-driven CSS classes for the grid and reveal treatment, with a single 1900px responsive breakpoint for shell positioning.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, shadcn Button/Tabs, Lucide icons, Vitest, Testing Library.

---

### Task 1: Protect the collapsed panel interaction

**Files:**

- Modify: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Write a failing test for the default collapsed state**

Assert that the `Story Details` button is present with `aria-expanded="false"`, references `story-details-panel`, and that the panel and tablist are absent.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `npm test -- src/components/modal/memory/create/index.test.tsx`

Expected: FAIL because the current implementation renders the Story Details tab and panel immediately.

- [ ] **Step 3: Write failing interaction assertions**

Open the details panel, assert its id and tabs, verify focus moves to the Story Details tab, collapse through the icon control, and verify focus returns to the compact trigger.

- [ ] **Step 4: Run the focused test and verify it still fails for missing interaction**

Run: `npm test -- src/components/modal/memory/create/index.test.tsx`

Expected: FAIL because there is no collapsible details state yet.

### Task 2: Implement the inline details rail

**Files:**

- Modify: `src/components/modal/memory/create/index.tsx`

- [ ] **Step 1: Add state and focus refs**

Add `isDetailsOpen`, initialized to `false`, plus refs for the compact trigger and Story Details tab. Add open and close handlers that update state and transfer focus after React commits the new state.

- [ ] **Step 2: Compose the collapsed trigger from the existing Button**

Render a quiet ghost `Button` with a Lucide `ListFilter` icon, `aria-expanded`, and `aria-controls="story-details-panel"` in the right rail when collapsed.

- [ ] **Step 3: Reuse the current panel in the expanded state**

Keep the existing Tabs, fields, quality summary, overview, assistant content, and Save Draft action. Add `id="story-details-panel"` to the aside and a small icon-only collapse Button beside the tab list.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- src/components/modal/memory/create/index.test.tsx`

Expected: PASS.

### Task 3: Refine responsive positioning and motion

**Files:**

- Modify: `src/components/modal/memory/create/index.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Align the shell to the left below 1900px**

Replace the environment's symmetric desktop padding with zero left padding below `1900px`, preserve vertical/right padding, and restore symmetric padding plus `mx-auto` at `min-[1900px]`.

- [ ] **Step 2: Animate the inline state change**

Add state classes for the body grid, panel content, and compact trigger. Use a `240ms` custom ease-out; restrict the reveal itself to opacity and transform. Keep the editor content and toolbar at their current maximum width.

- [ ] **Step 3: Add reduced-motion behavior**

Disable the spatial transition and reveal transform under `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Re-run the focused tests**

Run: `npm test -- src/components/modal/memory/create/index.test.tsx`

Expected: PASS.

### Task 4: Verify the refinement

**Files:**

- Verify only.

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`

Expected: all tests pass, excluding repository-documented skips.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: build completes successfully.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no new errors; note any pre-existing warnings separately.

- [ ] **Step 4: Inspect the desktop layout in a browser**

At widths below and above `1900px`, verify shell alignment, collapsed/open states, prose measure, toolbar alignment, focus behavior, and reduced-motion treatment.
