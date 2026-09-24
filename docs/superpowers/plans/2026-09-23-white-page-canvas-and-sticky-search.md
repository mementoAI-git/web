# White Page Canvas and Sticky Memory Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make light-mode page canvases pure white and prevent scrolled memory content from appearing in the gap above the sticky search controls.

**Architecture:** Keep the correction at the existing semantic-token boundary by changing only the light `--background` value. Extend the existing sticky header's opaque background into its 16px top offset with a positioned pseudo-element, preserving all search and view-control behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, PostCSS, Vitest, Testing Library

---

### Task 1: Lock the visual contract with tests

**Files:**
- Modify: `src/index.css.test.ts`
- Modify: `src/pages/dashboard/stories/components/header.test.tsx`

- [x] **Step 1: Add the light canvas token assertion**

Add this case to `src/index.css.test.ts`:

```ts
it("uses a pure white page canvas in light mode", () => {
  expect(declaration(":root", "--background")).toBe("#ffffff");
  expect(declaration(".dark", "--background")).toBe("#170b00");
});
```

- [x] **Step 2: Add the sticky offset mask assertion**

Extend the sticky search assertion in `src/pages/dashboard/stories/components/header.test.tsx`:

```ts
expect(search.closest('[data-slot="stories-sticky-search"]')).toHaveClass(
  "sticky",
  "top-4",
  "before:-top-4",
  "before:h-4",
  "before:bg-background",
);
```

- [x] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
npm test -- src/index.css.test.ts src/pages/dashboard/stories/components/header.test.tsx
```

Expected: FAIL because the light token is still `#fefbf8` and the sticky mask classes are absent.

### Task 2: Implement the white canvas and sticky mask

**Files:**
- Modify: `src/index.css:290`
- Modify: `src/pages/dashboard/stories/components/header.tsx:48-51`

- [x] **Step 1: Correct the light canvas token**

Change the root declaration to:

```css
--background: #ffffff;
```

Keep the `.dark` declaration unchanged:

```css
--background: #170b00;
```

- [x] **Step 2: Extend the sticky background through its offset**

Update the sticky wrapper classes to:

```tsx
className="sticky top-4 z-20 flex items-center gap-3 bg-background before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-background before:content-['']"
```

The pseudo-element occupies only the gap above the controls, so it does not intercept their pointer interactions.

- [x] **Step 3: Run the focused tests and verify they pass**

Run:

```bash
npm test -- src/index.css.test.ts src/pages/dashboard/stories/components/header.test.tsx
```

Expected: both test files PASS.

- [x] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: Vite completes successfully with no TypeScript or bundling errors.

- [x] **Step 5: Inspect the final diff**

Run:

```bash
git diff -- src/index.css src/index.css.test.ts src/pages/dashboard/stories/components/header.tsx src/pages/dashboard/stories/components/header.test.tsx
```

Expected: only the root light-background token, sticky mask classes, and their focused tests are added; unrelated worktree changes remain untouched.

### Task 3: Add bottom padding and contain list-item stacking

**Files:**
- Modify: `src/pages/dashboard/stories/components/header.test.tsx`
- Modify: `src/pages/dashboard/stories/components/header.tsx`
- Create: `src/components/image-thumbnail.test.tsx`
- Modify: `src/components/image-thumbnail.tsx`

- [x] **Step 1: Assert the sticky layer and bottom padding**

Update the sticky header test to expect `z-40` and `pb-3`, and to reject the old `z-20` layer.

- [x] **Step 2: Assert thumbnail stacking isolation**

Render `ImageThumbnail` with an empty attachment list and assert that its root uses `isolate`.

- [x] **Step 3: Run the focused tests and verify they fail**

Run `npm test -- src/pages/dashboard/stories/components/header.test.tsx src/components/image-thumbnail.test.tsx` and confirm failures for the missing classes.

- [x] **Step 4: Apply the minimal stacking fix**

Change the sticky wrapper from `z-20` to `z-40`, add `pb-3`, and add `isolate` to the thumbnail root.

- [x] **Step 5: Verify tests and build**

Run the focused tests and `npm run build`; both must pass.
