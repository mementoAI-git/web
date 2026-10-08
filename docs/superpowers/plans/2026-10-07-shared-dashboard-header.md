# Shared Dashboard Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Overview navigation presentation the default across non-Chat dashboard routes while preserving contextual titles, page-specific actions, and all Chat header behavior.

**Architecture:** Keep the route-family decision inside `DashboardHeader`, where header presentation is already selected. Replace the current Overview/Explore allow-list with a Chat exclusion rule, so nested and future non-Chat routes inherit the Overview chrome automatically. Exercise the public rendered behavior through the existing component test suite.

**Tech Stack:** React, TypeScript, React Router, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Apply shared non-Chat dashboard navigation

**Files:**
- Modify: `src/pages/dashboard/component/dashboard-header.test.tsx`
- Modify: `src/pages/dashboard/component/dashboard-header.tsx:157-161`

**Working-tree constraint:** Both files already contain uncommitted user work. Preserve every existing change, edit only the route-style predicate and focused tests, and do not stage or commit these files without explicit user approval.

- [ ] **Step 1: Add a test helper for contextual page titles**

In `dashboard-header.test.tsx`, import `useStore` and add this helper beside `DashboardHeaderWithConversationChrome`:

```tsx
import { useStore } from "@/hooks/use-store";

function DashboardHeaderWithTitle({ title }: { title: string }) {
  const { setHeaderTitle } = useStore();

  useEffect(() => {
    setHeaderTitle?.(title);
    return () => setHeaderTitle?.("");
  }, [setHeaderTitle, title]);

  return <DashboardHeader />;
}
```

- [ ] **Step 2: Write the failing nested Explore test**

Replace the existing `uses the overview navigation controls on Explore` test with a nested-route test that renders `DashboardHeaderWithTitle`:

```tsx
it("uses the overview navigation on nested Explore routes and keeps the page title", () => {
  const { container } = renderDashboardHeader(
    <DashboardHeaderWithTitle title="Explore topics" />,
    { route: "/explore/categories/growing-up" },
  );

  expect(screen.getByText("Explore topics")).toBeInTheDocument();
  expect(container.firstElementChild).toHaveClass("sm:h-[76px]");
  expect(container.firstElementChild).not.toHaveClass("border-b");
  expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
    "h-9",
    "bg-fill-neutral-weak",
  );
  expect(
    screen
      .getByRole("button", { name: "Open search" })
      .querySelector('[data-slot="search-command-shortcut"]'),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Quick tools" })).toHaveClass(
    "size-9",
    "rounded-lg",
    "bg-fill-neutral-weak",
  );
});
```

- [ ] **Step 3: Write failing coverage for another non-Chat route and a Chat route**

Add these tests immediately after the nested Explore test:

```tsx
it("uses the overview navigation on other non-Chat dashboard routes", () => {
  const { container } = renderDashboardHeader(<DashboardHeader />, {
    route: "/settings/general",
  });

  expect(screen.getByText("settings")).toBeInTheDocument();
  expect(container.firstElementChild).toHaveClass("sm:h-[76px]");
  expect(container.firstElementChild).not.toHaveClass("border-b");
  expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
    "h-9",
    "bg-fill-neutral-weak",
  );
});

it("keeps the non-overview navigation on Chat routes", () => {
  const { container } = renderDashboardHeader(<DashboardHeader />, {
    route: "/chat",
  });

  expect(screen.getByText("chat with AI")).toBeInTheDocument();
  expect(container.firstElementChild).toHaveClass("border-b");
  expect(container.firstElementChild).not.toHaveClass("sm:h-[76px]");
  expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
    "h-10",
  );
  expect(
    screen
      .getByRole("button", { name: "Open search" })
      .querySelector('[data-slot="search-command-shortcut"]'),
  ).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the focused test and verify the new non-Chat cases fail for the intended reason**

Run:

```bash
npm run test -- src/pages/dashboard/component/dashboard-header.test.tsx
```

Expected: the nested Explore and Settings assertions fail because those routes currently receive the bordered, non-Overview header. The Chat assertion should already pass and acts as preservation coverage.

- [ ] **Step 5: Implement the minimal route-family predicate**

In `dashboard-header.tsx`, replace the current allow-list:

```tsx
const usesOverviewNav =
  pathForTitle === "overview" ||
  pathForTitle === "" ||
  pathForTitle === "explore";
```

with:

```tsx
const usesOverviewNav = !pathForTitle.startsWith("chat");
```

Do not change the earlier `showConversationNav` branch or the title/action conditions.

- [ ] **Step 6: Run the focused test and verify it passes**

Run:

```bash
npm run test -- src/pages/dashboard/component/dashboard-header.test.tsx
```

Expected: all tests in `dashboard-header.test.tsx` pass with zero failures.

- [ ] **Step 7: Run file-level linting**

Run:

```bash
npm exec -- eslint src/pages/dashboard/component/dashboard-header.tsx src/pages/dashboard/component/dashboard-header.test.tsx
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 8: Run the production build**

Run:

```bash
npm run build
```

Expected: Vite completes the production build with exit code 0.

- [ ] **Step 9: Review the final diff without staging user work**

Run:

```bash
git diff --check -- src/pages/dashboard/component/dashboard-header.tsx src/pages/dashboard/component/dashboard-header.test.tsx
git diff -- src/pages/dashboard/component/dashboard-header.tsx src/pages/dashboard/component/dashboard-header.test.tsx
```

Expected: no whitespace errors. Confirm the task-owned changes are limited to the predicate, the title helper, and the three route-behavior tests. Leave all overlapping pre-existing changes unstaged.
