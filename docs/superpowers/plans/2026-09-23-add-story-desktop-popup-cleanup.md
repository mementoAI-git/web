# Add Story Desktop Popup Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the desktop Add Story attachment, emoji, and unsaved-exit interactions onto shadcn primitives while preserving the legacy mobile composer.

**Architecture:** Add the official shadcn ContextMenu and Popover source components, then compose them directly inside the existing desktop `CreateMemoryBase` branch. Keep the shared legacy close-confirmation component unchanged and render a desktop-only shadcn Dialog from the existing composer state.

**Tech Stack:** React, TypeScript, shadcn/Radix, Tailwind CSS v4, emoji-mart, Vitest, Testing Library.

---

### Task 1: Install the shadcn interaction primitives

**Files:**
- Create: `src/components/ui/context-menu.tsx`
- Create: `src/components/ui/popover.tsx`

- [ ] **Step 1: Inspect the official registry changes**

Run: `npx shadcn@latest add context-menu popover --dry-run`

Expected: the CLI lists only the two component source files and required existing dependencies.

- [ ] **Step 2: Add the components through the shadcn CLI**

Run: `npx shadcn@latest add context-menu popover`

Expected: both source files are created without overwriting existing components.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run build`

Expected: the production build succeeds.

### Task 2: Protect the desktop popup behavior

**Files:**
- Modify: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Write failing attachment and emoji tests**

Assert that the desktop attachment trigger owns a shadcn context-menu slot, that context-menu invocation exposes the existing upload actions, and that the emoji trigger contains `🙂` and opens a shadcn popover containing the existing emoji picker.

- [ ] **Step 2: Write failing exit-dialog tests**

Assert that the desktop Story Details panel has no Save Draft button. Enter unsaved content, close the composer, and assert the shadcn dialog exposes `Save draft and exit`, `Discard`, and `Keep editing`. Verify saving writes `create-memory-drafts` before closing, keeping editing leaves the journal mounted, and an empty composer closes immediately.

- [ ] **Step 3: Run the focused suite and verify expected failures**

Run: `npm test -- src/components/modal/memory/create/index.test.tsx`

Expected: FAIL because the desktop composer still uses DropdownMenu, a custom emoji portal, the panel Save Draft footer, and the legacy confirmation component.

### Task 3: Compose the desktop shadcn surfaces

**Files:**
- Modify: `src/components/modal/memory/create/index.tsx`

- [ ] **Step 1: Replace the desktop attachment DropdownMenu**

Import `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator`, and `ContextMenuItem`. Wrap the existing attachment button with the trigger and preserve the four existing file-input click handlers.

- [ ] **Step 2: Replace the custom emoji portal**

Import `Popover`, `PopoverTrigger`, and `PopoverContent`. Control it with the existing `showEmoji` state, render `🙂` inside the trigger, and keep the existing emoji-mart selection callback.

- [ ] **Step 3: Add the desktop-only shadcn exit Dialog**

Reuse the existing `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter` imports. Render the shared legacy confirmation portal only for mobile/legacy. Render the shadcn Dialog only for desktop/next, with save-and-exit, discard, and keep-editing actions.

- [ ] **Step 4: Make closing draft-aware**

Update the close guard so desktop content that matches the persisted draft closes immediately. Add a save-and-exit handler that calls the existing draft persistence logic, closes the Dialog, and force-closes without deleting uploaded attachments.

- [ ] **Step 5: Remove the desktop panel footer**

Delete only the Story Details panel separator and Save Draft footer. Leave the legacy mobile footer unchanged.

- [ ] **Step 6: Square the desktop album's left corners**

Change the desktop journal shell and artwork to `rounded-l-none rounded-r-[30px]`; do not change the mobile sheet.

- [ ] **Step 7: Run the focused suite**

Run: `npm test -- src/components/modal/memory/create/index.test.tsx`

Expected: all active CreateMemory tests pass.

### Task 4: Verify scope and regression safety

**Files:**
- Verify only.

- [ ] **Step 1: Run the complete unit suite**

Run: `npm test`

Expected: all tests pass except documented skips.

- [ ] **Step 2: Run build and lint**

Run: `npm run build`

Run: `npm run lint`

Expected: build succeeds; lint reports no new errors.

- [ ] **Step 3: Verify the desktop UI in the browser**

At 1440×819, confirm the context menu, yellow emoji popover, three-action exit Dialog, and square left corners. Confirm the mobile sheet source and rendered layout remain unchanged.

- [ ] **Step 4: Audit the final diff**

Run: `git diff --check && git status --short`

Expected: only the desktop composer, its tests, official shadcn source files, and planning documentation are changed by this task.
