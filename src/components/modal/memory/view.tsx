import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditorState } from "@tiptap/react";
import { Link as LinkIcon, ListFilter, ListTree, X } from "lucide-react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import endpoint from "@/api/endpoint";
import { deleteFetcher } from "@/api/fetcher";
import { useMemoryEditor } from "@/components/memory/text-area/use-memory-editor";
import { LinkInput } from "@/components/memory/text-area/link-input";
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
import useFetcher from "@/hooks/use-fetcher";
import useFileUpload from "@/hooks/use-file-upload";
import { useFeatureFlags } from "@/contexts/feature-flags";
import {
  SUPPORTED_FILE_TYPES,
  inferMimeType,
  isSupportedFileMime,
  uploadMimeBaseType,
} from "@/utility/constant";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { MemoryItemActions } from "@/pages/dashboard/stories/components/dropdown";
import { StoryDetailsDialog } from "./view-details";
import { addToRecentMemories } from "@/utility";
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
import { StoryMediaControls } from "./story-media-controls";
import { AudioAttachmentRecorder } from "@/components/recorder/voice-recorder";
import {
  StoryReaderColumn,
  StoryReaderContent,
  StoryReaderFrame,
  StoryReaderMedia,
  StoryReaderMeta,
} from "./story-reader";
import { useStoryMobileViewport } from "./story-reader-utils";

interface ViewMemoryProps {
  data: { memoryId?: string; memory?: IMemory };
  isMobile?: boolean;
}

type StoryViewerMode = "view" | "edit";
type PendingExit = "cancel" | "close" | null;

export function ViewMemory({ data, isMobile }: ViewMemoryProps) {
  const { close, push, registerCloseGuard } = useModal();
  const navigate = useNavigate();
  const { user } = useStore();
  const { canUse } = useFeatureFlags();
  const {
    files: addedFiles,
    handleUpload,
    handleDeleteFile,
    setFiles,
  } = useFileUpload();
  const memoryId = data.memoryId || data.memory?._id;
  const [mode, setMode] = useState<StoryViewerMode>("view");
  const [localMemory, setLocalMemory] = useState<IMemory | undefined>(
    data.memory,
  );
  const [draft, setDraft] = useState<StoryEditDraft | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pendingExit, setPendingExit] = useState<PendingExit>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    [],
  );
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const detailsReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const hasLocalSaveRef = useRef(false);

  const {
    data: fetched,
    error,
    isLoading,
  } = useSWR(memoryId ? `${endpoint.memories}/${memoryId}` : null, {
    refreshInterval: (response) =>
      (response?.data as IMemory | undefined)?.enrichment_status === "pending"
        ? 4000
        : 0,
  });
  const remoteMemory = (fetched?.data as IMemory | undefined) ?? data.memory;
  const memory = localMemory ?? remoteMemory;
  const isEditing = mode === "edit";
  const isMobileViewport = useStoryMobileViewport();
  // Rotating a tablet must not throw away a story that's being edited.
  const showsMobilePage = isMobileViewport && !isEditing;

  useEffect(() => {
    if (!showsMobilePage || !memoryId) return;
    close?.("view-memory", { force: true });
    navigate(`/stories/${memoryId}`);
  }, [close, memoryId, navigate, showsMobilePage]);

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

  const {
    editor,
    showLinkInput,
    setShowLinkInput,
    linkPosition,
    openLinkInputAtSelection,
    submitLink,
  } = useMemoryEditor({
    initialContent: data.memory?.body ?? "",
    placeholder: "Write story here...",
    editorClassName:
      "prose prose-sm max-w-none focus:outline-none min-h-[240px] w-full px-0 py-0 font-geist text-lg leading-[1.7] text-text-neutral-strong",
    linkClassName: "text-text-brand-strong underline cursor-pointer",
    onHtmlChange: updateDraftBody,
    editable: isEditing,
  });

  const formatting = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      strike: current?.isActive("strike") ?? false,
      underline: current?.isActive("underline") ?? false,
      link: current?.isActive("link") ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
    }),
  });

  useEffect(() => {
    if (!isEditing && memory)
      editor?.commands.setContent(memory.body || "", { emitUpdate: false });
  }, [editor, isEditing, memory]);

  const { trigger: updateStory, isMutating } = useFetcher(
    memory ? `${endpoint.memories}/${memory._id}` : "",
    "put",
  );

  const pendingPayload = useMemo(
    () =>
      memory && draft
        ? buildStoryUpdatePayload(
            memory,
            draft,
            addedFiles.flatMap((file) =>
              file.uploadedFile?._id ? [file.uploadedFile._id] : [],
            ),
          )
        : {},
    [draft, memory, addedFiles],
  );
  const uploadsPending = addedFiles.some((file) => !file.uploadedFile?._id);
  const isDirty =
    Object.keys(pendingPayload).length > 0 ||
    removedAttachmentIds.length > 0 ||
    addedFiles.length > 0;

  const addFile = (file: File, duration?: number) => {
    const mime = file.type || inferMimeType(file.name);
    if (!isSupportedFileMime(mime, SUPPORTED_FILE_TYPES)) {
      toast.error(
        "This file type isn’t supported. Add images, video, audio, PDF, Word (.doc, .docx), or plain text.",
      );
      return;
    }
    const category = uploadMimeBaseType(mime).split("/")[0];
    if (
      !canUse("attachments.doc_upload") ||
      (["image", "video", "audio"].includes(category) &&
        !canUse(`attachments.${category}_upload`))
    ) {
      toast.error("File uploads are currently disabled.");
      return;
    }
    const payload: IOnUploadPayload = {
      id: uuidv4(),
      file,
      progress: 0,
      ...(duration !== undefined && { duration }),
    };
    // Queue immediately so pending uploads participate in the close/save guard.
    void handleUpload(payload);
  };

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

  useEffect(() => {
    const title = titleRef.current;
    if (!isEditing || !title) return;
    const resizeTitle = () => {
      title.style.height = "0px";
      title.style.height = `${Math.max(title.scrollHeight, 48)}px`;
    };
    resizeTitle();
    window.addEventListener("resize", resizeTitle);
    return () => window.removeEventListener("resize", resizeTitle);
  }, [draft?.title, isEditing, detailsOpen]);

  const beginEditing = () => {
    if (!memory) return;
    setShowLinkInput(false);
    const nextDraft = createStoryEditDraft(memory);
    setDraft(nextDraft);
    setRemovedAttachmentIds([]);
    setFiles([]);
    editor?.commands.setContent(nextDraft.body, { emitUpdate: false });
    setMode("edit");
  };

  const finishCancel = () => {
    setFiles([]);
    setDraft(null);
    setRemovedAttachmentIds([]);
    setMode("view");
    setShowLinkInput(false);
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
    if (
      !memory ||
      !draft ||
      isMutating ||
      isSaving ||
      uploadsPending ||
      !isDirty
    )
      return;
    setIsSaving(true);
    try {
      if (Object.keys(pendingPayload).length > 0) {
        const response = await updateStory(pendingPayload);
        if (!response?.success) {
          throw new Error(response?.message || "Could not save your story.");
        }
      }
      for (const attachmentId of removedAttachmentIds) {
        const response = await deleteFetcher(
          `${endpoint.removeFileFromMemory}/${attachmentId}`,
        );
        if (!response?.success)
          throw new Error(
            response?.message || "Could not remove the attachment. Try again.",
          );
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
        attachments: [
          ...draft.attachments,
          ...addedFiles.flatMap((file) =>
            file.uploadedFile ? [file.uploadedFile] : [],
          ),
        ],
      };
      hasLocalSaveRef.current = true;
      setLocalMemory(nextMemory);
      setDraft(null);
      setFiles([]);
      setRemovedAttachmentIds([]);
      setMode("view");
      setShowLinkInput(false);
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
    } finally {
      setIsSaving(false);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    const addedFile = addedFiles.find((file) => file.id === attachmentId);
    if (addedFile) {
      if (addedFile.uploadedFile) void handleDeleteFile(addedFile);
      else
        setFiles((current) =>
          current.filter((file) => file.id !== attachmentId),
        );
      return;
    }
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

  const draftFiles: IOnUploadPayload[] = [
    ...(draft?.attachments ?? []).map((attachment) => ({
      id: attachment._id,
      uploadedFile: attachment,
      progress: 100,
      base64: attachment.url,
      file: null,
    })),
    ...addedFiles,
  ];

  if (isMobile || showsMobilePage) return null;

  const loading = !memory && isLoading;
  const readerActions = (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        ref={editButtonRef}
        type="button"
        variant="secondary"
        size="lg"
        className="bg-fill-neutral-weak text-text-neutral-strong hover:bg-fill-neutral-weak/80"
        onClick={beginEditing}
        disabled={!memory}
      >
        Edit story
      </Button>
      <Button
        type="button"
        size="lg"
        disabled={!memory || !editor}
        onClick={() => {
          if (!memory || !editor) return;
          const text = [memory.title?.trim(), editor.getText().trim()]
            .filter(Boolean)
            .join("\n\n");
          handleClose();
          navigate("/chat", { state: { overviewDiscussion: text } });
        }}
      >
        Discuss
      </Button>
    </div>
  );

  const headerActions = isEditing ? (
    <>
      <Button type="button" variant="ghost" onClick={cancelEditing}>
        Cancel editing
      </Button>
      <Button
        type="button"
        size="lg"
        onClick={saveChanges}
        disabled={!isDirty || isMutating || isSaving || uploadsPending || isRecordingAudio}
      >
        {isMutating || isSaving ? "Saving…" : "Save changes"}
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
      {readerActions}
      {memory ? (
        <MemoryItemActions
          memory={memory}
          trigger="horizontal"
          triggerRef={optionsButtonRef}
          onEdit={beginEditing}
          onShare={() => push?.("share-memory", { memory })}
          onDelete={() => push?.("delete-memory", { memory })}
          onViewDetails={() => {
            detailsReturnFocusRef.current = optionsButtonRef.current;
            setDetailsOpen(true);
          }}
        />
      ) : null}
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
    <StoryReaderColumn
      footer={isEditing ? (
        <div
          data-testid="view-story-formatting-strip"
          className="mt-4 w-full max-w-[760px] shrink-0 px-3"
        >
          {isRecordingAudio ? (
            <AudioAttachmentRecorder
              onFinish={addFile}
              onClose={() => setIsRecordingAudio(false)}
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <StoryMediaControls
              editor={editor}
              onUpload={addFile}
              disabled={isMutating || isSaving}
              recording={isRecordingAudio}
              onRecord={() => setIsRecordingAudio(true)}
            />
            <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-1">
              <Toggle
                pressed={formatting?.bold ?? false}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
                className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak"
                onPressedChange={() =>
                  editor?.chain().focus().toggleBold().run()
                }
                aria-label="Bold"
              >
                <span className="font-bold">B</span>
              </Toggle>
              <Toggle
                pressed={formatting?.italic ?? false}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
                className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak"
                onPressedChange={() =>
                  editor?.chain().focus().toggleItalic().run()
                }
                aria-label="Italic"
              >
                <span className="italic">I</span>
              </Toggle>
              <Toggle
                pressed={formatting?.strike ?? false}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={() =>
                  editor?.chain().focus().toggleStrike().run()
                }
                size="sm"
                className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak"
                aria-label="Strikethrough"
              >
                <span className="line-through">S</span>
              </Toggle>
              <Toggle
                pressed={formatting?.underline ?? false}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
                className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak"
                onPressedChange={() =>
                  editor?.chain().focus().toggleUnderline().run()
                }
                aria-label="Underline"
              >
                <span className="underline">U</span>
              </Toggle>
              <Toggle
                pressed={(formatting?.link ?? false) || showLinkInput}
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={openLinkInputAtSelection}
                size="sm"
                className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak"
                aria-label="Link"
              >
                <LinkIcon aria-hidden className="size-4" />
              </Toggle>
              <Separator
                orientation="vertical"
                className="mx-1 h-5 bg-stroke-neutral-weak"
              />
              <Toggle
                pressed={formatting?.bulletList ?? false}
                onMouseDown={(event) => event.preventDefault()}
                size="sm"
                className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak"
                onPressedChange={() =>
                  editor?.chain().focus().toggleBulletList().run()
                }
                aria-label="Bullet list"
              >
                <ListTree aria-hidden className="size-4" />
              </Toggle>
            </div>
          </div>
        </div>
      ) : null}
    >
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
                onKeyDown={(event) => {
                  if (
                    event.key !== "Enter" ||
                    event.shiftKey ||
                    event.nativeEvent.isComposing
                  )
                    return;
                  event.preventDefault();
                  editor?.commands.focus();
                }}
                className="w-full shrink-0 resize-none overflow-hidden border-0 bg-transparent p-0 font-garamond text-[clamp(2rem,3vw,2.5rem)] italic leading-[1.15] text-text-neutral-strong focus:outline-none"
              />
              <div className="relative mt-6 flex min-h-[240px] flex-1 flex-col">
                <EditorContent
                  editor={editor}
                  className="tiptap-editor tiptap-editor--memory-next min-h-[240px] w-full flex-1"
                />
                {showLinkInput ? (
                  <LinkInput
                    show
                    position={linkPosition}
                    initialUrl={editor?.getAttributes("link").href ?? ""}
                    initialText={
                      editor
                        ? editor.state.doc.textBetween(
                            editor.state.selection.from,
                            editor.state.selection.to,
                          )
                        : ""
                    }
                    onSubmit={submitLink}
                    onRemove={() =>
                      editor
                        ?.chain()
                        .focus()
                        .extendMarkRange("link")
                        .unsetLink()
                        .run()
                    }
                    onClose={() => setShowLinkInput(false)}
                  />
                ) : null}
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
            <StoryReaderContent title={memory.title} body={memory.body} />
          ) : null}
    </StoryReaderColumn>
  );

  const detailsButton = (
    <Button
      ref={detailsTriggerRef}
      type="button"
      variant="ghost"
      size="sm"
      disabled={!memory}
      aria-haspopup="dialog"
      aria-expanded={detailsOpen}
      onClick={() => {
        detailsReturnFocusRef.current = detailsTriggerRef.current;
        setDetailsOpen(true);
      }}
      className="gap-2 font-geist font-semibold text-text-neutral-strong"
    >
      <ListFilter aria-hidden />
      Details
    </Button>
  );

  const mediaContent = (
    <StoryReaderMedia
      files={!isEditing && memory ? memory.attachments : undefined}
      action={detailsButton}
    />
  );

  const detailsDialog = memory ? (
    <StoryDetailsDialog
      memory={memory}
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        detailsReturnFocusRef.current?.focus();
      }}
    >
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
      ) : undefined}
    </StoryDetailsDialog>
  ) : null;

  return (
    <>
      <StoryJournalShell
        presentation="overlay-b"
        title="View Story"
        description="Read your story, manage its details, or edit and save changes."
        onClose={handleClose}
        onEscapeKeyDown={() => {
          if (showLinkInput) {
            setShowLinkInput(false);
            editor?.commands.focus();
          } else handleClose();
        }}
      >
        <StoryReaderFrame
          meta={
            !isEditing ? (
              <StoryReaderMeta
                createdAt={memory?.created_at}
                body={memory?.body}
              />
            ) : null
          }
          actions={headerActions}
          narrowMedia={isEditing}
        >
          {storyContent}
          {mediaContent}
        </StoryReaderFrame>
      </StoryJournalShell>

      {detailsDialog}

      <Dialog
        open={pendingExit !== null}
        onOpenChange={(open) => !open && setPendingExit(null)}
      >
        <DialogContent
          overlayClassName="z-[300]"
          className="z-[310]"
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
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
