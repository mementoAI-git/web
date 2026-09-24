# Add Story Desktop Toolbar State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop Add Story attachment menu open on click, keep formatting indicators synchronized with Tiptap, and guarantee the unsaved-exit dialog renders above the editor.

**Architecture:** Recompose existing shadcn primitives instead of adding feature-specific UI components. Use `DropdownMenu` for the click-triggered upload menu, shadcn `Toggle` controls driven by Tiptap `useEditorState`, and an optional overlay class on the shared Dialog wrapper for instance-specific stacking.

**Tech Stack:** React 19, TypeScript, Tiptap 3, shadcn/Radix UI, Tailwind CSS 4, Vitest, Testing Library

---

## File Map

- Modify `src/components/modal/memory/create/index.tsx`: desktop attachment dropdown, editor-state selector, formatting toggles, and dialog stack classes.
- Modify `src/components/modal/memory/create/index.test.tsx`: desktop interaction and accessibility regressions.
- Modify `src/components/ui/dialog.tsx`: optional `overlayClassName` passthrough.
- Test `src/components/modal/memory/create/index.test.tsx`: focused behavior coverage.

### Task 1: Raise the desktop unsaved-exit dialog above Add Story

**Files:**
- Modify: `src/components/ui/dialog.tsx:48-76`
- Modify: `src/components/modal/memory/create/index.tsx:1334-1376`
- Test: `src/components/modal/memory/create/index.test.tsx:612-630`

- [ ] **Step 1: Write the failing stacking test**

Extend the unsaved-exit test with:

```tsx
const dialog = screen.getByRole("dialog", { name: "Save this story?" });
expect(dialog).toHaveClass("z-[310]");
expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass("z-[300]");
```

- [ ] **Step 2: Verify the test fails for the missing stack classes**

Run: `npm test -- --run src/components/modal/memory/create/index.test.tsx`

Expected: FAIL because the content and overlay still use the shared `z-50` defaults.

- [ ] **Step 3: Add instance-specific overlay styling**

Change `DialogContent` to accept and forward an overlay class:

```tsx
function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  overlayClassName?: string
}) {
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      {/* existing content */}
    </DialogPortal>
  )
}
```

Set the Add Story confirmation to `overlayClassName="z-[300]"` and add `z-[310]` to its `DialogContent` class.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --run src/components/modal/memory/create/index.test.tsx`

Expected: PASS for the dialog stacking assertion.

### Task 2: Restore click-triggered attachment options

**Files:**
- Modify: `src/components/modal/memory/create/index.tsx:88-101,1694-1750`
- Test: `src/components/modal/memory/create/index.test.tsx:483-530`

- [ ] **Step 1: Write the failing normal-click test**

Use `userEvent` to click Add attachment and assert shadcn DropdownMenu semantics:

```tsx
const user = userEvent.setup();
const attachmentButton = screen.getByRole("button", { name: "Add attachment" });
await user.click(attachmentButton);
expect(attachmentButton).toHaveAttribute("data-slot", "dropdown-menu-trigger");
expect(screen.getByRole("menu")).toBeInTheDocument();
expect(screen.getByText("Choose upload type")).toBeInTheDocument();
```

Update the Escape regression to open the attachment menu with a normal click.

- [ ] **Step 2: Verify the tests fail against ContextMenu**

Run: `npm test -- --run src/components/modal/memory/create/index.test.tsx`

Expected: FAIL because a ContextMenu trigger ignores primary click.

- [ ] **Step 3: Replace only the desktop attachment ContextMenu**

Compose the existing shadcn dropdown exports:

```tsx
<DropdownMenu modal={false} onOpenChange={(open) => open && setShowEmoji(false)}>
  <DropdownMenuTrigger asChild>{attachmentButton}</DropdownMenuTrigger>
  <DropdownMenuContent side="top" align="start" sideOffset={10}>
    <DropdownMenuLabel>Choose upload type</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={() => fileInputImageRef.current?.click()}>Photos</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => fileInputVideoRef.current?.click()}>Videos</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => fileInputAudioRef.current?.click()}>Audio</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => fileInputDocsRef.current?.click()}>Documents</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Remove unused ContextMenu imports. Do not change mobile upload controls.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --run src/components/modal/memory/create/index.test.tsx`

Expected: attachment click and Escape tests PASS.

### Task 3: Synchronize shadcn formatting toggles with Tiptap

**Files:**
- Modify: `src/components/modal/memory/create/index.tsx:3,1499-1537,1822-1861`
- Modify: `src/components/modal/memory/create/index.test.tsx:1-420,530-600`
- Reuse: `src/components/ui/toggle.tsx`

- [ ] **Step 1: Add failing toggle semantics and state tests**

Mock `useEditorState` by evaluating its selector against the existing editor mock. Add mutable `editorIsActiveMock` behavior and assert:

```tsx
expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-slot", "toggle");
expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
expect(screen.getByRole("button", { name: "Bullet list" })).toHaveAttribute("aria-pressed", "true");
```

Also verify clicking each control invokes the existing Tiptap command or link action and does not remove editor focus before the command runs.

- [ ] **Step 2: Verify the tests fail against Button controls**

Run: `npm test -- --run src/components/modal/memory/create/index.test.tsx`

Expected: FAIL because formatting controls have `data-slot="button"` and no `aria-pressed` state.

- [ ] **Step 3: Subscribe to editor activity**

Import `useEditorState` with `EditorContent` and select all six values in one subscription:

```tsx
const formattingState = useEditorState({
  editor,
  selector: ({ editor: currentEditor }) => ({
    bold: currentEditor.isActive("bold"),
    italic: currentEditor.isActive("italic"),
    strike: currentEditor.isActive("strike"),
    underline: currentEditor.isActive("underline"),
    link: currentEditor.isActive("link"),
    bulletList: currentEditor.isActive("bulletList"),
  }),
}) ?? {
  bold: false,
  italic: false,
  strike: false,
  underline: false,
  link: false,
  bulletList: false,
};
```

- [ ] **Step 4: Replace the desktop helper with shadcn Toggle**

Import `Toggle` and render each formatting control as:

```tsx
<Toggle
  type="button"
  pressed={pressed}
  onMouseDown={(event) => event.preventDefault()}
  onPressedChange={() => onToggle()}
  aria-label={label}
  title={label}
  size="sm"
  className="size-8 rounded-[8px] data-[state=on]:bg-fill-neutral-weak"
>
  {children}
</Toggle>
```

Set link `pressed={formattingState.link || showLinkInput}`. Keep bullet list as the only list control. Do not replace the legacy/mobile toolbar helper.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- --run src/components/modal/memory/create/index.test.tsx`

Expected: all non-skipped CreateMemory tests PASS.

### Task 4: Verify the desktop-only integration

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run repository checks**

Run:

```bash
npm test -- --run
npm run build
npm run lint
git diff --check
```

Expected: tests and build exit 0; lint has no errors; diff check is clean.

- [ ] **Step 2: Verify in the running desktop app**

At `/overview`, open Add Story and verify:

1. Primary-click plus opens the upload dropdown.
2. Bold, italic, strikethrough, underline, link, and bullet list show immediate pressed states.
3. Moving the cursor into formatted text updates the controls without delay.
4. Closing unsaved content shows the shadcn dialog and overlay above the journal.
5. Reopening Add Story still starts with Story Details collapsed.

- [ ] **Step 3: Preserve branch for user testing**

Leave implementation changes on `addstory-update`. Do not modify API files, mobile-only markup, or unrelated dirty files.
