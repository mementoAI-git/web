"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useModal } from "@/hooks/use-modal";
import { useNavigate } from "react-router-dom";
import useForm from "@/hooks/use-form";
import useFileUpload from "@/hooks/use-file-upload";
import useSWRMutation from "swr/mutation";
import { postFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { parseSubscriptionGateError } from "@/features/pricing/subscription-errors";
import { cn, isEmpty } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import {
  SUPPORTED_FILE_TYPES,
  MEMORY_ATTACHMENT_ACCEPT,
  inferMimeType,
  isSupportedFileMime,
  uploadMimeBaseType,
} from "@/utility/constant";
import { HeadingIcon, TimesIcon, LinkIcon, UnorderedListIcon } from "@/components/icons";
import { AccessField, buildCreateMemoryPayload } from "./access-field";
import { TagsField } from "./tags-field";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import Spinner from "@/components/spinner";
import { createPortal } from "react-dom";
import { CloseWithFilesConfirmation } from "../close-with-files-confirmation";
import { Sheet } from "react-modal-sheet";
import { LinkInput } from "@/components/memory/text-area/link-input";
import { SlashCommandPopup } from "@/components/memory/text-area/slash-command-popup";
import { SLASH_COMMANDS } from "@/components/memory/text-area/slash-commands";
import { VideoRecorder } from "@/components/recorder/video";
import type { ComponentRef, ReactNode } from "react";
import { FileThumbnails } from "./file-thumbnails";
import { UpgradePrompt } from "@/features/pricing/upgrade-prompt";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IOnUploadPayload } from "@/utility/interface";
import {
  Image as ImageIcon,
  ListOrdered,
  Mic,
  Music,
  Paperclip,
  Plus,
  Quote,
  Smile,
  Video,
} from "lucide-react";

const ACTIVE_BG = "bg-fill-neutral-strong text-inverse-strong hover:bg-fill-neutral-strong hover:text-inverse-strong";
const initial = { title: "", body: "", attachments: [] as string[] };
const DRAFT_STORAGE_KEY = "create-memory-drafts";
const MAX_DRAFTS = 10;

interface MemoryDraft {
  id: string;
  title: string;
  body: string;
  tags: string[];
  attachments: NonNullable<IOnUploadPayload["uploadedFile"]>[];
  updatedAt: string;
}

// ─── CreateMemory ─────────────────────────────────────────────────────────────

interface CreateMemoryProps {
  data?: { payload?: Partial<typeof initial> };
  isMobile?: boolean;
}

export function CreateMemory({ data, isMobile = false }: CreateMemoryProps) {
  const { close, open, push, registerCloseGuard } = useModal();
  const navigate = useNavigate();
  const [showUploadGate, setShowUploadGate] = useState(false);
  const fileInputMediaRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const fileInputAudioRef = useRef<HTMLInputElement>(null);
  const videoRecorderRef = useRef<ComponentRef<typeof VideoRecorder>>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [drafts, setDrafts] = useState<MemoryDraft[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerPortalRef = useRef<HTMLDivElement>(null);
  const [selectedAccess, setSelectedAccess] = useState<
    Array<{ id: string; name: string; source: "group" | "beneficiary" }>
  >([]);
  const [tags, setTags] = useState<string[]>([]);

  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoRecordedFile, setVideoRecordedFile] = useState<File | null>(null);
  const [isUsingVideo, setIsUsingVideo] = useState(false);
  const [audioRecordingCount, setAudioRecordingCount] = useState(1);

  const { trigger, isMutating } = useSWRMutation(endpoint.memories, postFetcher);
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();

  const { values, handleChange, handleSubmit, handleValue, setValues } = useForm({
    initial: { ...initial, ...data?.payload },
    async onSubmit(p) {
      if (isEmpty(p.title)) return toast.error("Title is required");
      const bodyHtml = editor?.getHTML() || "";
      const hasContent = editor?.getText()?.trim() || files.length > 0;
      if (!hasContent) {
        return toast.error("Please add some content or a media file before continuing");
      }
      const uploadedFiles = files.filter((f) => f.uploadedFile).map((f) => f.uploadedFile._id);
      const payload = buildCreateMemoryPayload(
        p.title,
        bodyHtml,
        tags,
        "save",
        selectedAccess,
        uploadedFiles.length > 0 ? { attachments: uploadedFiles } : {}
      );

      try {
        const result = await trigger(payload as Parameters<typeof trigger>[0]);
        if (result?.success) {
          mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories));
          open("share-post", { id: result.data?._id || result.data?.id });
          setValues(initial);
          setFiles([]);
          setTags([]);
          setSelectedAccess([]);
        } else {
          toast.error(
            typeof result?.message === "string" ? result.message : "Could not save your story. Try again.",
          );
        }
      } catch (err) {
        if (parseSubscriptionGateError(err)) {
          setShowUploadGate(true);
        }
      }
    },
  });

  const queueFileUpload = useCallback(
    (file: File) => {
      const resolvedType = file.type || inferMimeType(file.name);
      if (!isSupportedFileMime(resolvedType, SUPPORTED_FILE_TYPES)) {
        toast.error(
          "This file type isn’t supported. Add images, video, audio, PDF, Word (.doc, .docx), or plain text.",
        );
        return;
      }
      const isImage = uploadMimeBaseType(resolvedType).startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
        };
        reader.readAsDataURL(file);
      } else {
        handleUpload({ id: uuidv4(), file, progress: 0 });
      }
    },
    [handleUpload],
  );

  const queueFileUploadRef = useRef(queueFileUpload);
  queueFileUploadRef.current = queueFileUpload;

  const latestDirtyRef = useRef<() => boolean>(() => false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      Placeholder.configure({ placeholder: "What's on your mind today? Type / for formatting options" }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-text-brand-strong underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
    ],
    content: values.body || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[140px] px-4 py-4 text-sm text-text-neutral-strong",
      },
      handleDOMEvents: {
        paste: (_view, event) => {
          const e = event as ClipboardEvent;
          const items = Array.from(e.clipboardData?.items || []);
          const fileItems = items.filter((item) => item.kind === "file");
          if (fileItems.length === 0) return false;
          e.preventDefault();
          fileItems.forEach((item) => {
            const file = item.getAsFile();
            if (!file) return;
            queueFileUploadRef.current(file);
          });
          return true;
        },
      },
    },
    onUpdate: ({ editor }) => {
      handleValue("body", editor.getHTML());

      const { state } = editor;
      const { selection } = state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
      const lastSlashIndex = textBefore.lastIndexOf("/");

      if (lastSlashIndex === -1) {
        setShowSlashMenu(false);
      } else {
        const query = textBefore.slice(lastSlashIndex + 1);
        if (query.includes(" ") || query.includes("\n")) {
          setShowSlashMenu(false);
        } else {
          const coords = editor.view.coordsAtPos(selection.from);
          setSlashPosition({ top: coords.top + 20, left: coords.left });
          setShowSlashMenu(true);
          setSlashSelectedIndex(0);
        }
      }
    },
  });

  latestDirtyRef.current = () =>
    files.length > 0 ||
    values.title.trim().length > 0 ||
    (editor?.getText()?.trim().length ?? 0) > 0 ||
    tags.length > 0 ||
    selectedAccess.length > 0;

  useEffect(() => {
    if (!registerCloseGuard) return;
    return registerCloseGuard("create-memory", () => {
      if (!latestDirtyRef.current()) return true;
      setShowCloseConfirmation(true);
      return false;
    });
  }, [registerCloseGuard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedDrafts = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!storedDrafts) return;
    try {
      const parsed = JSON.parse(storedDrafts) as MemoryDraft[];
      if (Array.isArray(parsed)) {
        setDrafts(
          parsed.map((draft) => ({
            ...draft,
            attachments: Array.isArray(draft.attachments) ? draft.attachments : [],
          })),
        );
      }
    } catch {
      setDrafts([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasDraftContent = values.title.trim().length > 0 || (editor?.getText()?.trim().length ?? 0) > 0;
    if (!hasDraftContent) return;
    const uploadedAttachments = files
      .map((file) => file.uploadedFile)
      .filter((file): file is NonNullable<IOnUploadPayload["uploadedFile"]> => Boolean(file));

    const timeout = window.setTimeout(() => {
      const nextDraft: MemoryDraft = {
        id: uuidv4(),
        title: values.title,
        body: editor?.getHTML() || "",
        tags,
        attachments: uploadedAttachments,
        updatedAt: new Date().toISOString(),
      };

      setDrafts((prev) => {
        const deduped = prev.filter((draft) => draft.title !== nextDraft.title || draft.body !== nextDraft.body);
        const next = [nextDraft, ...deduped].slice(0, MAX_DRAFTS);
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [values.title, values.body, tags, editor, files]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        emojiPickerRef.current?.contains(target) ||
        emojiPickerPortalRef.current?.contains(target)
      ) {
        return;
      }
      setShowEmoji(false);
    };
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(queueFileUpload);
    e.target.value = "";
  };

  const handleRemoveFile = useCallback(
    async (fileId: string) => {
      const f = files.find((f) => f.id === fileId);
      if (!f) return;
      if (f.uploadedFile) await handleDeleteFile(f);
      else setFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    [files, handleDeleteFile, setFiles],
  );

  const handleAddAudioFile = (file: File, duration?: number) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0, ...(duration !== undefined && { duration }) });
    };
    reader.readAsDataURL(file);
    setAudioRecordingCount((c) => c + 1);
  };

  const handleUseVideo = () => {
    if (!videoRecordedFile) return;
    setIsUsingVideo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpload({
        id: uuidv4(),
        file: videoRecordedFile,
        base64: reader.result as string,
        progress: 0,
      });
      setVideoRecordedFile(null);
      setShowVideoRecorder(false);
      setIsUsingVideo(false);
    };
    reader.readAsDataURL(videoRecordedFile);
  };

  const handleClose = () => close("create-memory");

  const handleConfirmClose = async () => {
    setShowCloseConfirmation(false);
    const deletes = files.filter((f) => f.uploadedFile).map((f) => handleDeleteFile(f));
    await Promise.all(deletes);
    setFiles([]);
    close("create-memory", { force: true });
  };

  const handleLinkClick = () => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setLinkPosition({ top: coords.top - 100, left: coords.left });
    setShowLinkInput(true);
  };

  const handleLinkSubmit = (text: string, url: string) => {
    if (!editor) return;
    if (!editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({ type: "text", marks: [{ type: "link", attrs: { href: url } }], text })
        .insertContent(" ")
        .focus()
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", marks: [{ type: "link", attrs: { href: url } }], text })
        .insertContent(" ")
        .focus()
        .run();
    }
  };

  const handleLoadDraft = (draft: MemoryDraft) => {
    setValues((prev) => ({ ...prev, title: draft.title, body: draft.body }));
    setTags(draft.tags || []);
    const draftFiles: IOnUploadPayload[] = (draft.attachments || []).map((attachment) => ({
      id: attachment._id || uuidv4(),
      file: null,
      progress: 100,
      uploadedFile: attachment,
    }));
    setFiles(draftFiles);
    editor?.commands.setContent(draft.body || "");
  };

  const handleDeleteDraft = (draftId: string) => {
    setDrafts((prev) => {
      const next = prev.filter((draft) => draft.id !== draftId);
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleClearAllDrafts = () => {
    setDrafts([]);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify([]));
  };

  const handleSlashCommandSelect = (command: (typeof SLASH_COMMANDS)[0]) => {
    if (!editor) return;
    const { state } = editor;
    const { selection } = state;
    const { $anchor } = selection;
    const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
    const lastSlashIndex = textBefore.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
      const from = selection.from - (textBefore.length - lastSlashIndex);
      const to = selection.from;

      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .run();

      command.command({
        editor,
        range: { from, to },
      });
    }

    setShowSlashMenu(false);
  };

  const { from, to } = editor?.state.selection || { from: 0, to: 0 };
  const selectedText = editor?.state.doc.textBetween(from, to, " ") || "";
  const previousUrl = editor?.getAttributes("link").href || "";
  const isUploading = files.some((f) => !f.uploadedFile);

  const toolbarBtn = (isActive: boolean, onClick: () => void, children: ReactNode, title?: string) => (
    <Button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      variant="ghost"
      size="icon"
      className={cn(
        "size-9 rounded-lg text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak [&_svg]:pointer-events-none",
        isActive && ACTIVE_BG,
      )}
    >
      {children}
    </Button>
  );

  const formContent = (
    <>
      <input
        ref={fileInputMediaRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputAllRef}
        type="file"
        multiple
        accept={MEMORY_ATTACHMENT_ACCEPT}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputAudioRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showUploadGate ? (
        <div className="mb-3">
          <UpgradePrompt
            feature="storage"
            variant="inline"
            upgradeLabel="View plans"
            onUpgrade={() => navigate("/pricing")}
            onDismiss={() => setShowUploadGate(false)}
          />
        </div>
      ) : null}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="create-memory-title" className="text-text-neutral-weak">
          Title
        </Label>
        <Input
          id="create-memory-title"
          placeholder="Enter title here"
          value={values.title}
          name="title"
          onChange={handleChange}
          className={cn(
            "font-inter text-base md:text-base w-full rounded-xl border-stroke-neutral-weak px-4 py-3 h-auto text-text-neutral-strong bg-transparent",
            "placeholder:text-neutral-weak transition-[color,box-shadow,border-color]",
            "focus-visible:ring-inset",
          )}
        />
      </div>

      {/* Composer: bordered region (not nested Card) to avoid extra group/card padding */}
      <section
        className={cn(
          "flex flex-col overflow-hidden rounded-[24px] border border-stroke-neutral-weak bg-card text-card-foreground shadow-none",
          "transition-[color,box-shadow,border-color]",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-inset focus-within:ring-ring/50",
        )}
      >
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 pt-1 px-3 pb-1">
          {toolbarBtn(
            !!editor?.isActive("heading", { level: 2 }),
            () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            <HeadingIcon width={11} height={14} />,
            "Heading",
          )}
          {toolbarBtn(
            !!editor?.isActive("bold"),
            () => editor?.chain().focus().toggleBold().run(),
            <span className="font-bold text-sm text-text-neutral-strong leading-none">B</span>,
            "Bold",
          )}
          {toolbarBtn(
            !!editor?.isActive("italic"),
            () => editor?.chain().focus().toggleItalic().run(),
            <span className="italic text-sm text-text-neutral-strong leading-none">I</span>,
            "Italic",
          )}
          {toolbarBtn(
            !!editor?.isActive("strike"),
            () => editor?.chain().focus().toggleStrike().run(),
            <span className="line-through text-sm text-text-neutral-strong leading-none">S</span>,
            "Strikethrough",
          )}
          {toolbarBtn(
            !!editor?.isActive("underline"),
            () => editor?.chain().focus().toggleUnderline().run(),
            <span className="underline text-sm text-text-neutral-strong leading-none">U</span>,
            "Underline",
          )}

          <Separator orientation="vertical" className="mx-1 h-5 bg-stroke-neutral-weak" />

          {toolbarBtn(!!editor?.isActive("link"), handleLinkClick, <LinkIcon width={16} height={11} />, "Link")}
          {toolbarBtn(
            !!editor?.isActive("bulletList"),
            () => editor?.chain().focus().toggleBulletList().run(),
            <UnorderedListIcon width={16} height={14} />,
            "Bullet list",
          )}
          {toolbarBtn(
            !!editor?.isActive("orderedList"),
            () => editor?.chain().focus().toggleOrderedList().run(),
            <ListOrdered className="size-4" />,
            "Numbered list",
          )}
          {toolbarBtn(
            !!editor?.isActive("blockquote"),
            () => editor?.chain().focus().toggleBlockquote().run(),
            <Quote className="size-4" />,
            "Quote",
          )}

          <Separator orientation="vertical" className="mx-1 h-5 bg-stroke-neutral-weak" />

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="font-inter text-sm text-text-neutral-weak hover:text-text-neutral-strong"
                >
                  Drafts
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="w-[280px] max-h-[280px] overflow-y-auto border border-stroke-neutral-weak bg-popover text-popover-foreground"
              >
                {drafts.length > 0 ? (
                  <div className="mb-1 flex items-center justify-end px-2 py-1">
                    <Button
                      type="button"
                      onClick={handleClearAllDrafts}
                      variant="ghost"
                      size="sm"
                      className="h-auto px-1 py-0 text-xs text-text-neutral-weak hover:text-text-neutral-strong"
                    >
                      Clear all
                    </Button>
                  </div>
                ) : null}
                {drafts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-text-neutral-weak">No drafts yet</div>
                ) : (
                  drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-start gap-2 rounded-lg px-2 py-1 hover:bg-fill-neutral-weaker transition-colors"
                    >
                      <Button
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        variant="ghost"
                        size="sm"
                        className="min-w-0 flex-1 h-auto justify-start rounded-lg px-1 py-1 text-left"
                      >
                        <div className="text-sm font-medium text-text-neutral-strong truncate">
                          {draft.title || "Untitled draft"}
                        </div>
                        <div className="mt-0.5 text-xs text-text-neutral-weak truncate">
                          {(draft.body || "").replace(/<[^>]+>/g, "").trim() || "No content"}
                        </div>
                        <div className="mt-1 text-[11px] text-text-neutral-weaker">
                          {new Date(draft.updatedAt).toLocaleString()}
                        </div>
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDraft(draft.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-auto rounded-md px-2 py-1 text-[11px] text-text-neutral-weak hover:text-text-neutral-strong"
                        title="Delete draft"
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Editor */}
        <div className="flex h-[300px] flex-col overflow-hidden">
          <div className="editor-fill-500 relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <EditorContent editor={editor} className="tiptap-editor size-full min-h-0" />
            <SlashCommandPopup
              show={showSlashMenu}
              position={slashPosition}
              commands={SLASH_COMMANDS}
              selectedIndex={slashSelectedIndex}
              onSelectedIndexChange={setSlashSelectedIndex}
              onCommandSelect={handleSlashCommandSelect}
              onClose={() => setShowSlashMenu(false)}
            />
            {showLinkInput && (
              <LinkInput
                show={showLinkInput}
                position={linkPosition}
                initialText={selectedText}
                initialUrl={previousUrl}
                onSubmit={handleLinkSubmit}
                onRemove={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
                onClose={() => setShowLinkInput(false)}
              />
            )}
          </div>
        </div>

        {/* Attachments & media toolbar */}
        <div className="mt-3 mb-3 w-full min-w-0 px-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex min-h-[48px] items-center justify-start gap-1 rounded-2xl border border-stroke-neutral-weak bg-fill-neutral-weaker/60 px-2 py-1.5">
              {/* Attachments & media */}
              <DropdownMenu
                onOpenChange={(open) => {
                  if (open) setShowEmoji(false);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="rounded-xl text-icon-neutral-strong hover:bg-fill-neutral-weak"
                    aria-label="Add attachment"
                  >
                    <Plus className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 border border-stroke-neutral-weak bg-popover text-popover-foreground"
                >
                  <DropdownMenuLabel className="text-text-neutral-weaker">Add to story</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-text-neutral-weak"
                    onClick={() => fileInputMediaRef.current?.click()}
                  >
                    <ImageIcon className="size-4 shrink-0 text-icon-neutral-strong" />
                    Photos & videos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-text-neutral-weak"
                    onClick={() => fileInputAudioRef.current?.click()}
                  >
                    <Music className="size-4 shrink-0 text-icon-neutral-strong" />
                    Audio files
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-text-neutral-weak"
                    onClick={() => fileInputAllRef.current?.click()}
                  >
                    <Paperclip className="size-4 shrink-0 text-icon-neutral-strong" />
                    Documents & files
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <p className="px-2 pb-2 text-[11px] leading-snug text-text-neutral-weaker">
                    PDF, Word (.doc, .docx), plain text, and other supported types.
                  </p>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Emoji */}
              <div ref={emojiPickerRef} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={() => setShowEmoji((p) => !p)}
                  className="rounded-xl text-icon-neutral-strong hover:bg-fill-neutral-weaker"
                  aria-label="Insert emoji"
                >
                  <Smile className="size-5" />
                </Button>
                {showEmoji &&
                  createPortal(
                    <div
                      ref={emojiPickerPortalRef}
                      className="fixed z-[9999]"
                      style={(() => {
                        const rect = emojiPickerRef.current?.getBoundingClientRect();
                        return rect
                          ? {
                              left: rect.left,
                              bottom: window.innerHeight - rect.top + 12,
                            }
                          : { left: 0, bottom: 0 };
                      })()}
                    >
                      <Card className="overflow-hidden border-stroke-neutral-weak p-0 shadow-lg">
                        <Picker
                          data={emojiData}
                          onEmojiSelect={(e: { native: string }) => {
                            editor?.chain().focus().insertContent(e.native).run();
                            setShowEmoji(false);
                          }}
                          theme="light"
                          previewPosition="none"
                        />
                      </Card>
                    </div>,
                    document.body,
                  )}
              </div>

              <Separator orientation="vertical" className="mx-1 h-6 bg-stroke-neutral-weak" />

              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => push("audio-recorder", { onFinish: handleAddAudioFile, recordingNumber: audioRecordingCount })}
                className="rounded-xl text-icon-neutral-strong hover:bg-fill-neutral-weaker"
                title="Record audio"
                aria-label="Record audio"
              >
                <Mic className="size-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => {
                  setVideoRecordedFile(null);
                  setShowVideoRecorder(true);
                }}
                className="rounded-xl text-icon-neutral-strong hover:bg-fill-neutral-weaker"
                title="Record video"
                aria-label="Record video"
              >
                <Video className="size-5" />
              </Button>
          </div>
        </div>
      </section>

      <FileThumbnails files={files} onRemove={handleRemoveFile} />

      <AccessField value={selectedAccess} onChange={setSelectedAccess} />

      <TagsField
        tags={tags}
        setTags={setTags}
        title={values.title ?? ""}
        body={editor?.getText() ?? ""}
      />
    </>
  );

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button
        type="button"
        onClick={handleClose}
        variant="outline"
        size="lg"
        className="h-11 rounded-full border-stroke-neutral-weak bg-bg-neutral px-6 font-inter font-semibold text-sm text-text-neutral-weak hover:bg-fill-neutral-weaker"
      >
        Dismiss
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isMutating || isUploading}
        size="lg"
        className="h-11 rounded-full bg-fill-brand-strong px-6 font-inter font-semibold text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Continue
        <Spinner loading={isMutating} className="size-4!" />
      </Button>
    </div>
  );

  const closeConfirmationPortal = showCloseConfirmation
    ? createPortal(
      <CloseWithFilesConfirmation
        open={showCloseConfirmation}
        close={() => setShowCloseConfirmation(false)}
        onConfirm={handleConfirmClose}
      />,
      document.body,
    )
    : null;

  const resetVideoRecorder = () => {
    videoRecorderRef.current?.reset?.();
    videoRecorderRef.current?.resetStream?.();
    setVideoRecordedFile(null);
  };

  const videoRecorderDialog = (
    <Dialog
      open={showVideoRecorder}
      onOpenChange={(open) => {
        if (!open) {
          resetVideoRecorder();
          setShowVideoRecorder(false);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] gap-0 overflow-hidden rounded-[28px] border border-stroke-neutral-weak bg-background p-0 sm:max-w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="space-y-0 border-b border-stroke-neutral-weak px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-fill-brand-strong" aria-hidden />
              <DialogTitle className="font-inter text-xs font-bold uppercase tracking-widest text-text-brand-strong">
                Record video
              </DialogTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                resetVideoRecorder();
                setShowVideoRecorder(false);
              }}
              className="rounded-full bg-fill-neutral-weaker text-icon-neutral-weak hover:bg-fill-neutral-weak"
              aria-label="Close recorder"
            >
              <TimesIcon width={10} height={10} />
            </Button>
          </div>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4">
          <VideoRecorder ref={videoRecorderRef} onStart={() => {}} onFinish={setVideoRecordedFile} />
          {videoRecordedFile ? (
            <DialogFooter className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-stretch">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  resetVideoRecorder();
                }}
                className="h-10 flex-1 rounded-full border-stroke-neutral-weak bg-fill-neutral-weaker font-inter font-semibold text-sm text-text-neutral-weak hover:bg-fill-neutral-weak"
              >
                Re-record
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={handleUseVideo}
                disabled={isUsingVideo}
                className="h-10 flex-1 rounded-full bg-fill-neutral-strong font-inter font-semibold text-sm text-inverse-strong hover:opacity-90 disabled:opacity-50"
              >
                Add to post
                <Spinner loading={isUsingVideo} className="size-4!" />
              </Button>
            </DialogFooter>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Mobile
  if (isMobile) {
    return (
      <>
        <Sheet detent="content" isOpen onClose={handleClose} snapPoints={[0.5, 0.75, 1]} initialSnap={1}>
          <Sheet.Container className="bg-v3-bg">
            <Sheet.Header className="rounded-t-3xl bg-v3-bg" />
            <Sheet.Content className="overflow-y-auto bg-v3-bg px-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-garamond text-xl font-medium text-text-neutral-strong">Add New Story</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClose}
                  className="rounded-full bg-fill-neutral-weaker text-icon-neutral-weak hover:bg-fill-neutral-weak"
                >
                  <TimesIcon width={10} height={10} />
                </Button>
              </div>
              <div className="space-y-4">{formContent}</div>
              <div className="mt-4 pt-4 border-t border-stroke-neutral-weak">{footer}</div>
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop onTap={handleClose} />
        </Sheet>
        {closeConfirmationPortal}
        {videoRecorderDialog}
      </>
    );
  }

  // Desktop
  return (
    <>
      <Card
        className="absolute top-0 right-0 bottom-0 flex h-full w-full max-w-[520px] flex-col gap-0 overflow-hidden rounded-[24px] border-stroke-neutral-weak bg-v3-bg py-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="shrink-0 border-b border-stroke-neutral-weak px-6 py-5">
          <h2 className="font-garamond text-2xl font-medium text-text-neutral-strong">
            Add New Story
          </h2>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-5 pb-16 hide-scrollbar space-y-5">
          {formContent}
        </CardContent>
        <CardFooter className="shrink-0 border-t border-stroke-neutral-weak px-6 py-4">{footer}</CardFooter>
      </Card>

      {closeConfirmationPortal}
      {videoRecorderDialog}
    </>
  );
}
