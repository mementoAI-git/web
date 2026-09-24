# Text Story Card Ratio and Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give text-only story cards with at least five rendered body lines a 3:4 frame and assign every text-only card one of four exact theme-aware surfaces.

**Architecture:** Keep the change inside the stories grid presentation component. A small rendered-line helper and a `ResizeObserver`-backed layout effect determine whether the body reaches five lines at its current width; the existing stable story seed selects one literal Tailwind palette class so assignments do not jump between renders.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## File structure

- Modify `src/pages/dashboard/stories/components/grid.tsx`: define the four surface classes, measure body line boxes, observe responsive width changes, and apply the tall ratio.
- Modify `src/pages/dashboard/stories/components/grid.test.tsx`: cover the line threshold, title exclusion, exact palette values, and stable selection.

### Task 1: Add body-line threshold behavior

**Files:**
- Modify: `src/pages/dashboard/stories/components/grid.tsx`
- Test: `src/pages/dashboard/stories/components/grid.test.tsx`

- [ ] **Step 1: Write the failing five-line threshold tests**

Add a controllable `Range#getClientRects` mock and tests that return four or five unique line-top values. Render a text-only memory, query `[data-slot="story-text-card"]`, and assert that only the five-line body receives `aspect-[3/4]`. Include a long wrapping title in the four-line case to prove that title lines are excluded.

```tsx
const renderedBodyLines = vi.hoisted(() => ({ value: 0 }));

beforeEach(() => {
  vi.spyOn(document, "createRange").mockReturnValue({
    selectNodeContents: vi.fn(),
    getClientRects: () =>
      Array.from({ length: renderedBodyLines.value }, (_, index) => ({
        top: index * 24,
        width: 120,
        height: 20,
      })),
  } as unknown as Range);
});

it("uses a 3:4 frame when the rendered body reaches five lines", () => {
  renderedBodyLines.value = 5;
  const { container } = renderWithProviders(<StoriesGrid data={pagination(false)} />, {
    route: "/stories",
    auth: true,
  });

  expect(container.querySelector('[data-slot="story-text-card"]')).toHaveClass(
    "aspect-[3/4]",
  );
});

it("keeps a text card compact when only its title pushes the card past five lines", () => {
  renderedBodyLines.value = 4;
  const data = {
    ...pagination(false),
    docs: [{ ...memory, title: "A deliberately long title that wraps repeatedly" }],
  };
  const { container } = renderWithProviders(<StoriesGrid data={data} />, {
    route: "/stories",
    auth: true,
  });

  expect(container.querySelector('[data-slot="story-text-card"]')).not.toHaveClass(
    "aspect-[3/4]",
  );
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- src/pages/dashboard/stories/components/grid.test.tsx`

Expected: FAIL because the text card has no `data-slot="story-text-card"` hook and no rendered-line ratio behavior.

- [ ] **Step 3: Implement rendered body-line measurement**

Import `useLayoutEffect`, add the helper below, and add a body ref plus layout effect to `StoriesGridItem`. Observe the body element so responsive width changes trigger another measurement.

```tsx
const TALL_TEXT_CARD_MIN_LINES = 5;

export function hasAtLeastRenderedBodyLines(
  element: HTMLElement,
  minimum = TALL_TEXT_CARD_MIN_LINES,
) {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  if (typeof range.getClientRects !== "function") return false;

  const lineTops = new Set(
    Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => Math.round(rect.top)),
  );

  return lineTops.size >= minimum;
}
```

```tsx
const textBodyRef = useRef<HTMLDivElement | null>(null);
const [isTallTextCard, setIsTallTextCard] = useState(false);

useLayoutEffect(() => {
  const body = textBodyRef.current;
  if (!body || bannerMedia || audioMedia) return;

  const measure = () => setIsTallTextCard(hasAtLeastRenderedBodyLines(body));
  measure();

  if (typeof ResizeObserver === "undefined") return;
  const observer = new ResizeObserver(measure);
  observer.observe(body);
  return () => observer.disconnect();
}, [audioMedia, bannerMedia, memory.body]);
```

Add `data-slot="story-text-card"` to the text-card frame, add `ref={textBodyRef}` and `data-slot="story-text-body"` to the body preview, and select sizing with:

```tsx
isTallTextCard ? "aspect-[3/4]" : textCardMinHeightClass
```

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- src/pages/dashboard/stories/components/grid.test.tsx`

Expected: all grid component tests PASS.

### Task 2: Replace the text-card palette

**Files:**
- Modify: `src/pages/dashboard/stories/components/grid.tsx`
- Test: `src/pages/dashboard/stories/components/grid.test.tsx`

- [ ] **Step 1: Write failing palette tests**

Export the palette constant from the component module and assert that it contains exactly the approved classes. Also assert that repeated selection with the same seed returns the same entry.

```tsx
import StoriesGrid, {
  TEXT_ONLY_CARD_SURFACES,
  getTextCardSurfaceClass,
} from "./grid";

it("uses the four approved light and dark text-card surfaces", () => {
  expect(TEXT_ONLY_CARD_SURFACES).toEqual([
    "bg-[#F7A21A]/20 dark:bg-[#F7A21A]/20",
    "bg-[#1A80F7]/20 dark:bg-[#1A80F7]/20",
    "bg-[#C7F71A]/20 dark:bg-[#C7F71A]/20",
    "bg-[#0F0700]/[0.04] dark:bg-[#FFFFFF]/[0.06]",
  ]);
});

it("keeps a story's text-card surface stable", () => {
  expect(getTextCardSurfaceClass(memory, memory.title)).toBe(
    getTextCardSurfaceClass(memory, memory.title),
  );
});
```

- [ ] **Step 2: Run the palette tests and verify they fail**

Run: `npm test -- src/pages/dashboard/stories/components/grid.test.tsx`

Expected: FAIL because the approved palette exports do not exist.

- [ ] **Step 3: Implement the four stable palette choices**

Replace the inline `CSSProperties` surfaces and `style` prop with literal class names selected by the existing stable hash.

```tsx
export const TEXT_ONLY_CARD_SURFACES = [
  "bg-[#F7A21A]/20 dark:bg-[#F7A21A]/20",
  "bg-[#1A80F7]/20 dark:bg-[#1A80F7]/20",
  "bg-[#C7F71A]/20 dark:bg-[#C7F71A]/20",
  "bg-[#0F0700]/[0.04] dark:bg-[#FFFFFF]/[0.06]",
] as const;

export function getTextCardSurfaceClass(memory: IMemory, title: string) {
  return pickBySeed(TEXT_ONLY_CARD_SURFACES, getCardSeed(memory, title));
}
```

Apply the selected class through `cn(...)` on the text-only card. Retain the existing neutral border and theme-aware text colors.

- [ ] **Step 4: Run the complete focused test set**

Run: `npm test -- src/pages/dashboard/stories/components/grid.test.tsx src/pages/dashboard/stories/index.test.tsx`

Expected: all focused tests PASS.

- [ ] **Step 5: Verify production compilation and diff quality**

Run: `npm run build`

Expected: Vite exits successfully. The existing large-chunk advisory may remain.

Run: `git diff --check`

Expected: no whitespace errors.
