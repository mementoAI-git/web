# Story View Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop story-view side panel with the Add Story journal canvas, opening read-only and switching that same surface into an editable, saveable state.

**Architecture:** Extract the outer desktop journal environment from `CreateMemory` into a shared presentation component, leaving creation state in `CreateMemory`. Rewrite `ViewMemory` as a focused view/edit state owner that uses the shared journal, the existing editor/upload/access/tag primitives, and the current `PUT /memories/:id` contract. Keep `view-memory` as the only modal entry affected and make it full-screen on desktop.

**Tech Stack:** React 19, TypeScript, Vite, SWR/SWR Mutation, Tiptap, Testing Library, Vitest, MSW, Tailwind CSS, existing shadcn-style components.

---

## File Map

- Create `src/components/modal/memory/story-journal-shell.tsx`: shared desktop scenic background, album artwork, dated header, journal sizing, and two-column composer layout.
- Create `src/components/modal/memory/story-edit-state.ts`: pure conversion and payload-diff helpers for the inline editor.
- Create `src/components/modal/memory/story-edit-state.test.ts`: unit coverage for edit-state initialization and minimal update payloads.
- Create `src/components/modal/memory/view.test.tsx`: component coverage for read-only rendering, edit/cancel/save, failures, and close protection.
- Modify `src/components/modal/memory/create/index.tsx`: render the extracted shell without changing Add Story behavior.
- Modify `src/components/modal/memory/create/index.test.tsx`: protect shell reuse and existing desktop/mobile behavior.
- Modify `src/components/modal/memory/view.tsx`: replace the side panel with the shared journal and own inline edit state.
- Modify `src/components/memory/text-area/use-memory-editor.ts`: support controlled editable/read-only state for the shared Tiptap surface.
- Modify `src/components/modal/index.tsx`: classify desktop `view-memory` as full-screen instead of a right panel.
- Cover the `src/components/modal/index.tsx` classification through `src/components/modal/memory/view.test.tsx` rendered inside `Modal`.

### Task 1: Extract the shared desktop journal shell

**Files:**
- Create: `src/components/modal/memory/story-journal-shell.tsx`
- Modify: `src/components/modal/memory/create/index.tsx`
- Test: `src/components/modal/memory/create/index.test.tsx`

- [ ] **Step 1: Extend the existing Create Memory test with a failing shared-shell assertion**

Add an assertion that identifies the extracted component without changing existing visual expectations:

```tsx
expect(screen.getByTestId("desktop-story-environment")).toHaveAttribute(
  "data-story-journal",
  "true",
);
expect(screen.getByTestId("desktop-journal-shell")).toContainElement(
  screen.getByRole("button", { name: "Publish Story" }),
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/create/index.test.tsx -t "renders the desktop composer as a journal"
```

Expected: FAIL because `data-story-journal="true"` is not present.

- [ ] **Step 3: Create the shared shell**

Create `story-journal-shell.tsx` with this complete public interface and structure:

```tsx
import type { KeyboardEventHandler, ReactNode } from "react";
import albumArtwork from "@/assets/image/HD Album story bg memento.png";
import darkAlbumArtwork from "@/assets/image/HD Album story bg memento dark.png";
import scenicBackground from "@/assets/image/bg/1.png";
import calendarIcon from "@/assets/icon/uim_calendar.svg";
import { useTheme } from "@/contexts/theme";

interface StoryJournalShellProps {
  dateLabel: string;
  headerActions: ReactNode;
  storyContent: ReactNode;
  detailsContent: ReactNode;
  detailsOpen: boolean;
  overlays?: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

export function StoryJournalShell({
  dateLabel,
  headerActions,
  storyContent,
  detailsContent,
  detailsOpen,
  overlays,
  onKeyDown,
}: StoryJournalShellProps) {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <div
        data-testid="desktop-story-environment"
        data-story-journal="true"
        className="absolute inset-0 overflow-auto bg-cover bg-center py-4 pl-0 pr-4 xl:py-9 xl:pl-0 xl:pr-9 min-[1900px]:px-9"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 12, 8, 0.22), rgba(18, 12, 8, 0.22)), url(${scenicBackground})`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <main
          data-testid="desktop-journal-shell"
          className="add-story-journal relative mx-0 h-[calc(100dvh-32px)] min-h-[720px] w-full max-w-[1440px] overflow-hidden rounded-l-none rounded-r-[30px] shadow-[0_28px_80px_rgba(20,12,7,0.28)] xl:h-[calc(100dvh-72px)] min-[1900px]:mx-auto"
          onKeyDown={onKeyDown}
        >
          <img
            data-testid="desktop-album-artwork"
            src={resolvedTheme === "dark" ? darkAlbumArtwork : albumArtwork}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full rounded-l-none rounded-r-[30px] object-cover object-left-top"
          />
          <div className="relative grid h-full min-h-[720px] grid-rows-[auto_minmax(0,1fr)] gap-5 py-6 pl-[max(225px,22%,calc((100dvh-32px)*0.31))] pr-6 xl:gap-8 xl:py-10 xl:pl-[max(250px,22%,calc((100dvh-72px)*0.31))] xl:pr-10">
            <header className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex shrink-0 items-center gap-2 font-geist text-sm text-text-neutral-weak">
                <img src={calendarIcon} alt="" aria-hidden="true" className="size-4 object-contain" />
                <span>{dateLabel}</span>
              </div>
              <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-3">
                {headerActions}
              </div>
            </header>
            <div
              className="story-composer-layout grid min-h-0 gap-5 xl:gap-7"
              data-details-open={detailsOpen}
            >
              {storyContent}
              {detailsContent}
            </div>
          </div>
        </main>
      </div>
      {overlays}
    </>
  );
}
```

In `create/index.tsx`, remove the four shell asset imports and `useTheme`, import `StoryJournalShell`, and replace only the outer environment/artwork/header/grid markup. Pass the existing date, header controls, story section, details rail/panel, close-confirmation portal, and recorder dialog into the corresponding props. Keep file inputs adjacent to the shell so their refs and change handlers remain owned by `CreateMemory`.

- [ ] **Step 4: Run the focused Create Memory tests and verify GREEN**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/create/index.test.tsx
```

Expected: PASS, including light/dark artwork, mobile sheet, toolbar, drafts, details, and close-guard tests.

- [ ] **Step 5: Commit the extraction**

```bash
git add src/components/modal/memory/story-journal-shell.tsx src/components/modal/memory/create/index.tsx src/components/modal/memory/create/index.test.tsx
git commit -m "refactor: share desktop story journal shell"
```

### Task 2: Define and test inline story edit state

**Files:**
- Create: `src/components/modal/memory/story-edit-state.ts`
- Create: `src/components/modal/memory/story-edit-state.test.ts`

- [ ] **Step 1: Write failing unit tests for initialization and payload diffing**

```ts
import { describe, expect, it } from "vitest";
import type { IMemory } from "@/utility/interface";
import { buildStoryUpdatePayload, createStoryEditDraft } from "./story-edit-state";

const memory = {
  _id: "memory-1",
  title: "Sunday dinner",
  body: "<p>At home.</p>",
  attachments: [],
  tags: ["family"],
  groups: [{ _id: "group-1", name: "Family", color: 2 }],
  beneficiaries: [{ _id: "person-1", name: "Ada" }],
  visibility: "private",
} as IMemory;

describe("story edit state", () => {
  it("creates an isolated editable draft from a memory", () => {
    const draft = createStoryEditDraft(memory);
    expect(draft).toMatchObject({
      title: "Sunday dinner",
      body: "<p>At home.</p>",
      tags: ["family"],
      visibility: "private",
    });
    expect(draft.access.map(({ id, source }) => ({ id, source }))).toEqual([
      { id: "group-1", source: "group" },
      { id: "person-1", source: "beneficiary" },
    ]);
    expect(draft.tags).not.toBe(memory.tags);
  });

  it("returns an empty payload when the draft is unchanged", () => {
    expect(buildStoryUpdatePayload(memory, createStoryEditDraft(memory))).toEqual({});
  });

  it("returns only changed story fields", () => {
    const draft = createStoryEditDraft(memory);
    draft.title = "A new title";
    draft.tags = ["family", "food"];
    draft.visibility = "everyone";
    draft.access = [];
    expect(buildStoryUpdatePayload(memory, draft)).toEqual({
      title: "A new title",
      tags: ["family", "food"],
      visibility: "everyone",
      groups: [],
      beneficiaries: [],
    });
  });
});
```

- [ ] **Step 2: Run the unit test and verify RED**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/story-edit-state.test.ts
```

Expected: FAIL because `story-edit-state.ts` does not exist.

- [ ] **Step 3: Implement the pure edit-state module**

```ts
import type { IFile, IMemory } from "@/utility/interface";
import type { MemoryShareAudience, SearchResultItem } from "./create/access-field";

export interface StoryEditDraft {
  title: string;
  body: string;
  tags: string[];
  visibility: MemoryShareAudience;
  access: SearchResultItem[];
  attachments: IFile[];
}

export interface StoryUpdatePayload {
  title?: string;
  body?: string;
  tags?: string[];
  visibility?: MemoryShareAudience;
  groups?: string[];
  beneficiaries?: string[];
  attachments?: string[];
  removeAttachments?: string[];
}

const sorted = (values: string[]) => [...values].sort();
const sameIds = (left: string[], right: string[]) =>
  JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));

export function createStoryEditDraft(memory: IMemory): StoryEditDraft {
  return {
    title: memory.title ?? "",
    body: memory.body ?? "",
    tags: [...(memory.tags ?? [])],
    visibility: memory.visibility === "everyone" ? "everyone" : "private",
    access: [
      ...(memory.groups ?? []).flatMap((group) => group._id ? [{ id: group._id, name: group.name, source: "group" as const, color: group.color ?? 0 }] : []),
      ...(memory.beneficiaries ?? []).flatMap((person) => person._id ? [{ id: person._id, name: person.name, source: "beneficiary" as const, color: 0 }] : []),
    ],
    attachments: [...(memory.attachments ?? [])],
  };
}

export function buildStoryUpdatePayload(
  memory: IMemory,
  draft: StoryEditDraft,
  addedAttachmentIds: string[] = [],
  removedAttachmentIds: string[] = [],
): StoryUpdatePayload {
  const payload: StoryUpdatePayload = {};
  if (draft.title !== (memory.title ?? "")) payload.title = draft.title;
  if (draft.body !== (memory.body ?? "")) payload.body = draft.body;
  if (!sameIds(draft.tags, memory.tags ?? [])) payload.tags = draft.tags;
  const savedVisibility = memory.visibility === "everyone" ? "everyone" : "private";
  if (draft.visibility !== savedVisibility) payload.visibility = draft.visibility;

  const groups = draft.access.filter((item) => item.source === "group").map((item) => item.id);
  const beneficiaries = draft.access.filter((item) => item.source === "beneficiary").map((item) => item.id);
  const savedGroups = (memory.groups ?? []).flatMap((item) => item._id ? [item._id] : []);
  const savedBeneficiaries = (memory.beneficiaries ?? []).flatMap((item) => item._id ? [item._id] : []);
  if (!sameIds(groups, savedGroups) || !sameIds(beneficiaries, savedBeneficiaries)) {
    payload.groups = groups;
    payload.beneficiaries = beneficiaries;
  }

  if (addedAttachmentIds.length > 0 || removedAttachmentIds.length > 0) {
    payload.attachments = [
      ...draft.attachments.map((attachment) => attachment._id),
      ...addedAttachmentIds,
    ];
  }
  if (removedAttachmentIds.length > 0) payload.removeAttachments = removedAttachmentIds;
  return payload;
}
```

- [ ] **Step 4: Run the unit tests and verify GREEN**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/story-edit-state.test.ts
```

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit the state boundary**

```bash
git add src/components/modal/memory/story-edit-state.ts src/components/modal/memory/story-edit-state.test.ts
git commit -m "test: define inline story edit state"
```

### Task 3: Render the story viewer in the shared read-only journal

**Files:**
- Create: `src/components/modal/memory/view.test.tsx`
- Modify: `src/components/modal/memory/view.tsx`
- Modify: `src/components/modal/index.tsx`

- [ ] **Step 1: Write a failing read-only viewer test**

Use `renderWithProviders`, MSW, and a memory fixture. The test must prove that the same journal shell is used and no editor controls appear initially:

```tsx
it("opens a story in the shared journal in read-only mode", async () => {
  renderWithProviders(
    <ViewMemory data={{ memory: story }} isMobile={false} />,
    { auth: true },
  );

  expect(screen.getByTestId("desktop-journal-shell")).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "Sunday dinner" })).toBeInTheDocument();
  expect(screen.getByText("At home with everyone.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit story" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "Story title" })).not.toBeInTheDocument();
});
```

Add a modal-level assertion:

```tsx
expect(screen.getByTestId("desktop-story-environment").parentElement).toHaveClass("inset-0");
```

- [ ] **Step 2: Run the viewer test and verify RED**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/view.test.tsx -t "opens a story"
```

Expected: FAIL because the existing viewer is a `572px` side panel and has no shared journal shell.

- [ ] **Step 3: Make `view-memory` full-screen on desktop**

In `src/components/modal/index.tsx`, change the modal classifications to:

```ts
const RIGHT_PANEL_MODALS: string[] = [];
const FULL_SCREEN_MODALS = ["create-memory", "view-memory", "file-preview"];
```

Do not change the modal name, open calls, stack behavior, or mobile classification.

- [ ] **Step 4: Implement the read-only journal surface**

In `view.tsx`:

- keep the existing SWR fetch and `addToRecentMemories` effect;
- format the story date from `memory.created_at` with `Intl.DateTimeFormat`;
- render `StoryJournalShell` only for desktop;
- render the title as an `h1`, sanitized HTML as read-only selectable prose, and attachments with the existing `FileGallery`;
- render share, bookmark, overflow, Edit story, and Close actions as semantic `Button` controls;
- render a read-only details rail/panel with visibility, shared people/groups, tags, attachment counts, and reading time;
- keep the loading skeleton inside the journal and add a dismissible load-error state;
- do not render Tiptap, upload controls, drafts, or creation assistant controls in view mode.

Keep a local saved snapshot so a successful mutation can update the visible story immediately while SWR revalidates:

```tsx
type StoryViewerMode = "view" | "edit";
const [mode, setMode] = useState<StoryViewerMode>("view");
const isEditing = mode === "edit";

const { data: fetched, error, isLoading } = useSWR(
  memoryId ? `${endpoint.memories}/${memoryId}` : null,
);
const remoteMemory = (fetched?.data as IMemory | undefined) ?? data.memory;
const [localMemory, setLocalMemory] = useState<IMemory | undefined>(data.memory);

useEffect(() => {
  if (remoteMemory && mode === "view") setLocalMemory(remoteMemory);
}, [mode, remoteMemory]);

const memory = localMemory ?? remoteMemory;
```

Use that mode boundary for the header actions:

```tsx
<Button type="button" size="lg" onClick={() => setMode("edit")}>
  Edit story
</Button>
<Button type="button" variant="ghost" size="icon-lg" onClick={() => close("view-memory")} aria-label="Close story">
  <X aria-hidden />
</Button>
```

The read-only body must continue using the existing sanitization path:

```tsx
<div
  className="tiptap-editor tiptap-editor--memory-next prose prose-sm min-h-[240px] max-w-none font-geist text-lg leading-[1.7] text-text-neutral-strong"
  dangerouslySetInnerHTML={{
    __html: ensureLinksOpenInNewTab(
      DOMPurify.sanitize(ensureHtmlFormat(memory.body || "")),
    ),
  }}
/>
```

- [ ] **Step 5: Run the read-only and creation regression tests**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/view.test.tsx src/components/modal/memory/create/index.test.tsx
```

Expected: PASS; Add Story remains unchanged and the viewer uses the same shell.

- [ ] **Step 6: Commit the read-only replacement**

```bash
git add src/components/modal/index.tsx src/components/modal/memory/view.tsx src/components/modal/memory/view.test.tsx
git commit -m "feat: show stories in the journal canvas"
```

### Task 4: Add in-place editing, cancel, save, and failure recovery

**Files:**
- Modify: `src/components/memory/text-area/use-memory-editor.ts`
- Modify: `src/components/modal/memory/view.tsx`
- Modify: `src/components/modal/memory/view.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Add four focused tests:

```tsx
it("switches the same journal into editing mode and cancels back to the original story", async () => {
  const user = userEvent.setup();
  renderStory();
  const shell = screen.getByTestId("desktop-journal-shell");
  await user.click(screen.getByRole("button", { name: "Edit story" }));
  expect(screen.getByTestId("desktop-journal-shell")).toBe(shell);
  const title = screen.getByRole("textbox", { name: "Story title" });
  await user.clear(title);
  await user.type(title, "Changed locally");
  await user.click(screen.getByRole("button", { name: "Cancel editing" }));
  expect(screen.getByRole("heading", { name: "Sunday dinner" })).toBeInTheDocument();
  expect(screen.queryByDisplayValue("Changed locally")).not.toBeInTheDocument();
});

it("saves edits and returns the same journal to read-only mode", async () => {
  let updateBody: unknown;
  server.use(http.put("http://localhost:3000/api/memories/memory-1", async ({ request }) => {
    updateBody = await request.json();
    return HttpResponse.json({ success: true, data: { ...story, title: "Updated title" } });
  }));
  const user = userEvent.setup();
  renderStory();
  await user.click(screen.getByRole("button", { name: "Edit story" }));
  const title = screen.getByRole("textbox", { name: "Story title" });
  await user.clear(title);
  await user.type(title, "Updated title");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("heading", { name: "Updated title" })).toBeInTheDocument();
  expect(updateBody).toMatchObject({ title: "Updated title" });
});

it("keeps the working copy when saving fails", async () => {
  server.use(http.put("http://localhost:3000/api/memories/memory-1", () => HttpResponse.error()));
  const user = userEvent.setup();
  renderStory();
  await user.click(screen.getByRole("button", { name: "Edit story" }));
  const title = screen.getByRole("textbox", { name: "Story title" });
  await user.clear(title);
  await user.type(title, "Unsaved title");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByDisplayValue("Unsaved title")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
});

it("protects unsaved edits before closing the story", async () => {
  const user = userEvent.setup();
  renderViewerInsideModal();
  await user.click(screen.getByRole("button", { name: "Edit story" }));
  await user.type(screen.getByRole("textbox", { name: "Story title" }), " changed");
  await user.click(screen.getByRole("button", { name: "Close story" }));
  expect(screen.getByRole("dialog", { name: "Discard story changes?" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the interaction tests and verify RED**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/view.test.tsx
```

Expected: FAIL because edit mode, save behavior, and close protection are not implemented.

- [ ] **Step 3: Add controlled editable state to the memory editor hook**

Add `editable` to `UseMemoryEditorParams`, destructure it with a `true` default, pass it to `useEditor`, and synchronize Tiptap when the prop changes:

```tsx
import { useEffect, useState } from "react";

interface UseMemoryEditorParams {
  initialContent?: string;
  placeholder: string;
  editorClassName: string;
  linkClassName: string;
  onHtmlChange: (html: string) => void;
  onTextChange?: (text: string) => void;
  editable?: boolean;
}

export function useMemoryEditor({
  initialContent = "",
  placeholder,
  editorClassName,
  linkClassName,
  onHtmlChange,
  onTextChange,
  editable = true,
}: UseMemoryEditorParams) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: linkClassName,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
    ],
    content: initialContent,
    editorProps: { attributes: { class: editorClassName } },
    onUpdate: ({ editor: currentEditor }) => {
      onHtmlChange(currentEditor.getHTML());
      onTextChange?.(currentEditor.getText());

      const { selection } = currentEditor.state;
      const textBefore = selection.$anchor.parent.textContent.slice(
        0,
        selection.$anchor.parentOffset,
      );
      const lastSlashIndex = textBefore.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        setShowSlashMenu(false);
        return;
      }
      const query = textBefore.slice(lastSlashIndex + 1);
      if (query.includes(" ") || query.includes("\n")) {
        setShowSlashMenu(false);
        return;
      }
      const coords = currentEditor.view.coordsAtPos(selection.from);
      setSlashPosition({ top: coords.top + 20, left: coords.left });
      setShowSlashMenu(true);
      setSlashSelectedIndex(0);
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

}
```

Keep the default `true` so Create Memory and the legacy update surface do not change.

- [ ] **Step 4: Implement view-to-edit state initialization**

When Edit is selected:

```tsx
const beginEditing = () => {
  if (!memory) return;
  const nextDraft = createStoryEditDraft(memory);
  setDraft(nextDraft);
  setRemovedAttachmentIds([]);
  setFiles([]);
  editor?.commands.setContent(nextDraft.body);
  setMode("edit");
};
```

Render the Add Story title textarea, Tiptap editor, formatting strip, `FileThumbnails`, `AccessField variant="panel"`, and `TagsField variant="panel"` only in edit mode. Move the existing MIME validation, `handleUpload` calls, audio-recorder callback, and video-recorder callback from `CreateMemory` into small shared functions only when the viewer needs the identical behavior; do not create a second API upload implementation.

- [ ] **Step 5: Implement cancel and unsaved-change protection**

Derive dirty state from the pure payload plus pending attachment changes:

```tsx
const pendingPayload = memory && draft
  ? buildStoryUpdatePayload(memory, draft, uploadedFileIds, removedAttachmentIds)
  : {};
const isDirty = Object.keys(pendingPayload).length > 0 || files.length > 0;

const cancelEditing = () => {
  if (isDirty) {
    setPendingExit("cancel");
    return;
  }
  setMode("view");
};
```

Register a `view-memory` close guard while editing. Use the existing shadcn `Dialog` pattern with accessible title **Discard story changes?**, body copy explaining that unsaved changes will be lost, and actions **Keep editing** / **Discard changes**. Discarding after Cancel returns to view; discarding after Close calls `close("view-memory", { force: true })`.

- [ ] **Step 6: Implement save and cache refresh**

Use the existing mutation hook:

```tsx
const { trigger: updateStory, isMutating } = useFetcher(
  memory ? `${endpoint.memories}/${memory._id}` : "",
  "put",
);

const saveChanges = async () => {
  if (!memory || !draft || isMutating || isUploading) return;
  const payload = buildStoryUpdatePayload(
    memory,
    draft,
    uploadedFileIds,
    removedAttachmentIds,
  );
  if (Object.keys(payload).length === 0) {
    setMode("view");
    return;
  }
  try {
    const response = await updateStory(payload);
    if (!response?.success) throw new Error(response?.message || "Could not save your story.");
    await Promise.all([
      mutate(`${endpoint.memories}/${memory._id}`),
      mutate(endpoint.memories),
      mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories)),
    ]);
    const uploadedAttachments = files.flatMap((file) =>
      file.uploadedFile ? [file.uploadedFile] : [],
    );
    setLocalMemory({
      ...memory,
      title: draft.title,
      body: draft.body,
      tags: [...draft.tags],
      visibility: draft.visibility,
      groups: draft.access
        .filter((item) => item.source === "group")
        .map((item) => ({ _id: item.id, name: item.name, color: item.color })),
      beneficiaries: draft.access
        .filter((item) => item.source === "beneficiary")
        .map((item) => ({ _id: item.id, name: item.name })),
      attachments: [...draft.attachments, ...uploadedAttachments],
    });
    setMode("view");
    toast.success("Story updated");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not save your story. Try again.");
  }
};
```

Disable Save while unchanged, uploading, or saving; include the existing `Spinner`; preserve the draft on every failure path.

- [ ] **Step 7: Run the full viewer test and verify GREEN**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/view.test.tsx
```

Expected: PASS for view, edit, cancel, save, failure, and unsaved-close behavior.

- [ ] **Step 8: Run adjacent memory-modal regression tests**

Run:

```bash
npx vitest run --project=unit src/components/modal/memory/create/index.test.tsx src/components/modal/memory/view.test.tsx src/components/modal/memory/create/file-thumbnails.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit inline editing**

```bash
git add src/components/memory/text-area/use-memory-editor.ts src/components/modal/memory/view.tsx src/components/modal/memory/view.test.tsx
git commit -m "feat: edit viewed stories in place"
```

### Task 5: Product-convention and repository verification

**Files:**
- Modify only files with issues found by the checks above.

- [ ] **Step 1: Run formatting and changed-file lint checks**

Run:

```bash
npx prettier --write src/components/modal/memory/story-journal-shell.tsx src/components/modal/memory/story-edit-state.ts src/components/modal/memory/story-edit-state.test.ts src/components/modal/memory/view.tsx src/components/modal/memory/view.test.tsx src/components/modal/memory/create/index.tsx src/components/modal/memory/create/index.test.tsx src/components/memory/text-area/use-memory-editor.ts src/components/modal/index.tsx
npx eslint src/components/modal/memory/story-journal-shell.tsx src/components/modal/memory/story-edit-state.ts src/components/modal/memory/story-edit-state.test.ts src/components/modal/memory/view.tsx src/components/modal/memory/view.test.tsx src/components/modal/memory/create/index.tsx src/components/modal/memory/create/index.test.tsx src/components/memory/text-area/use-memory-editor.ts src/components/modal/index.tsx
```

Expected: exit 0 with no ESLint errors or `shadcn/no-raw-colors` warnings.

- [ ] **Step 2: Perform the required variable review**

Review every added `text-*`, `bg-*`, `border-*`, `fill-*`, and icon class against `docs/COLOR_INVENTORY.md` and `.cursor/rules/v3-color-system-usage.mdc`. Report one line per issue and fix it. When clean, record:

```text
All variables applied correctly.
```

- [ ] **Step 3: Run the complete unit suite**

Run:

```bash
npm test
```

Expected: exit 0 with no failing unit tests.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: exit 0 and a completed Vite production build.

- [ ] **Step 5: Inspect the final diff against scope**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~3..HEAD
```

Expected: no whitespace errors; only the planned story UI, tests, shared shell/editor support, modal classification, and plan/spec files are changed.

- [ ] **Step 6: Commit any verification fixes**

```bash
git add src/components/modal src/components/memory/text-area/use-memory-editor.ts
git commit -m "chore: verify story journal viewer"
```

Skip this commit only if the verification pass produces no file changes.
