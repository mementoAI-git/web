# Chat Settings Drawer Second Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the chat settings drawer with an opaque surface, score-driven life-area chart, exact ambience slider, two-line voice cards, and consistent card radii.

**Architecture:** Keep the existing drawer and persistence hooks. Add a small pure life-area distribution mapper inside the enrichment component, use named palette tokens for category identity, and restyle the existing voice and ambience controls without changing their data flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, existing shadcn-style Avatar/Button primitives, Vitest, Testing Library, Playwright.

---

### Task 1: Life-area distribution

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/modal/chat-settings/enrichment-summary.tsx`
- Modify: `src/components/modal/chat-settings/enrichment-summary.test.tsx`

- [ ] Add failing tests for the canonical ten-category order, score-proportional flex widths, equal fallback widths, and qualitative headline.
- [ ] Run `npm test -- src/components/modal/chat-settings/enrichment-summary.test.tsx` and verify the new assertions fail.
- [ ] Define named life-area palette variables and render normalized category scores with accessible category labels.
- [ ] Apply the shared `rounded-xl` radius to enrichment, shortcut, and insight cards.
- [ ] Re-run the focused test and require it to pass.

### Task 2: Voice and ambience fidelity

**Files:**
- Modify: `src/components/modal/chat-settings/voices.tsx`
- Modify: `src/components/modal/chat-settings/voices.test.tsx`
- Modify: `src/components/modal/chat-settings/background-music.tsx`
- Modify: `src/components/modal/chat-settings/background-music.test.tsx`

- [ ] Add failing assertions for a single `Gender · Voice type` metadata row and the 20px slider with a slim marker.
- [ ] Run both focused test files and verify the assertions fail.
- [ ] Compose voice imagery with the existing shadcn Avatar primitive, remove extra metadata rows, and add the selected indicator.
- [ ] Replace the circular slider thumb with the Figma track/fill/marker geometry while retaining pointer and keyboard changes.
- [ ] Apply `rounded-xl` consistently to all voice and ambience cards.
- [ ] Re-run both focused test files and require them to pass.

### Task 3: Opaque drawer surface and verification

**Files:**
- Modify: `src/components/memory/sidebar-details.tsx`
- Modify: `src/components/memory/sidebar-details.test.tsx`

- [ ] Add a failing assertion that the settings drawer has `bg-background` and a separate decorative gradient layer.
- [ ] Implement the opaque base and top-only gradient layer with content above it.
- [ ] Run all chat-settings and sidebar focused tests.
- [ ] Run changed-file ESLint and the project variable workflow.
- [ ] Run the full unit suite and production build.
- [ ] Render the drawer in desktop light and mobile dark modes and compare it with the supplied Figma reference.
