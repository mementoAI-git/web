# Add Story Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the desktop Add Story composer as a responsive physical-journal interface while preserving all existing Add Memory behavior and leaving the API and mobile/legacy branches untouched.

**Architecture:** Recompose only the `variant="next"` render path inside the existing Create Memory component. The supplied album image becomes a decorative shell beneath the current Tiptap editor, upload controls, property fields, assistant, drafts, and publish handlers; focused CSS owns the journal motion and editor typography while existing shadcn primitives provide controls and tabs.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, Tiptap, shadcn/ui (Radix Maia), Vitest, Testing Library, Playwright browser verification.

---

## File map

- Modify `src/components/modal/memory/create/index.tsx`: desktop-only composition, controlled Story Details tabs, truthful local draft status, album/scenic assets, responsive class structure, and existing editor/toolbar behavior.
- Modify `src/components/modal/memory/create/index.test.tsx`: desktop shell, journal hierarchy, tab switching, toolbar, and legacy/mobile regression expectations.
- Modify `src/index.css`: scoped journal entrance, reduced-motion fallback, and desktop Tiptap typography/scroll behavior.
- Do not modify `src/components/modal/memory/create/access-field.tsx` or `tags-field.tsx`; reuse their existing `variant="panel"` presentations.
- Do not modify any file under `../api` or either legacy render branch in `index.tsx`.

### Task 1: Lock the desktop contract with failing tests

**Files:**
- Modify: `src/components/modal/memory/create/index.test.tsx:389-430`
- Test: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Replace the old desktop shell assertion with the new journal contract**

Replace the existing `uses v3 background on desktop story shell` test with:

```tsx
it("renders the desktop composer as a journal without changing the mobile sheet", () => {
  const { rerender } = renderWithProviders(
    <CreateMemory data={{}} isMobile={false} />,
    { auth: true },
  );

  expect(screen.getByTestId("desktop-story-environment")).toBeInTheDocument();
  expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
  expect(screen.getByTestId("desktop-album-artwork")).toHaveAttribute("alt", "");
  expect(screen.getByPlaceholderText(/give this story a title/i)).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /story details/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /publish story/i })).toBeInTheDocument();

  rerender(<CreateMemory data={{}} isMobile />);
  expect(screen.getByTestId("sheet-container")).toBeInTheDocument();
  expect(screen.queryByTestId("desktop-journal-shell")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Update desktop selectors whose visible copy intentionally changes**

Change desktop title lookups from:

```tsx
screen.getByPlaceholderText(/enter title here/i)
```

to:

```tsx
screen.getByPlaceholderText(/give this story a title/i)
```

Change the assistant trigger lookup from a button to the shadcn tab role:

```tsx
screen.getByRole("tab", { name: "Assistant" })
```

- [ ] **Step 3: Add a focused test for the quiet Story Quality checklist**

```tsx
it("shows story quality as a quiet checklist instead of a percentage chart", () => {
  renderWithProviders(<CreateMemory data={{}} isMobile={false} />, { auth: true });

  expect(screen.getByText("Story quality")).toBeInTheDocument();
  expect(screen.getByText("Characters")).toBeInTheDocument();
  expect(screen.getByText("Sensory details")).toBeInTheDocument();
  expect(screen.queryByText(/strong story|good start|keep going/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});
```

- [ ] **Step 4: Run the focused test and verify the new contract fails**

Run:

```bash
pnpm vitest run --project=unit src/components/modal/memory/create/index.test.tsx
```

Expected: FAIL because the desktop journal test IDs, new title placeholder, and tab semantics do not exist yet.

- [ ] **Step 5: Commit the red tests**

```bash
git add src/components/modal/memory/create/index.test.tsx
git commit -m "test: define add story journal layout"
```

### Task 2: Recompose the desktop journal shell

**Files:**
- Modify: `src/components/modal/memory/create/index.tsx:1-100`
- Modify: `src/components/modal/memory/create/index.tsx:1400-1960`
- Test: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Refresh the shadcn project context and component documentation**

Run from `memento-web`:

```bash
npx shadcn@latest info
npx shadcn@latest docs button tabs dropdown-menu separator
```

Expected: the project reports Vite, Tailwind v4, Radix, lucide icons, and the existing component paths. Do not install or overwrite components.

- [ ] **Step 2: Add the journal assets and existing Tabs imports**

Add these imports to `index.tsx`:

```tsx
import albumArtwork from "@/assets/image/HD Album story bg memento.png";
import scenicBackground from "@/assets/image/bg/1.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

Extend the lucide import with the icons used by the reference header:

```tsx
CalendarDays,
Cloud,
Play,
X,
```

Remove `SunMedium` after the desktop block no longer uses it. Keep `TimesIcon` because the untouched legacy/mobile paths still require it.

- [ ] **Step 3: Replace only the final desktop `return` shell**

Keep both earlier legacy returns unchanged. Replace the final desktop wrapper with this hierarchy and move the existing controls into the indicated regions:

```tsx
return (
  <>
    <div
      data-testid="desktop-story-environment"
      className="absolute inset-0 overflow-auto bg-cover bg-center p-4 xl:p-9"
      style={{ backgroundImage: `linear-gradient(rgba(18, 12, 8, 0.22), rgba(18, 12, 8, 0.22)), url(${scenicBackground})` }}
      onClick={(event) => event.stopPropagation()}
    >
      {fileInputs}
      <main
        data-testid="desktop-journal-shell"
        className="add-story-journal relative mx-auto h-[calc(100dvh-32px)] min-h-[720px] w-full max-w-[1440px] overflow-hidden rounded-[30px] shadow-[0_28px_80px_rgba(20,12,7,0.28)] xl:h-[calc(100dvh-72px)]"
      >
        <img
          data-testid="desktop-album-artwork"
          src={albumArtwork}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />

        <div className="relative grid min-h-[720px] grid-rows-[auto_minmax(0,1fr)] px-5 py-5 pl-[clamp(205px,19vw,292px)] xl:px-10 xl:py-10 xl:pl-[clamp(240px,20vw,310px)]">
          {/* existing date, draft menu, Preview, Publish, and Close controls */}
          {/* existing upload-gate banner */}
          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_clamp(250px,21vw,292px)] gap-5 xl:gap-7">
            {/* existing title, Tiptap editor, attachments, and toolbar */}
            {/* existing access, tags, quality, overview, and assistant content */}
          </div>
        </div>
      </main>
    </div>
    {closeConfirmationPortal}
    {videoRecorderDialog}
  </>
);
```

Do not copy logic into a new component. Move the existing JSX fragments and keep their handlers intact.

- [ ] **Step 4: Build the reference header from existing handlers**

Use the existing date, draft dropdown, preview toast, submit handler, and close handler:

```tsx
<header className="mb-5 flex min-w-0 items-center justify-between gap-4 xl:mb-8">
  <div className="flex items-center gap-2 font-geist text-sm text-[rgba(15,7,0,0.56)]">
    <CalendarDays aria-hidden className="text-[#67b7df]" />
    <span>{formattedToday}</span>
  </div>

  <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-3">
    {/* existing drafts DropdownMenu, rendered as a ghost `Drafts` button */}
    <div className="hidden items-center gap-2 text-sm text-[rgba(15,7,0,0.48)] lg:flex">
      <Cloud aria-hidden />
      <span>{savedDraftSignature === currentDraftSignature ? "Draft saved" : "Not saved"}</span>
    </div>
    <Button type="button" variant="outline" size="lg" onClick={() => toast.message("Preview is not available yet.")}>
      <Play data-icon="inline-start" />
      Preview
    </Button>
    <Button type="button" size="lg" onClick={handleSubmit} disabled={isMutating || isUploading}>
      Publish Story
      <Spinner loading={isMutating} className="size-4!" />
    </Button>
    <Button type="button" variant="ghost" size="icon-lg" onClick={handleClose} aria-label="Close">
      <X />
    </Button>
  </div>
</header>
```

Add truthful local-draft state near the other state declarations:

```tsx
const [savedDraftSignature, setSavedDraftSignature] = useState<string | null>(null);
```

Derive the live signature after `bodyPlainText` is available:

```tsx
const currentDraftSignature = JSON.stringify({
  title: values.title.trim(),
  body: bodyPlainText,
  tags,
  attachmentIds: files.map((file) => file.uploadedFile?._id ?? file.id),
});
```

At the end of `handleSaveDraft`, after storing the draft, compute and store the signature from values already available to the callback:

```tsx
setSavedDraftSignature(
  JSON.stringify({
    title: values.title.trim(),
    body: editor?.getText() ?? "",
    tags,
    attachmentIds: files.map((file) => file.uploadedFile?._id ?? file.id),
  }),
);
```

The callback already depends on `editor`, `files`, `tags`, and `values.title`, so its dependency list remains valid. This reports only the existing local save action and does not invent API autosave.

- [ ] **Step 5: Run the focused tests**

```bash
pnpm vitest run --project=unit src/components/modal/memory/create/index.test.tsx
```

Expected: the shell/title tests progress to PASS; remaining failures should be limited to tabs and Story Quality until Task 3.

- [ ] **Step 6: Commit the shell**

```bash
git add src/components/modal/memory/create/index.tsx src/components/modal/memory/create/index.test.tsx
git commit -m "feat: compose add story journal shell"
```

### Task 3: Reuse the property panel inside controlled shadcn tabs

**Files:**
- Modify: `src/components/modal/memory/create/index.tsx:1450-1605`
- Test: `src/components/modal/memory/create/index.test.tsx:430-480`

- [ ] **Step 1: Replace the manual tab buttons with controlled shadcn Tabs**

Use the existing `activeSidebarTab` state and assistant callback:

```tsx
<aside
  data-testid="desktop-story-details"
  className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[rgba(74,55,40,0.14)] bg-[rgba(248,244,237,0.42)] p-4"
>
  <Tabs
    value={activeSidebarTab}
    onValueChange={(value) => setActiveSidebarTab(value as "properties" | "assistant")}
    className="min-h-0 flex-1 gap-5"
  >
    <TabsList className="h-9 rounded-[10px] bg-transparent p-0">
      <TabsTrigger value="properties" className="rounded-[8px] px-3 data-active:bg-[rgba(15,7,0,0.09)]">
        Story Details
      </TabsTrigger>
      <TabsTrigger value="assistant" className="rounded-[8px] px-3 data-active:bg-[rgba(15,7,0,0.09)]">
        Assistant
      </TabsTrigger>
    </TabsList>

    <TabsContent value="properties" className="hide-scrollbar min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-6">
        <AccessField
          value={selectedAccess}
          onChange={setSelectedAccess}
          shareAudience={shareAudience}
          onShareAudienceChange={setShareAudience}
          variant="panel"
        />
        <TagsField
          tags={tags}
          setTags={setTags}
          title={values.title ?? ""}
          body={bodyPlainText}
          variant="panel"
        />
        {/* Story Quality checklist and existing Story Overview */}
      </div>
    </TabsContent>

    <TabsContent value="assistant" className="hide-scrollbar min-h-0 overflow-y-auto">
      {STORY_COMPOSER_ASSISTANT_VARIANT === "coming-soon" ? (
        <CreateMemoryAssistantComingSoonPanel />
      ) : (
        <CreateMemoryAssistantPanel
          input={assistantInput}
          isWorking={isAssistantWorking}
          messages={assistantMessages}
          onApplyAction={(action) => {
            applyAssistantAction(action);
            setActiveSidebarTab("properties");
          }}
          onInputChange={setAssistantInput}
          onSubmit={submitAssistantMessage}
          suggestions={assistantSuggestions}
          tone={assistantTone}
          onToneChange={setAssistantTone}
        />
      )}
    </TabsContent>
  </Tabs>
</aside>
```

- [ ] **Step 2: Replace the circular quality visualization with the existing checklist data**

Remove `completedQualityChecks`, `storyQuality`, and `storyQualityLabel` because the new UI does not use a score. Render:

```tsx
<section className="flex flex-col gap-3">
  <h3 className="font-geist text-base font-semibold text-[rgba(15,7,0,0.9)]">
    Story quality
  </h3>
  <div className="rounded-[12px] border border-[rgba(15,7,0,0.06)] bg-[rgba(15,7,0,0.025)] px-3 py-2">
    {qualityChecks.map((item) => (
      <div key={item.label} className="flex items-center justify-between gap-3 py-1">
        <span className="font-geist text-sm text-[rgba(15,7,0,0.82)]">{item.label}</span>
        {item.complete ? (
          <Check aria-label={`${item.label} complete`} className="text-[#6f8f73]" />
        ) : (
          <Circle aria-label={`${item.label} incomplete`} className="text-[rgba(15,7,0,0.18)]" />
        )}
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Update the assistant interaction test to use the tab role**

Use:

```tsx
await user.click(screen.getByRole("tab", { name: "Assistant" }));
expect(screen.getByRole("tab", { name: "Assistant" })).toHaveAttribute("data-active", "");
expect(screen.getByText(/assistant coming soon!/i)).toBeInTheDocument();
```

- [ ] **Step 4: Run the focused tests and verify they pass**

```bash
pnpm vitest run --project=unit src/components/modal/memory/create/index.test.tsx
```

Expected: PASS for the journal, toolbar, tab, title focus, Story Quality, media anchoring, and mobile sheet tests.

- [ ] **Step 5: Commit the panel**

```bash
git add src/components/modal/memory/create/index.tsx src/components/modal/memory/create/index.test.tsx
git commit -m "feat: place story details in journal panel"
```

### Task 4: Finish the borderless editor and restrained toolbar

**Files:**
- Modify: `src/components/modal/memory/create/index.tsx:1605-1960`
- Modify: `src/index.css:987-1070`
- Test: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Make the paper itself the editor surface**

Use the existing title textarea and editor without a bordered card:

```tsx
<section className="flex min-h-0 flex-col overflow-hidden pr-1">
  <div className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pt-8 xl:px-3 xl:pt-10" data-testid="desktop-composer-scroll-surface">
    <textarea
      ref={titleTextareaRef}
      id="create-memory-title-next"
      placeholder="Give this story a title..."
      value={values.title}
      name="title"
      onChange={handleTitleChange}
      onKeyDown={handleTitleKeyDown}
      rows={1}
      className="w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-garamond text-[clamp(2rem,3vw,2.5rem)] italic leading-[1.15] text-[rgba(39,31,24,0.86)] outline-none placeholder:text-[rgba(70,61,53,0.5)]"
    />
    <div className="relative mt-6 flex min-h-[240px] flex-1 flex-col">
      <EditorContent editor={editor} className="tiptap-editor tiptap-editor--memory-next min-h-[240px] w-full flex-1" />
      {/* existing SlashCommandPopup and LinkInput */}
    </div>
    <div data-testid="desktop-composer-media-section" className={cn("mt-auto", inlineAttachmentFiles.length > 0 ? "pt-6" : "pt-0")}>
      {inlineAttachmentFiles.length > 0 ? (
        <FileThumbnails files={inlineAttachmentFiles} onRemove={handleRemoveFile} variant="media-inline" />
      ) : null}
    </div>
  </div>
  {/* existing toolbar, restyled below */}
</section>
```

- [ ] **Step 2: Reuse the existing toolbar controls in a floating utility bar**

Keep every existing upload and editor handler. Change only the toolbar containers and control presentation:

```tsx
<div className="mt-4 max-w-[760px] rounded-[14px] border border-[rgba(74,55,40,0.06)] bg-[rgba(232,226,216,0.64)] px-3 py-2 shadow-[0_8px_24px_rgba(61,45,32,0.06)] backdrop-blur-[6px]">
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-1.5">{/* existing add, emoji, mic, video controls */}</div>
    <div className="flex items-center gap-1">{/* existing formatting controls */}</div>
  </div>
</div>
```

Use `aria-label` on every icon button and retain `title` on formatting controls. Add `data-icon="inline-start"` only to icons inside text buttons. Do not add a tooltip dependency.

- [ ] **Step 3: Scope the desktop editor typography and journal entrance in `src/index.css`**

Add after the current memory-next editor rules:

```css
.add-story-journal {
  animation: add-story-journal-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes add-story-journal-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.992);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tiptap-editor--memory-next .ProseMirror {
  min-height: 240px;
  height: 100%;
  overflow-y: visible;
}

.tiptap-editor--memory-next .ProseMirror p.is-editor-empty:first-child::before {
  color: rgba(70, 61, 53, 0.5);
  content: "Write story here...";
}

.tiptap-editor--memory-next .ProseMirror,
.tiptap-editor--memory-next .ProseMirror p,
.tiptap-editor--memory-next .ProseMirror li,
.tiptap-editor--memory-next .ProseMirror blockquote {
  font-size: 18px;
  line-height: 1.7;
  color: rgba(39, 31, 24, 0.86);
}

@media (prefers-reduced-motion: reduce) {
  .add-story-journal {
    animation: add-story-journal-fade 160ms ease-out both;
  }
}

@keyframes add-story-journal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 4: Ensure press feedback is purposeful and does not animate keyboard actions**

Apply the active scale only to pointer-capable devices and only inside the journal:

```css
@media (hover: hover) and (pointer: fine) {
  .add-story-journal button:not(:disabled):active {
    transform: scale(0.97);
    transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
  }
}
```

- [ ] **Step 5: Run tests and build**

```bash
pnpm vitest run --project=unit src/components/modal/memory/create/index.test.tsx
pnpm build
```

Expected: both commands exit 0 with no TypeScript or Vite build errors.

- [ ] **Step 6: Commit editor polish**

```bash
git add src/components/modal/memory/create/index.tsx src/index.css src/components/modal/memory/create/index.test.tsx
git commit -m "feat: polish add story editor and toolbar"
```

### Task 5: Verify responsive behavior and regressions

**Files:**
- Modify if required: `src/components/modal/memory/create/index.tsx`
- Modify if required: `src/index.css`
- Modify if required: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Run the complete focused regression set**

```bash
pnpm vitest run --project=unit \
  src/components/modal/memory/create/index.test.tsx \
  src/components/modal/memory/create/file-thumbnails.test.tsx \
  src/components/modal/memory/create/create-memory-assistant-coming-soon-panel.test.tsx
```

Expected: PASS with no unhandled errors.

- [ ] **Step 2: Run repository quality checks**

```bash
pnpm lint
pnpm build
```

Expected: both commands exit 0. If lint reports pre-existing errors outside the touched files, record them separately and confirm the touched files add no new lint failures.

- [ ] **Step 3: Start the web app for browser verification**

```bash
pnpm run dev -- --host 127.0.0.1
```

Expected: Vite reports a local development URL.

- [ ] **Step 4: Inspect the Add Story desktop flow at reference and compact widths**

Open the authenticated Add Story flow and verify at these viewports:

```text
1440 × 1000 — reference composition
1280 × 800  — compact desktop
1024 × 768  — tablet landscape desktop branch
```

At every width confirm:

```text
- journal artwork is not distorted or cropped away from the rings
- interactive content stays clear of the binder
- editor remains wider than the details panel
- title and body are readable and borderless
- details panel stays inline and independently scrollable when necessary
- toolbar remains usable without wrapping over the editor
- draft menu, upload menu, tabs, Preview, Publish, and Close respond
- no horizontal viewport overflow appears
```

- [ ] **Step 5: Verify reduced motion and keyboard interaction**

Emulate `prefers-reduced-motion: reduce`, reopen Add Story, and confirm the shell only fades. Tab through the header, editor, toolbar, tabs, visibility control, and tag input; confirm focus remains visible and Enter on the title still focuses the editor.

- [ ] **Step 6: Inspect the untouched mobile branch**

Render or open Add Story through the existing mobile route and confirm the `react-modal-sheet` layout, `Add New Story` title, fields, and footer are unchanged. Review the production diff to ensure no edits occurred inside either legacy return block.

- [ ] **Step 7: Commit any verification fixes**

If visual or accessibility verification required changes:

```bash
git add src/components/modal/memory/create/index.tsx src/index.css src/components/modal/memory/create/index.test.tsx
git commit -m "fix: refine add story desktop responsiveness"
```

If no fixes were required, do not create an empty commit.

- [ ] **Step 8: Capture final evidence**

Record the passing command outputs, inspected viewport sizes, and final changed-file list. Confirm explicitly that no path under `../api` and no mobile/legacy JSX was modified.
