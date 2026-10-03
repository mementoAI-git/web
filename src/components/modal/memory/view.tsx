import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
import DOMPurify from "isomorphic-dompurify";
import {
  Bookmark,
  Check,
  Circle,
  ListFilter,
  ListTree,
  PanelRightClose,
  Share2,
  X,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import FileGallery from "@/components/file-gallery";
import { BookmarkSolidIcon } from "@/components/icons";
import { useMemoryEditor } from "@/components/memory/text-area/use-memory-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { useBookmark } from "@/hooks/use-bookmark";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { MemoryDropdown } from "@/pages/dashboard/chat/conversation/dropdown";
import { addToRecentMemories, ensureLinksOpenInNewTab } from "@/utility";
import type { IMemory, IOnUploadPayload } from "@/utility/interface";
import { AccessField } from "./create/access-field";
import { FileThumbnails } from "./create/file-thumbnails";
import { TagsField } from "./create/tags-field";
import {
  buildStoryUpdatePayload,
  createStoryEditDraft,
  type StoryEditDraft,
} from "./story-edit-state";
import { StoryJournalShell } from "./story-journal-shell";

function ensureHtmlFormat(body: string): string {
  const trimmed = (body || "").trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

interface ViewMemoryProps {
  data: { memoryId?: string; memory?: IMemory };
  isMobile?: boolean;
}

type StoryViewerMode = "view" | "edit";
type PendingExit = "cancel" | "close" | null;

export function ViewMemory({ data, isMobile }: ViewMemoryProps) {
  const { close, push, registerCloseGuard } = useModal();
  const { user } = useStore();
  const memoryId = data.memoryId || data.memory?._id;
  const [mode, setMode] = useState<StoryViewerMode>("view");
  const [localMemory, setLocalMemory] = useState<IMemory | undefined>(
    data.memory,
  );
  const [draft, setDraft] = useState<StoryEditDraft | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pendingExit, setPendingExit] = useState<PendingExit>(null);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    [],
  );
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const hasLocalSaveRef = useRef(false);

  const {
    data: fetched,
    error,
    isLoading,
  } = useSWR(memoryId ? `${endpoint.memories}/${memoryId}` : null);
  const remoteMemory = (fetched?.data as IMemory | undefined) ?? data.memory;
  const memory = localMemory ?? remoteMemory;
  const isEditing = mode === "edit";

  useEffect(() => {
    if (remoteMemory && mode === "view" && !hasLocalSaveRef.current) {
      setLocalMemory(remoteMemory);
    }
  }, [mode, remoteMemory]);

  useEffect(() => {
    if (memory && !isLoading) addToRecentMemories(memory, user?.email);
  }, [isLoading, memory, user?.email]);

  const updateDraftBody = useCallback((body: string) => {
    setDraft((current) => (current ? { ...current, body } : current));
  }, []);

  const { editor } = useMemoryEditor({
    initialContent: data.memory?.body ?? "",
    placeholder: "Write story here...",
    editorClassName:
      "prose prose-sm max-w-none focus:outline-none min-h-[240px] w-full px-0 py-0 font-geist text-lg leading-[1.7] text-text-neutral-strong",
    linkClassName: "text-text-brand-strong underline cursor-pointer",
    onHtmlChange: updateDraftBody,
    editable: isEditing,
  });

  useEffect(() => {
    if (!isEditing && memory) editor?.commands.setContent(memory.body || "");
  }, [editor, isEditing, memory]);

  const { toggleBookmark } = useBookmark({
    memoryId: memory?._id,
    isBookmarked: memory?.bookmarked,
  });
  const { trigger: updateStory, isMutating } = useFetcher(
    memory ? `${endpoint.memories}/${memory._id}` : "",
    "put",
  );

  const pendingPayload = useMemo(
    () =>
      memory && draft
        ? buildStoryUpdatePayload(memory, draft, [], removedAttachmentIds)
        : {},
    [draft, memory, removedAttachmentIds],
  );
  const isDirty = Object.keys(pendingPayload).length > 0;

  useEffect(() => {
    if (!registerCloseGuard || !isEditing || !isDirty) return;
    return registerCloseGuard("view-memory", () => {
      setPendingExit("close");
      return false;
    });
  }, [isDirty, isEditing, registerCloseGuard]);

  useEffect(() => {
    if (isEditing) titleRef.current?.focus();
  }, [isEditing]);

  const beginEditing = () => {
    if (!memory) return;
    const nextDraft = createStoryEditDraft(memory);
    setDraft(nextDraft);
    setRemovedAttachmentIds([]);
    editor?.commands.setContent(nextDraft.body);
    setMode("edit");
  };

  const finishCancel = () => {
    setDraft(null);
    setRemovedAttachmentIds([]);
    setMode("view");
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  const cancelEditing = () => {
    if (isDirty) {
      setPendingExit("cancel");
      return;
    }
    finishCancel();
  };

  const handleClose = () => close?.("view-memory");

  const discardChanges = () => {
    const exit = pendingExit;
    setPendingExit(null);
    if (exit === "close") {
      close?.("view-memory", { force: true });
      return;
    }
    finishCancel();
  };

  const saveChanges = async () => {
    if (!memory || !draft || isMutating || !isDirty) return;
    try {
      const response = await updateStory(pendingPayload);
      if (!response?.success) {
        throw new Error(response?.message || "Could not save your story.");
      }
      const nextMemory: IMemory = {
        ...memory,
        title: draft.title,
        body: draft.body,
        tags: [...draft.tags],
        visibility: draft.visibility,
        groups: draft.access
          .filter((item) => item.source === "group")
          .map((item) => ({
            _id: item.id,
            name: item.name,
            color: item.color,
          })),
        beneficiaries: draft.access
          .filter((item) => item.source === "beneficiary")
          .map((item) => ({ _id: item.id, name: item.name })),
        attachments: [...draft.attachments],
      };
      hasLocalSaveRef.current = true;
      setLocalMemory(nextMemory);
      setDraft(null);
      setRemovedAttachmentIds([]);
      setMode("view");
      await Promise.all([
        mutate(`${endpoint.memories}/${memory._id}`),
        mutate(endpoint.memories),
        mutate(
          (key) => typeof key === "string" && key.startsWith(endpoint.stories),
        ),
      ]);
      toast.success("Story updated");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your story. Try again.",
      );
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            attachments: current.attachments.filter(
              (attachment) => attachment._id !== attachmentId,
            ),
          }
        : current,
    );
    setRemovedAttachmentIds((current) => [...current, attachmentId]);
  };

  const draftFiles: IOnUploadPayload[] = (draft?.attachments ?? []).map(
    (attachment) => ({
      id: attachment._id,
      uploadedFile: attachment,
      progress: 100,
      base64: attachment.url,
      file: null,
    }),
  );

  const dateLabel = useMemo(() => {
    const value = memory?.created_at ? new Date(memory.created_at) : new Date();
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(value);
  }, [memory?.created_at]);

  if (isMobile) return null;

  const loading = !memory && isLoading;
  const sanitizedBody = memory
    ? ensureLinksOpenInNewTab(
        DOMPurify.sanitize(ensureHtmlFormat(memory.body || "")),
      )
    : "";

  const headerActions = isEditing ? (
    <>
      <Button type="button" variant="ghost" onClick={cancelEditing}>
        Cancel editing
      </Button>
      <Button
        type="button"
        size="lg"
        onClick={saveChanges}
        disabled={!isDirty || isMutating}
      >
        {isMutating ? "Saving…" : "Save changes"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        onClick={handleClose}
        aria-label="Close story"
      >
        <X aria-hidden />
      </Button>
    </>
  ) : (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => memory && push?.("share-memory", { memory })}
        aria-label="Share story"
      >
        <Share2 aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => memory && toggleBookmark()}
        aria-label={memory?.bookmarked ? "Remove bookmark" : "Bookmark story"}
      >
        {memory?.bookmarked ? <BookmarkSolidIcon /> : <Bookmark aria-hidden />}
      </Button>
      {memory ? <MemoryDropdown memory={memory} /> : null}
      <Button
        ref={editButtonRef}
        type="button"
        size="lg"
        onClick={beginEditing}
        disabled={!memory}
      >
        Edit story
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        onClick={handleClose}
        aria-label="Close story"
      >
        <X aria-hidden />
      </Button>
    </>
  );

  const storyContent = (
    <section className="flex min-h-0 min-w-0 flex-col pr-1">
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2 pt-8 xl:px-3 xl:pt-10">
        <div className="flex min-h-full min-w-0 max-w-[760px] flex-col">
          {loading ? (
            <ViewMemorySkeleton />
          ) : error && !memory ? (
            <div className="rounded-xl border border-stroke-error-strong bg-fill-error-weak p-5">
              <h1 className="font-garamond text-3xl text-text-neutral-strong">
                Story unavailable
              </h1>
              <p className="mt-2 font-geist text-sm text-text-neutral-weak">
                We couldn’t load this story. Close this view and try again.
              </p>
            </div>
          ) : isEditing && draft ? (
            <>
              <textarea
                ref={titleRef}
                aria-label="Story title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, title: event.target.value }
                      : current,
                  )
                }
                rows={1}
                className="w-full shrink-0 resize-none overflow-hidden border-0 bg-transparent p-0 font-garamond text-[clamp(2rem,3vw,2.5rem)] italic leading-[1.15] text-text-neutral-strong focus:outline-none"
              />
              <div className="relative mt-6 flex min-h-[240px] flex-1 flex-col">
                <EditorContent
                  editor={editor}
                  className="tiptap-editor tiptap-editor--memory-next min-h-[240px] w-full flex-1"
                />
              </div>
              {draftFiles.length > 0 ? (
                <div className="mt-auto pt-6">
                  <FileThumbnails
                    files={draftFiles}
                    onRemove={removeAttachment}
                    variant="media-inline"
                  />
                </div>
              ) : null}
            </>
          ) : memory ? (
            <>
              <h1 className="font-garamond text-[clamp(2rem,3vw,2.5rem)] italic leading-[1.15] text-text-neutral-strong">
                {memory.title || "Story"}
              </h1>
              <div
                className="tiptap-editor tiptap-editor--memory-next prose prose-sm mt-6 min-h-[240px] max-w-none font-geist text-lg leading-[1.7] text-text-neutral-strong"
                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
              />
              {memory.attachments.length > 0 ? (
                <div className="mt-auto pt-6">
                  <FileGallery files={memory.attachments} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {isEditing ? (
        <div className="mt-4 w-full max-w-[760px] shrink-0 rounded-[14px] border border-stroke-neutral-weak bg-fill-neutral-weak px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Toggle
              pressed={editor?.isActive("bold") ?? false}
              onPressedChange={() => editor?.chain().focus().toggleBold().run()}
              aria-label="Bold"
            >
              <span className="font-bold">B</span>
            </Toggle>
            <Toggle
              pressed={editor?.isActive("italic") ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleItalic().run()
              }
              aria-label="Italic"
            >
              <span className="italic">I</span>
            </Toggle>
            <Toggle
              pressed={editor?.isActive("underline") ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleUnderline().run()
              }
              aria-label="Underline"
            >
              <span className="underline">U</span>
            </Toggle>
            <Separator
              orientation="vertical"
              className="mx-1 h-5 bg-stroke-neutral-weak"
            />
            <Toggle
              pressed={editor?.isActive("bulletList") ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleBulletList().run()
              }
              aria-label="Bullet list"
            >
              <ListTree aria-hidden className="size-4" />
            </Toggle>
          </div>
        </div>
      ) : null}
    </section>
  );

  const detailsContent = (
    <div className="relative min-h-0 min-w-0">
      <div
        className="story-details-trigger-rail absolute inset-0 flex items-start justify-start pt-8 xl:pt-10"
        data-visible={!detailsOpen}
        aria-hidden={detailsOpen}
        inert={detailsOpen}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={detailsOpen}
          aria-controls="view-story-details-panel"
          onClick={() => setDetailsOpen(true)}
          className="gap-2 px-2 font-geist font-semibold text-text-neutral-strong hover:bg-fill-neutral-weak"
        >
          <ListFilter aria-hidden className="size-4 text-icon-neutral-strong" />
          Story Details
        </Button>
      </div>
      <aside
        id="view-story-details-panel"
        className="story-details-panel absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-stroke-neutral-weak bg-fill-neutral-weaker"
        data-visible={detailsOpen}
        aria-hidden={!detailsOpen}
        inert={!detailsOpen}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <h2 className="font-geist text-base font-semibold text-text-neutral-strong">
            Story Details
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse story details"
            onClick={() => setDetailsOpen(false)}
          >
            <PanelRightClose aria-hidden className="size-4" />
          </Button>
        </div>
        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-5">
          {isEditing && draft ? (
            <div className="flex flex-col gap-6">
              <AccessField
                value={draft.access}
                onChange={(access) =>
                  setDraft((current) =>
                    current ? { ...current, access } : current,
                  )
                }
                shareAudience={draft.visibility}
                onShareAudienceChange={(visibility) =>
                  setDraft((current) =>
                    current ? { ...current, visibility } : current,
                  )
                }
                variant="panel"
                dismissOnEscape
              />
              <TagsField
                tags={draft.tags}
                setTags={(next) =>
                  setDraft((current) => {
                    if (!current) return current;
                    const tags =
                      typeof next === "function" ? next(current.tags) : next;
                    return { ...current, tags };
                  })
                }
                title={draft.title}
                body={editor?.getText() ?? ""}
                variant="panel"
              />
            </div>
          ) : memory ? (
            <ReadOnlyDetails memory={memory} />
          ) : null}
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <StoryJournalShell>
        <div className="relative grid h-full min-h-[720px] grid-rows-[auto_minmax(0,1fr)] gap-5 py-6 pl-[max(225px,22%,calc((100dvh-32px)*0.31))] pr-6 xl:gap-8 xl:py-10 xl:pl-[max(250px,22%,calc((100dvh-72px)*0.31))] xl:pr-10">
          <header className="flex min-w-0 items-center justify-between gap-3">
            <span className="font-geist text-sm text-text-neutral-weak">
              {dateLabel}
            </span>
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
      </StoryJournalShell>

      <Dialog
        open={pendingExit !== null}
        onOpenChange={(open) => !open && setPendingExit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard story changes?</DialogTitle>
            <DialogDescription>
              Your unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingExit(null)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={discardChanges}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReadOnlyDetails({ memory }: { memory: IMemory }) {
  const words = DOMPurify.sanitize(memory.body)
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="space-y-6 font-geist">
      <section>
        <h3 className="text-sm font-semibold text-text-neutral-strong">
          Visibility
        </h3>
        <p className="mt-2 text-sm text-text-neutral-weak">
          {memory.visibility === "everyone"
            ? "Visible to everyone"
            : "Private — only you"}
        </p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-text-neutral-strong">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {memory.tags.length > 0 ? (
            memory.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stroke-neutral-weak bg-fill-neutral-weak px-2.5 py-1 text-xs text-text-neutral-strong"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))
          ) : (
            <span className="text-sm text-text-neutral-weaker">No tags</span>
          )}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-text-neutral-strong">
          Story Overview
        </h3>
        <div className="mt-2 space-y-2 text-sm text-text-neutral-weak">
          <p>{memory.attachments.length} attachments</p>
          <p>
            {words === 0 ? 0 : Math.max(1, Math.ceil(words / 200))} min read
          </p>
        </div>
      </section>
      <section className="rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak p-3">
        <div className="flex items-center justify-between gap-3 py-1 text-sm text-text-neutral-strong">
          <span>Title</span>
          {memory.title.trim() ? (
            <Check
              aria-label="Title complete"
              className="size-4 text-icon-success-strong"
            />
          ) : (
            <Circle
              aria-label="Title incomplete"
              className="size-4 text-icon-neutral-weaker"
            />
          )}
        </div>
        <div className="flex items-center justify-between gap-3 py-1 text-sm text-text-neutral-strong">
          <span>Story text</span>
          {memory.body.trim() ? (
            <Check
              aria-label="Story text complete"
              className="size-4 text-icon-success-strong"
            />
          ) : (
            <Circle
              aria-label="Story text incomplete"
              className="size-4 text-icon-neutral-weaker"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function ViewMemorySkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading story">
      <div className="h-10 w-3/5 rounded bg-fill-neutral-weaker" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-fill-neutral-weaker" />
        <div className="h-4 w-5/6 rounded bg-fill-neutral-weaker" />
        <div className="h-4 w-2/3 rounded bg-fill-neutral-weaker" />
      </div>
    </div>
  );
}
