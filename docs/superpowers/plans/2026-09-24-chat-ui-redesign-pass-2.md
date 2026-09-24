# Chat UI Redesign Pass 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Figma-faithful chat media messages, link presentation, a conversation-only All files modal, and a full-screen file viewer without changing upload or persistence behavior.

**Architecture:** Derive a typed, deduplicated asset index from the active conversation's messages and use the existing paginated message endpoint to complete that index inside the modal without mutating the visible chat history. Split presentation into focused media-group and link-preview components, register one conversation-files modal in the existing modal stack, and restyle the existing file-preview modal so all entry points share the same viewer.

**Tech Stack:** React 19, TypeScript, Vite, React Markdown, SWR/Axios fetcher, Tailwind CSS 4 semantic tokens, existing shadcn Tabs/Input/Button primitives, Lucide icons, Vitest, Testing Library, MSW, Playwright.

---

## File map

**Create**

- `src/pages/dashboard/chat/conversation/conversation-assets.ts` — runtime message/attachment types, media classification, URL extraction, metadata normalization, deduplication, and tab filtering.
- `src/pages/dashboard/chat/conversation/conversation-assets.test.ts` — pure indexing and filtering coverage.
- `src/pages/dashboard/chat/conversation/chat-media-group.tsx` — single, two/three, four-plus, audio, and document attachment presentation.
- `src/pages/dashboard/chat/conversation/chat-media-group.test.tsx` — layout and exact viewer-index behavior.
- `src/pages/dashboard/chat/conversation/chat-link-preview.tsx` — shared metadata/plain-link presentation.
- `src/pages/dashboard/chat/conversation/chat-link-preview.test.tsx` — preview and fallback behavior.
- `src/components/modal/conversation-files/index.tsx` — modal shell, paginated completion, tabs, search, states, and item activation.
- `src/components/modal/conversation-files/conversation-files.test.tsx` — modal scoping, pagination, tabs, search, and error states.
- `src/components/modal/file-preview/file-preview.test.tsx` — viewer shell, actions, dots, and keyboard navigation.

**Modify**

- `src/utility/interface.ts` — make message attachments and optional existing link metadata explicit without changing the API payload.
- `src/pages/dashboard/chat/conversation/bubble.tsx` — compose attachments, captions, links, and message actions into one unit.
- `src/pages/dashboard/chat/conversation/bubble.test.tsx` — integration assertions for captions, links, and metadata placement.
- `src/pages/dashboard/chat/conversation/history.tsx` — consume the typed message fields rather than local casts.
- `src/pages/dashboard/chat/conversation/index.tsx` — open conversation-files with the active conversation ID and loaded message snapshot.
- `src/components/modal/chat-settings/enrichment-summary.tsx` — turn shortcuts into buttons and report the requested asset tab/kind.
- `src/components/modal/chat-settings/enrichment-summary.test.tsx` — shortcut routing.
- `src/components/modal/chat-settings/chat-preferences-panel.tsx` — forward the shortcut callback.
- `src/components/modal/chat-settings/chat-preferences-panel.test.tsx` — callback forwarding.
- `src/components/memory/sidebar-details.tsx` — forward the callback into compact chat settings.
- `src/components/memory/sidebar-details.test.tsx` — callback forwarding from the drawer.
- `src/components/modal/index.tsx` — register conversation-files, classify full-screen viewer behavior, and suppress the global Cancel/ESC pill for the two Figma modals.
- `src/components/modal/file-preview/index.tsx` — full-screen viewer state, exact initial index, arrows, dots, keyboard behavior, and shared date.
- `src/components/modal/file-preview/action-btns.tsx` — accessible icon actions in the fixed viewer header.
- `src/components/modal/file-preview/image.tsx` — contained responsive imagery.
- `src/components/modal/file-preview/video.tsx` — viewer-shell video sizing.
- `src/components/modal/file-preview/audio.tsx` — viewer-shell audio sizing.

## Task 1: Define and test the conversation asset model

**Files:**

- Create: `src/pages/dashboard/chat/conversation/conversation-assets.ts`
- Create: `src/pages/dashboard/chat/conversation/conversation-assets.test.ts`
- Modify: `src/utility/interface.ts`

- [ ] **Step 1: Write failing index tests**

Create tests covering MIME/extension classification, message dates, optional metadata, normalized URL deduplication, attachment ID deduplication, and search:

```ts
import { describe, expect, it } from "vitest";
import {
  buildConversationAssetIndex,
  filterConversationAssets,
} from "./conversation-assets";

describe("buildConversationAssetIndex", () => {
  it("indexes only the supplied conversation messages and deduplicates assets", () => {
    const index = buildConversationAssetIndex([
      {
        _id: "m1",
        user: "u1",
        role: "user",
        text: "See https://example.com/story?b=2&a=1",
        created_at: "2026-07-13T13:34:00.000Z",
        attatchments: [
          { _id: "f1", name: "lake.jpg", type: "image/jpeg", url: "/lake.jpg", size: 12 },
          { _id: "f2", name: "voice.m4a", type: "audio/mp4", url: "/voice.m4a", size: 20 },
        ],
      },
      {
        _id: "m2",
        user: "u1",
        role: "user",
        text: "Again https://example.com/story?a=1&b=2",
        created_at: "2026-07-14T10:00:00.000Z",
        attatchments: [
          { _id: "f1", name: "lake.jpg", type: "image/jpeg", url: "/lake.jpg", size: 12 },
          { _id: "f3", name: "notes.pdf", type: "application/pdf", url: "/notes.pdf", size: 30 },
        ],
      },
    ]);

    expect(index.media.map((item) => item.kind)).toEqual(["image", "audio"]);
    expect(index.docs.map((item) => item.file._id)).toEqual(["f3"]);
    expect(index.links).toHaveLength(1);
    expect(index.media[0]?.sharedAt).toBe("2026-07-13T13:34:00.000Z");
    expect(index.total).toBe(4);
  });

  it("uses supplied link metadata without requesting it", () => {
    const index = buildConversationAssetIndex([{
      _id: "m1",
      user: "u1",
      role: "user",
      text: "https://mymemento.io",
      created_at: "2026-07-13T13:34:00.000Z",
      link_metadata: [{ url: "https://mymemento.io", title: "Mymemento.io", domain: "mymemento.io" }],
    }]);
    expect(index.links[0]?.title).toBe("Mymemento.io");
  });
});

describe("filterConversationAssets", () => {
  it("matches filename, host, title, and type case-insensitively", () => {
    const index = buildConversationAssetIndex([{
      _id: "m1",
      user: "u1",
      role: "user",
      text: "https://example.com/Family-Trip",
      created_at: "2026-07-13T13:34:00.000Z",
      attatchments: [{ _id: "f1", name: "Passport.PDF", type: "application/pdf", url: "/passport.pdf", size: 12 }],
    }]);
    expect(filterConversationAssets(index, "passport").docs).toHaveLength(1);
    expect(filterConversationAssets(index, "example.com").links).toHaveLength(1);
    expect(filterConversationAssets(index, "missing").total).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests and verify the module is absent**

Run: `pnpm test -- src/pages/dashboard/chat/conversation/conversation-assets.test.ts`

Expected: FAIL because `./conversation-assets` does not exist.

- [ ] **Step 3: Add explicit message fields**

Extend `IMessage` in `src/utility/interface.ts` with the API's existing misspelled attachment key and optional metadata, keeping the wire spelling unchanged:

```ts
export interface ILinkMetadata {
  url: string;
  title?: string;
  domain?: string;
  favicon?: string;
  description?: string;
}

export interface IMessage {
  _id?: string;
  user: string;
  text: string;
  role: string;
  ai_model?: string;
  created_at: string;
  attatchments?: IFile[];
  link_metadata?: ILinkMetadata[];
}
```

- [ ] **Step 4: Implement the pure index**

Create `conversation-assets.ts` with these exported contracts and behavior:

```ts
import type { IFile, ILinkMetadata, IMessage } from "@/utility/interface";

export type ConversationMediaKind = "image" | "video" | "audio";
export type ConversationAssetTab = "media" | "docs" | "links";
export type ConversationMediaFilter = "all" | "images" | "videos" | "audio";

export type ConversationFilesRequest = {
  tab: ConversationAssetTab;
  mediaFilter?: Exclude<ConversationMediaFilter, "all">;
};

export type ConversationFileAsset = {
  key: string;
  file: IFile;
  kind: ConversationMediaKind | "document";
  messageId?: string;
  attachmentIndex: number;
  sharedAt?: string;
};

export type ConversationLinkAsset = ILinkMetadata & {
  key: string;
  url: string;
  messageId?: string;
  sharedAt?: string;
};

export type ConversationAssetIndex = {
  media: ConversationFileAsset[];
  docs: ConversationFileAsset[];
  links: ConversationLinkAsset[];
  total: number;
};

const URL_PATTERN = /https?:\/\/[^\s<>)\]}]+/gi;
const imageExt = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "heic"]);
const videoExt = new Set(["mp4", "mov", "webm", "m4v", "ogv"]);
const audioExt = new Set(["mp3", "wav", "m4a", "aac", "flac", "oga"]);

function extension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function classifyConversationFile(file: IFile): ConversationFileAsset["kind"] {
  const type = file.type?.toLowerCase() ?? "";
  const ext = extension(file.name);
  if (type.startsWith("image/") || imageExt.has(ext)) return "image";
  if (type.startsWith("video/") || videoExt.has(ext)) return "video";
  if (type.startsWith("audio/") || audioExt.has(ext)) return "audio";
  return "document";
}

export function normalizeSharedUrl(raw: string) {
  const url = new URL(raw);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.searchParams.sort();
  return url.toString();
}

export function extractSharedUrls(text = "") {
  return Array.from(text.matchAll(URL_PATTERN), ([value]) => value.replace(/[.,!?;:]+$/, ""));
}

export function buildConversationAssetIndex(messages: ReadonlyArray<Partial<IMessage>>): ConversationAssetIndex {
  const media: ConversationFileAsset[] = [];
  const docs: ConversationFileAsset[] = [];
  const links: ConversationLinkAsset[] = [];
  const fileKeys = new Set<string>();
  const linkKeys = new Set<string>();

  for (const message of messages) {
    for (const [attachmentIndex, file] of (message.attatchments ?? []).entries()) {
      const key = file._id || `${file.url}|${file.name}`;
      if (fileKeys.has(key)) continue;
      fileKeys.add(key);
      const kind = classifyConversationFile(file);
      const asset = { key, file, kind, messageId: message._id, attachmentIndex, sharedAt: message.created_at };
      (kind === "document" ? docs : media).push(asset);
    }

    const metadata = new Map((message.link_metadata ?? []).map((item) => [normalizeSharedUrl(item.url), item]));
    for (const rawUrl of extractSharedUrls(message.text)) {
      const url = normalizeSharedUrl(rawUrl);
      if (linkKeys.has(url)) continue;
      linkKeys.add(url);
      links.push({ key: url, url, ...metadata.get(url), messageId: message._id, sharedAt: message.created_at });
    }
  }

  return { media, docs, links, total: media.length + docs.length + links.length };
}

export function filterConversationAssets(index: ConversationAssetIndex, query: string): ConversationAssetIndex {
  const needle = query.trim().toLowerCase();
  if (!needle) return index;
  const media = index.media.filter(({ file, kind }) => `${file.name} ${file.type ?? ""} ${kind}`.toLowerCase().includes(needle));
  const docs = index.docs.filter(({ file }) => `${file.name} ${file.type ?? ""}`.toLowerCase().includes(needle));
  const links = index.links.filter((link) => `${link.title ?? ""} ${link.domain ?? ""} ${link.url}`.toLowerCase().includes(needle));
  return { media, docs, links, total: media.length + docs.length + links.length };
}
```

- [ ] **Step 5: Run the index tests**

Run: `pnpm test -- src/pages/dashboard/chat/conversation/conversation-assets.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the isolated model change**

Run: `git add src/utility/interface.ts src/pages/dashboard/chat/conversation/conversation-assets.ts src/pages/dashboard/chat/conversation/conversation-assets.test.ts && git commit -m "feat(chat): index conversation assets"`

Expected: one commit containing only these paths. If `src/utility/interface.ts` contains pre-existing unstaged user work, use `git add -p` and stage only the `IMessage`/`ILinkMetadata` hunk.

## Task 2: Build the chat media group

**Files:**

- Create: `src/pages/dashboard/chat/conversation/chat-media-group.tsx`
- Create: `src/pages/dashboard/chat/conversation/chat-media-group.test.tsx`
- Modify: `src/pages/dashboard/chat/conversation/bubble.tsx`
- Modify: `src/pages/dashboard/chat/conversation/bubble.test.tsx`

- [ ] **Step 1: Write failing media-layout tests**

Test one image, a three-item row, a six-item grid with `+2`, compact audio/document rows, and the exact clicked start index. Mock `useModal` and assert the payload:

```ts
const push = vi.fn();
vi.mock("@/hooks/use-modal", () => ({ useModal: () => ({ push }) }));

it("renders a six-file preview as four tiles and opens the exact tile", async () => {
  const files = Array.from({ length: 6 }, (_, index) => ({
    _id: `f${index}`,
    name: `${index}.jpg`,
    type: "image/jpeg",
    url: `/${index}.jpg`,
    size: 1,
  }));
  render(<ChatMediaGroup attachments={files} sharedAt="2026-07-13T13:34:00.000Z" />);
  expect(screen.getAllByRole("button", { name: /open .* in viewer/i })).toHaveLength(4);
  expect(screen.getByText("+2")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /open 2.jpg in viewer/i }));
  expect(push).toHaveBeenCalledWith("file-preview", {
    files: files.map((file) => ({ ...file, sharedAt: "2026-07-13T13:34:00.000Z" })),
    startIndex: 2,
  });
});
```

Add Bubble integration coverage asserting that the caption follows the media surface and the timestamp/action row follows the caption.

- [ ] **Step 2: Run the media tests and verify failure**

Run: `pnpm test -- src/pages/dashboard/chat/conversation/chat-media-group.test.tsx src/pages/dashboard/chat/conversation/bubble.test.tsx`

Expected: FAIL because `ChatMediaGroup` is absent and Bubble still renders independent attachment cards.

- [ ] **Step 3: Implement the media group**

Build `ChatMediaGroup` with these exact layout rules:

- Split visual items (`image`, `video`) from compact items (`audio`, `document`) using `classifyConversationFile`.
- Single visual: wrapper max width `min(100%, 380px)`, semantic weak fill, 4px padding, 8px radius; image uses `h-auto max-h-[420px] w-auto max-w-full object-contain`.
- Two or three visuals: one grid row, equal columns, 4px gap, each tile aspect `4/3` and `object-cover`.
- Four-plus visuals: `grid-cols-2`, four visible tiles, 4px gap, each tile aspect `4/3`; the fourth tile shows `+${count - 4}` only when positive.
- Video tiles use the signed URL hook, a muted metadata preview, dark translucent overlay, and a centered Play icon.
- Audio/document rows use semantic weak fill, 56px minimum height, truncated filename, and Mic/FileText icon.
- Every interactive tile has `aria-label="Open ${file.name || "file"} in viewer"`.
- Viewer payload contains the complete attachment array in source order and adds the same `sharedAt` value to each item.

Use a local UI extension rather than changing persisted `IFile`:

```ts
export type ConversationPreviewFile = IFile & { sharedAt?: string };
```

- [ ] **Step 4: Replace the inline preview in Bubble**

Remove `ChatAttachmentPreview` and its classification logic from `bubble.tsx`. Render a single message-content surface containing, in order: reply quote, `ChatMediaGroup`, message Markdown, and then the existing metadata/action row outside that surface. Do not render an empty text wrapper for attachment-only messages.

Pass `createdAt` as `sharedAt`. Preserve signed-media refresh through `ChatMediaGroup`.

- [ ] **Step 5: Run the media and Bubble tests**

Run: `pnpm test -- src/pages/dashboard/chat/conversation/chat-media-group.test.tsx src/pages/dashboard/chat/conversation/bubble.test.tsx`

Expected: PASS, including the existing signed-image refresh and image-only Reply tests.

- [ ] **Step 6: Commit the media-message slice**

Run: `git add -p src/pages/dashboard/chat/conversation/bubble.tsx src/pages/dashboard/chat/conversation/bubble.test.tsx src/pages/dashboard/chat/conversation/chat-media-group.tsx src/pages/dashboard/chat/conversation/chat-media-group.test.tsx && git commit -m "feat(chat): group message media"`

Expected: only task-owned hunks and the two new files are committed.

## Task 3: Add safe shared link previews

**Files:**

- Create: `src/pages/dashboard/chat/conversation/chat-link-preview.tsx`
- Create: `src/pages/dashboard/chat/conversation/chat-link-preview.test.tsx`
- Modify: `src/pages/dashboard/chat/conversation/bubble.tsx`
- Modify: `src/pages/dashboard/chat/conversation/bubble.test.tsx`

- [ ] **Step 1: Write failing link tests**

Cover the two modes and prohibit duplicate URL text:

```tsx
it("renders available metadata as a compact preview", () => {
  render(<ChatLinkPreview link={{ key: "https://mymemento.io/", url: "https://mymemento.io/", title: "Mymemento.io", domain: "mymemento.io" }} />);
  expect(screen.getByText("Mymemento.io")).toBeInTheDocument();
  expect(screen.getByText("mymemento.io")).toBeInTheDocument();
});

it("falls back to an accessible plain URL", () => {
  render(<ChatLinkPreview link={{ key: "https://example.com/", url: "https://example.com/" }} />);
  expect(screen.getByRole("link", { name: "https://example.com/" })).toHaveAttribute("rel", "noopener noreferrer");
});
```

In `bubble.test.tsx`, render a URL-only message with matching metadata and assert the URL appears only once and the metadata title appears.

- [ ] **Step 2: Run the link tests and verify failure**

Run: `pnpm test -- src/pages/dashboard/chat/conversation/chat-link-preview.test.tsx src/pages/dashboard/chat/conversation/bubble.test.tsx`

Expected: FAIL because the preview component and Bubble metadata prop are absent.

- [ ] **Step 3: Implement ChatLinkPreview**

Create a semantic anchor card. With metadata, show title, optional favicon, domain derived from metadata or `new URL(link.url).hostname`, and ExternalLink icon. Without metadata, show the wrapped underlined URL. Always use `target="_blank"`, `rel="noopener noreferrer"`, `break-all`, semantic token classes, and an accessible name.

- [ ] **Step 4: Integrate links without duplicating Markdown output**

Add `linkMetadata?: ILinkMetadata[]` to `IBubbleProps`. Build the message link index from one synthetic message. When the trimmed message contains only one extracted URL and metadata exists, render `ChatLinkPreview` instead of Markdown. For prose or metadata-free links, retain Markdown and replace the existing pill classes with normal underlined, wrapping link classes:

```tsx
className="break-all text-text-brand-strong underline underline-offset-2 hover:text-text-brand-strong/80"
```

Pass `m.link_metadata` from `history.tsx` and remove the attachment cast now covered by `IMessage`.

- [ ] **Step 5: Run link, Bubble, and History tests**

Run: `pnpm test -- src/pages/dashboard/chat/conversation/chat-link-preview.test.tsx src/pages/dashboard/chat/conversation/bubble.test.tsx src/pages/dashboard/chat/conversation/conversation-deep-dive.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the link slice**

Run: `git add -p src/pages/dashboard/chat/conversation/chat-link-preview.tsx src/pages/dashboard/chat/conversation/chat-link-preview.test.tsx src/pages/dashboard/chat/conversation/bubble.tsx src/pages/dashboard/chat/conversation/bubble.test.tsx src/pages/dashboard/chat/conversation/history.tsx && git commit -m "feat(chat): present shared links"`

Expected: only link and typed-History hunks are committed.

## Task 4: Implement the conversation-scoped All files modal

**Files:**

- Create: `src/components/modal/conversation-files/index.tsx`
- Create: `src/components/modal/conversation-files/conversation-files.test.tsx`
- Modify: `src/components/modal/index.tsx`

- [ ] **Step 1: Write failing modal tests**

Mock `fetcher`, `useModal`, and signed-media access. Cover:

- initial render from supplied messages before the network finishes;
- pagination through `next` until null;
- no request to `/files`;
- deduplication across supplied and fetched messages;
- Media/Docs/Links counts and filters;
- `initialTab` and `initialMediaFilter="audio"`;
- client-side search;
- empty/no-results states;
- partial-history warning and Retry;
- exact media item viewer payload.

Use modal data shaped as:

```ts
const data = {
  conversationId: "conversation-1",
  messages: loadedMessages,
  initialTab: "media" as const,
  initialMediaFilter: "images" as const,
};
```

- [ ] **Step 2: Run the modal test and verify failure**

Run: `pnpm test -- src/components/modal/conversation-files/conversation-files.test.tsx`

Expected: FAIL because the component is absent.

- [ ] **Step 3: Implement modal-local history completion**

In the modal, keep `allMessages`, `loadingOlder`, and `loadError` state. On conversation ID change, reset to the supplied snapshot. Use the existing authenticated `fetcher` in a guarded loop:

```ts
async function loadAllConversationMessages(conversationId: string) {
  const rows: Partial<IMessage>[] = [];
  let next: string | null = "";
  do {
    const response = await fetcher<{ messages?: Partial<IMessage>[]; next?: string | null }>(
      `${endpoint.aiPromptMessage}/${conversationId}?next=${encodeURIComponent(next ?? "")}`,
    );
    rows.push(...(response.data?.messages ?? []));
    next = response.data?.next ?? null;
  } while (next);
  return rows;
}
```

Prevent stale completion from replacing a newer conversation by checking a local `cancelled` flag in the effect cleanup. Merge by message `_id`; retain distinct ID-less optimistic messages using a key composed from role, created date, text, and attachment IDs.

- [ ] **Step 4: Compose the Figma modal**

Use the existing modal shell rather than nesting another overlay. Build a `w-[min(760px,calc(100vw-24px))] h-[min(925px,calc(100vh-24px))] overflow-hidden rounded-2xl bg-background shadow-xl` surface with:

- header using `All files (${index.total})`, circular close button, and shadcn `Input` search;
- controlled shadcn `Tabs`, with three equal triggers and active strong-fill styling;
- fixed header/tabs/search and one scrollable results body;
- four-column desktop visual grid, three columns under 768px, two columns under 480px;
- audio compact rows under the visual Media grid;
- document rows with filename, type, and size/date only when present;
- shared `ChatLinkPreview` in Links;
- Spinner plus `Loading older files…`, empty tab copy, `No results for “query”`, and an inline warning with Retry.

When a media cell is selected, push `file-preview` with only the conversation's viewable image/video items, preserve their order, and compute the selected index from the filtered array. Audio activation pushes the audio collection into the existing viewer/player behavior. Document rows use a normal file anchor/download action because the current viewer has no document renderer.

Wrap the modal surface in the installed `focus-trap-react` `FocusTrap`, initially focus the search field, allow Escape to remain owned by the modal stack, and record `document.activeElement` before activation so cleanup can restore focus to the invoking shortcut when it is still connected.

- [ ] **Step 5: Register the modal and suppress conflicting chrome**

Add `"conversation-files": ConversationFiles` to `MODAL_COMPONENTS`. Add `file-preview` to full-screen modal classification on desktop and mobile. Exclude both `file-preview` and `conversation-files` from the global Cancel/ESC pill. Keep outer-click closing for conversation-files and disable outer-click closing for file-preview.

- [ ] **Step 6: Run modal and modal-stack tests**

Run: `pnpm test -- src/components/modal/conversation-files/conversation-files.test.tsx src/hooks/use-modal.test.tsx`

Expected: PASS and all network assertions remain conversation-endpoint-only.

- [ ] **Step 7: Commit the All files slice**

Run: `git add src/components/modal/conversation-files/index.tsx src/components/modal/conversation-files/conversation-files.test.tsx && git add -p src/components/modal/index.tsx && git commit -m "feat(chat): add conversation files modal"`

Expected: the modal, its tests, and modal registry hunks are committed.

## Task 5: Wire chat-settings shortcuts to the active conversation

**Files:**

- Modify: `src/components/modal/chat-settings/enrichment-summary.tsx`
- Modify: `src/components/modal/chat-settings/enrichment-summary.test.tsx`
- Modify: `src/components/modal/chat-settings/chat-preferences-panel.tsx`
- Modify: `src/components/modal/chat-settings/chat-preferences-panel.test.tsx`
- Modify: `src/components/memory/sidebar-details.tsx`
- Modify: `src/components/memory/sidebar-details.test.tsx`
- Modify: `src/pages/dashboard/chat/conversation/index.tsx`

- [ ] **Step 1: Write failing shortcut tests**

Import `ConversationFilesRequest` from `conversation-assets.ts` and add `onOpenFiles` to the settings components with this contract:

```ts
type OpenFiles = (request: ConversationFilesRequest) => void;
```

Assert Images → `{ tab: "media", mediaFilter: "images" }`, Videos → `videos`, Audio → `audio`, Docs → `{ tab: "docs" }`, and Links → `{ tab: "links" }`. Assert the event reaches the callback through `ChatPreferencesPanel` and `SidebarDetails`.

- [ ] **Step 2: Run the shortcut tests and verify failure**

Run: `pnpm test -- src/components/modal/chat-settings/enrichment-summary.test.tsx src/components/modal/chat-settings/chat-preferences-panel.test.tsx src/components/memory/sidebar-details.test.tsx`

Expected: FAIL because shortcuts are still links to `/stories`.

- [ ] **Step 3: Convert the five shortcuts to callback buttons**

Replace the router Links in `EnrichmentSummary` with buttons preserving the same accessible labels and visual classes. Store the exact request beside each icon in the `shortcuts` array and call `onOpenFiles?.(request)`.

- [ ] **Step 4: Forward the callback through the drawer**

Add `onOpenConversationFiles?: (request: ConversationFilesRequest) => void` to `ChatPreferencesPanel`, `SidebarDetailsProps`, and `ContentProps`; pass it from `SidebarDetails` → `Content` → `ChatPreferencesPanel` → `EnrichmentSummary`.

- [ ] **Step 5: Open with the active conversation snapshot**

In `Conversation`, add:

```ts
const handleOpenConversationFiles = useCallback(
  ({ tab, mediaFilter }: ConversationFilesRequest) => {
    if (!memory?._id) return;
    push?.("conversation-files", {
      conversationId: memory._id,
      messages,
      initialTab: tab,
      initialMediaFilter: mediaFilter,
    });
  },
  [memory?._id, messages, push],
);
```

Pass it to `SidebarDetails`. The modal payload must contain no account-wide file collection.

- [ ] **Step 6: Run the shortcut and conversation tests**

Run: `pnpm test -- src/components/modal/chat-settings/enrichment-summary.test.tsx src/components/modal/chat-settings/chat-preferences-panel.test.tsx src/components/memory/sidebar-details.test.tsx src/pages/dashboard/chat/conversation/conversation-deep-dive.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the wiring slice**

Run: `git add -p src/components/modal/chat-settings/enrichment-summary.tsx src/components/modal/chat-settings/enrichment-summary.test.tsx src/components/modal/chat-settings/chat-preferences-panel.tsx src/components/modal/chat-settings/chat-preferences-panel.test.tsx src/components/memory/sidebar-details.tsx src/components/memory/sidebar-details.test.tsx src/pages/dashboard/chat/conversation/index.tsx && git commit -m "feat(chat): open conversation file filters"`

Expected: only the shortcut callback chain is committed.

## Task 6: Upgrade the existing file viewer

**Files:**

- Create: `src/components/modal/file-preview/file-preview.test.tsx`
- Modify: `src/components/modal/file-preview/index.tsx`
- Modify: `src/components/modal/file-preview/action-btns.tsx`
- Modify: `src/components/modal/file-preview/image.tsx`
- Modify: `src/components/modal/file-preview/video.tsx`
- Modify: `src/components/modal/file-preview/audio.tsx`

- [ ] **Step 1: Write failing viewer tests**

Cover:

- header filename and `Shared Jul 13, 2026 at 1:34 PM`;
- close and download actions, plus Delete only for a non-empty `_id`;
- `startIndex` clamped to the file list;
- left/right arrows and position dots for multiple files;
- no arrows/dots for one file;
- ArrowLeft/ArrowRight navigation without ArrowUp/ArrowDown interception;
- image uses contained sizing and a descriptive alt;
- deletion selects the nearest surviving item and closes after the final item.

- [ ] **Step 2: Run the viewer test and verify failure**

Run: `pnpm test -- src/components/modal/file-preview/file-preview.test.tsx`

Expected: FAIL against the current floating-action, small-card viewer.

- [ ] **Step 3: Build the full-viewport viewer shell**

Make `FilePreview` fill the modal layer with `fixed inset-0 bg-neutral-950/85`. Add a fixed semantic-background header with filename/shared date on the left and action buttons on the right. Center the active preview in `absolute inset-x-0 bottom-0 top-[72px] p-4 sm:p-8`.

Clamp index whenever `files` or `startIndex` changes:

```ts
const clampIndex = (value: number, length: number) => Math.max(0, Math.min(value, Math.max(0, length - 1)));
```

Use `classifyConversationFile` instead of calling `.includes` on optional `file.type`. Wrap the viewer in `FocusTrap` with the same trigger capture/restoration behavior as conversation-files. Render 120px translucent desktop arrow buttons centered vertically and 44px controls on narrow screens. Use disabled boundary behavior rather than wrapping. Dots sit above the safe-area bottom; active dot uses the brand token.

- [ ] **Step 4: Move actions into the header**

Remove Floating UI positioning from image/video/audio previews. Make `ActionBtn` a header control group with Lucide Trash2, Download, and X icons, `aria-label`s, 40px hit areas, semantic hover/focus states, existing download logic, and existing delete confirmation. Keep delete conditional on `_id`.

- [ ] **Step 5: Make each media preview fit the viewport**

- Image: `max-h-full max-w-full object-contain rounded-xl` and no decorative border.
- Video: reuse `VideoPlayer` in `h-full w-full max-w-[1200px] overflow-hidden rounded-xl` and pause inactive media.
- Audio: reuse `AudioPlayer` in a centered `w-full max-w-[618px] rounded-xl bg-background` panel and pause inactive media.

- [ ] **Step 6: Run viewer, signed-media, and modal tests**

Run: `pnpm test -- src/components/modal/file-preview/file-preview.test.tsx src/features/media/signed-media-access.test.tsx src/components/modal/conversation-files/conversation-files.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit the viewer slice**

Run: `git add -p src/components/modal/file-preview/index.tsx src/components/modal/file-preview/action-btns.tsx src/components/modal/file-preview/image.tsx src/components/modal/file-preview/video.tsx src/components/modal/file-preview/audio.tsx src/components/modal/file-preview/file-preview.test.tsx && git commit -m "feat(chat): redesign file viewer"`

Expected: only file-viewer changes are committed.

## Task 7: Figma fidelity, resilience, and full verification

**Files:**

- Modify: all task-owned files above only where verification exposes a defect

- [ ] **Step 1: Run the focused feature suite**

Run:

```bash
pnpm test -- \
  src/pages/dashboard/chat/conversation/conversation-assets.test.ts \
  src/pages/dashboard/chat/conversation/chat-media-group.test.tsx \
  src/pages/dashboard/chat/conversation/chat-link-preview.test.tsx \
  src/pages/dashboard/chat/conversation/bubble.test.tsx \
  src/components/modal/conversation-files/conversation-files.test.tsx \
  src/components/modal/file-preview/file-preview.test.tsx \
  src/components/modal/chat-settings/enrichment-summary.test.tsx \
  src/components/modal/chat-settings/chat-preferences-panel.test.tsx \
  src/components/memory/sidebar-details.test.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run shadcn lint against changed TSX files**

Run:

```bash
npx shadcn lint \
  src/pages/dashboard/chat/conversation/chat-media-group.tsx \
  src/pages/dashboard/chat/conversation/chat-link-preview.tsx \
  src/pages/dashboard/chat/conversation/bubble.tsx \
  src/components/modal/conversation-files/index.tsx \
  src/components/modal/file-preview/index.tsx \
  src/components/modal/file-preview/action-btns.tsx
```

Expected: no avoidable raw-color, primitive-composition, or accessibility findings. The viewer overlay may use a deliberate neutral-black alpha matching the supplied design; all cards and text use semantic tokens.

- [ ] **Step 3: Run repository checks**

Run: `pnpm test`

Expected: all unit tests PASS.

Run: `pnpm lint`

Expected: exit 0 with no new lint errors.

Run: `pnpm build`

Expected: Vite production build exits 0.

- [ ] **Step 4: Verify desktop light and dark layouts in the browser**

Run: `pnpm dev -- --host 127.0.0.1`

At 1440×1000, verify against the supplied Figma nodes:

- single image is prominent and uncropped;
- three images form one row;
- six images show a two-by-two preview with `+2`;
- captions and action metadata follow the full message group;
- metadata links and plain links both work;
- each shortcut opens the correct conversation-only tab/filter;
- All files is approximately 760px wide, uses a four-column visual grid, and has an opaque semantic background;
- viewer header, contained media, arrows, dots, download/delete/close, and exact clicked position work;
- switching the app theme keeps all surfaces opaque and legible.

- [ ] **Step 5: Verify responsive and keyboard behavior**

At 390×844, verify grid collapse, no page-level horizontal overflow, reachable viewer actions, and contained media. Using only the keyboard, verify shortcut focus, modal focus containment, tab selection, search, media activation, Left/Right navigation, Escape close, and focus restoration.

- [ ] **Step 6: Inspect the final diff for scope and accidental overlap**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: task files are identifiable separately from the user's pre-existing dirty files; no unrelated file is staged or modified by this pass.

- [ ] **Step 7: Commit verification fixes if any exist**

Run: `git add -p` for task-owned verification fixes, then `git commit -m "fix(chat): polish conversation media surfaces"`.

Expected: the commit contains only defects found during Task 7. If no fixes were required, do not create an empty commit.

## Completion checklist

- [ ] All files is derived exclusively from the active conversation's loaded and paginated messages.
- [ ] No `/files` account-library request is made by conversation-files.
- [ ] Upload, attachment IDs, persistence, and signed-media refresh remain unchanged.
- [ ] Media grouping, captions, links, modal, and viewer match the approved design specification.
- [ ] Existing actions are preserved and unsupported viewer actions are absent.
- [ ] Focus, keyboard, mobile width, light theme, and dark theme checks pass.
- [ ] Focused tests, full tests, lint, build, and shadcn lint pass.
