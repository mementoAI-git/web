"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import albumArtwork from "@/assets/image/HD Album story bg memento.png";
import scenicBackground from "@/assets/image/bg/1.png";
import { EditorContent, useEditorState } from "@tiptap/react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useNavigate } from "react-router-dom";
import useForm from "@/hooks/use-form";
import useFileUpload from "@/hooks/use-file-upload";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { postFetcher } from "@/api/fetcher";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import endpoint from "@/api/endpoint";
import { parseSubscriptionGateError } from "@/features/pricing/subscription-errors";
import { cn, isEmpty } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import {
  SUPPORTED_FILE_TYPES,
  MEMORY_ATTACHMENT_ACCEPT,
  MEMORY_ACCEPT_AUDIO,
  MEMORY_ACCEPT_DOCUMENTS,
  MEMORY_ACCEPT_IMAGES,
  MEMORY_ACCEPT_VIDEOS,
  inferMimeType,
  isSupportedFileMime,
  uploadMimeBaseType,
} from "@/utility/constant";
import { HeadingIcon, TimesIcon, LinkIcon, UnorderedListIcon } from "@/components/icons";
import {
  AccessField,
  buildCreateMemoryPayload,
  type MemoryShareAudience,
  type SearchResultItem,
} from "./access-field";
import { beneficiaryToAccessItem } from "./beneficiary-to-access-item";
import {
  htmlFromQuickCaptureNote,
  parseQuickCaptureDraftJson,
  plainTextFromQuickCaptureNote,
  quickCaptureDraftKindLabel,
  quickCaptureDraftPreviewLine,
  scanQuickCaptureDraftKeys,
} from "@/lib/quick-capture-drafts";
import { TagsField } from "./tags-field";
import { TitleField } from "./title-field";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import Spinner from "@/components/spinner";
import { createPortal } from "react-dom";
import { CloseWithFilesConfirmation } from "../close-with-files-confirmation";
import { Sheet } from "react-modal-sheet";
import { LinkInput } from "@/components/memory/text-area/link-input";
import { SlashCommandPopup } from "@/components/memory/text-area/slash-command-popup";
import { SLASH_COMMANDS } from "@/components/memory/text-area/slash-commands";
import { useMemoryEditor } from "@/components/memory/text-area/use-memory-editor";
import { VideoRecorder } from "@/components/recorder/video";
import type { ComponentRef, ReactNode } from "react";
import { FileThumbnails } from "./file-thumbnails";
import { getUploadDisplayKind, resolveUploadMimeType } from "./upload-display";
import { CreateMemoryAssistantPanel } from "./create-memory-assistant-panel";
import { CreateMemoryAssistantComingSoonPanel } from "./create-memory-assistant-coming-soon-panel";
import { useCreateMemoryAssistant } from "./create-memory-ai";
import { UpgradePrompt } from "@/features/pricing/upgrade-prompt";
import { useFeatureFlags } from "@/contexts/feature-flags";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IBeneficiary, IOnUploadPayload } from "@/utility/interface";
import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Cloud,
  FileText,
  Image as ImageIcon,
  ListFilter,
  ListOrdered,
  Mic,
  Music,
  Paperclip,
  PanelRightClose,
  Play,
  Plus,
  Quote,
  Smile,
  Video,
  X,
} from "lucide-react";

const ACTIVE_BG = "bg-fill-neutral-strong text-inverse-strong hover:bg-fill-neutral-strong hover:text-inverse-strong";
const initial = { title: "", body: "", attachments: [] as string[] };
const DRAFT_STORAGE_KEY = "create-memory-drafts";
const MAX_DRAFTS = 10;
type StoryComposerAssistantVariant = "available" | "coming-soon";
const STORY_COMPOSER_ASSISTANT_VARIANT: StoryComposerAssistantVariant = "coming-soon";

interface MemoryDraft {
  id: string;
  title: string;
  body: string;
  tags: string[];
  attachments: NonNullable<IOnUploadPayload["uploadedFile"]>[];
  updatedAt: string;
}

function getDraftSignature({ title, body, tags, attachments }: Pick<MemoryDraft, "title" | "body" | "tags" | "attachments">) {
  return JSON.stringify({ title: title.trim(), body, tags, attachments });
}

// ─── CreateMemory ─────────────────────────────────────────────────────────────

interface CreateMemoryProps {
  data?: { payload?: Partial<typeof initial> };
  isMobile?: boolean;
}

interface CreateMemoryBaseProps extends CreateMemoryProps {
  variant?: "next" | "legacy";
}

export function CreateMemory(props: CreateMemoryProps) {
  return <CreateMemoryBase {...props} variant={props.isMobile ? "legacy" : "next"} />;
}

export function AddMemory2(props: CreateMemoryProps) {
  return <CreateMemoryBase {...props} variant="legacy" />;
}

function CreateMemoryBase({
  data,
  isMobile = false,
  variant = "next",
}: CreateMemoryBaseProps) {
  const isDesktopComposer = variant === "next" && !isMobile;
  const { close, open, push, registerCloseGuard } = useModal();
  const { user } = useStore();
  const { canUse } = useFeatureFlags();
  const navigate = useNavigate();
  const [showUploadGate, setShowUploadGate] = useState(false);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);
  const fileInputAudioRef = useRef<HTMLInputElement>(null);
  const fileInputDocsRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const videoRecorderRef = useRef<ComponentRef<typeof VideoRecorder>>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);
  const detailsTabRef = useRef<HTMLButtonElement>(null);
  const hasToggledDetailsRef = useRef(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [drafts, setDrafts] = useState<MemoryDraft[]>([]);
  const [savedDraftSignature, setSavedDraftSignature] = useState<string | null>(null);
  const activeDraftIdRef = useRef<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerPortalRef = useRef<HTMLDivElement>(null);
  const [selectedAccess, setSelectedAccess] = useState<SearchResultItem[]>([]);
  const [shareAudience, setShareAudience] = useState<MemoryShareAudience>("private");
  const [tags, setTags] = useState<string[]>([]);
  const [quickCaptureDraftNonce, setQuickCaptureDraftNonce] = useState(0);

  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoRecordedFile, setVideoRecordedFile] = useState<File | null>(null);
  const [isUsingVideo, setIsUsingVideo] = useState(false);
  const [audioRecordingCount, setAudioRecordingCount] = useState(1);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"properties" | "assistant">("properties");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!hasToggledDetailsRef.current) return;
    if (isDetailsOpen) {
      detailsTabRef.current?.focus();
    } else {
      detailsTriggerRef.current?.focus();
    }
  }, [isDetailsOpen]);

  const { trigger, isMutating } = useSWRMutation(endpoint.memories, postFetcher);
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();
  const { data: beneficiariesRes } = useSWR(
    `${endpoint.beneficiaries}?page=1&limit=100`,
    paginatedResponseFetcher<IBeneficiary>,
    { revalidateOnFocus: false },
  );
  const beneficiaryDocs: IBeneficiary[] = useMemo(
    () => beneficiariesRes?.data?.docs ?? [],
    [beneficiariesRes?.data?.docs],
  );
  const quickCaptureKeys = useMemo(() => {
    void quickCaptureDraftNonce;
    return scanQuickCaptureDraftKeys(user?.email);
  }, [user?.email, quickCaptureDraftNonce]);

  const { values, handleChange, handleSubmit, handleValue, setValues } = useForm({
    initial: { ...initial, ...data?.payload },
    async onSubmit(p) {
      if (!canUse("memory.create")) {
        return toast.error("Creating memories is currently disabled.");
      }
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
        shareAudience,
        uploadedFiles.length > 0 ? { attachments: uploadedFiles } : {},
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
          setShareAudience("private");
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
      if (!canUse("attachments.doc_upload")) {
        toast.error("File uploads are currently disabled.");
        return;
      }
      const resolvedType = file.type || inferMimeType(file.name);
      if (!isSupportedFileMime(resolvedType, SUPPORTED_FILE_TYPES)) {
        toast.error(
          "This file type isn’t supported. Add images, video, audio, PDF, Word (.doc, .docx), or plain text.",
        );
        return;
      }
      if (uploadMimeBaseType(resolvedType).startsWith("image/") && !canUse("attachments.image_upload")) {
        toast.error("Image uploads are currently disabled.");
        return;
      }
      if (uploadMimeBaseType(resolvedType).startsWith("video/") && !canUse("attachments.video_upload")) {
        toast.error("Video uploads are currently disabled.");
        return;
      }
      if (uploadMimeBaseType(resolvedType).startsWith("audio/") && !canUse("attachments.audio_upload")) {
        toast.error("Audio uploads are currently disabled.");
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
    [canUse, handleUpload],
  );

  const queueFileUploadRef = useRef(queueFileUpload);
  queueFileUploadRef.current = queueFileUpload;

  const latestCloseStateRef = useRef({ dirty: false, saved: false });

  const {
    editor,
    showLinkInput,
    setShowLinkInput,
    linkPosition,
    showSlashMenu,
    setShowSlashMenu,
    slashPosition,
    slashSelectedIndex,
    setSlashSelectedIndex,
    openLinkInputAtSelection,
    submitLink,
    selectSlashCommand,
  } = useMemoryEditor({
    initialContent: values.body || "",
    placeholder:
      variant === "next" && !isMobile
        ? "Write story here..."
        : "What's on your mind today? Type / for formatting options",
    editorClassName:
      variant === "next" && !isMobile
        ? "prose prose-sm max-w-none focus:outline-none min-h-[240px] w-full px-0 py-0 font-geist text-lg leading-[1.7] text-text-neutral-strong"
        : "prose prose-sm max-w-none focus:outline-none min-h-[140px] w-full px-4 py-4 text-sm text-text-neutral-strong",
    linkClassName: "text-text-brand-strong underline cursor-pointer",
    onHtmlChange: (html) => handleValue("body", html),
  });

  const formattingState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      strike: currentEditor?.isActive("strike") ?? false,
      underline: currentEditor?.isActive("underline") ?? false,
      link: currentEditor?.isActive("link") ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
    }),
  }) ?? {
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    link: false,
    bulletList: false,
  };

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...(editor.options?.editorProps ?? {}),
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
    });
  }, [editor]);

  useEffect(() => {
    if (!registerCloseGuard) return;
    return registerCloseGuard("create-memory", () => {
      const { dirty, saved } = latestCloseStateRef.current;
      if (!dirty || (variant === "next" && !isMobile && saved)) return true;
      setShowCloseConfirmation(true);
      return false;
    });
  }, [isMobile, registerCloseGuard, variant]);

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
      const draftId = isDesktopComposer ? (activeDraftIdRef.current ?? uuidv4()) : uuidv4();
      if (isDesktopComposer) activeDraftIdRef.current = draftId;
      const nextDraft: MemoryDraft = {
        id: draftId,
        title: values.title,
        body: editor?.getHTML() || "",
        tags,
        attachments: uploadedAttachments,
        updatedAt: new Date().toISOString(),
      };

      setDrafts((prev) => {
        const remaining = isDesktopComposer
          ? prev.filter((draft) => draft.id !== draftId)
          : prev.filter((draft) => draft.title !== nextDraft.title || draft.body !== nextDraft.body);
        const next = [nextDraft, ...remaining].slice(0, MAX_DRAFTS);
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        setSavedDraftSignature(getDraftSignature(nextDraft));
        return next;
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [values.title, values.body, tags, editor, files, isDesktopComposer]);

  useEffect(() => {
    if (variant !== "next" || isMobile) return;
    const el = titleTextareaRef.current;
    if (!el) return;
    const resizeTitle = () => {
      el.style.height = "0px";
      el.style.height = `${Math.max(el.scrollHeight, 48)}px`;
    };
    resizeTitle();
    window.addEventListener("resize", resizeTitle);
    return () => window.removeEventListener("resize", resizeTitle);
  }, [isMobile, values.title, variant]);

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

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const normalizedValue = e.target.value.replace(/[\r\n]+/g, " ");
      handleValue(e.target.name as keyof typeof initial, normalizedValue);
    },
    [handleValue],
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
      e.preventDefault();
      editor?.commands.focus();
    },
    [editor],
  );

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
    openLinkInputAtSelection();
  };

  const handleLinkSubmit = (text: string, url: string) => {
    submitLink(text, url);
  };

  const handleLoadDraft = (draft: MemoryDraft) => {
    if (isDesktopComposer) activeDraftIdRef.current = draft.id;
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
    setSavedDraftSignature(getDraftSignature(draft));
  };

  const handleLoadQuickCaptureDraft = useCallback(
    (storageKey: string) => {
      const raw = localStorage.getItem(storageKey);
      const d = raw ? parseQuickCaptureDraftJson(raw) : null;
      if (!d) return;
      if (isDesktopComposer) {
        activeDraftIdRef.current = null;
        setSavedDraftSignature(null);
      }
      const note = typeof d.note === "string" ? d.note : "";
      const html = htmlFromQuickCaptureNote(note);
      const noteText = plainTextFromQuickCaptureNote(note);
      const pinned = d.daily_prompt?.pinned_text?.trim();
      const title =
        (pinned && pinned.slice(0, 120)) ||
        noteText.split(/\n/)[0]?.trim().slice(0, 120) ||
        "Quick capture";
      setValues((prev) => ({ ...prev, title, body: html }));
      setTags([]);
      const restored: IOnUploadPayload[] = (d.attachments || []).map((a) => ({
        id: a.clientId,
        file: null,
        progress: 100,
        duration: a.durationSec,
        uploadedFile: {
          _id: a._id,
          url: typeof a.url === "string" ? a.url : "",
          name: typeof a.name === "string" ? a.name : "",
          size: 0,
          type: typeof a.type === "string" ? a.type : "",
        },
      }));
      setFiles(restored);
      editor?.commands.setContent(html || "");
      const ids = new Set(Array.isArray(d.selectedBeneficiaryIds) ? d.selectedBeneficiaryIds : []);
      const access = beneficiaryDocs
        .map((b) => beneficiaryToAccessItem(b))
        .filter((x): x is SearchResultItem => x != null && ids.has(x.id));
      setSelectedAccess(access);
      setShareAudience("private");
    },
    [beneficiaryDocs, editor, isDesktopComposer, setFiles, setValues, setTags, setSelectedAccess],
  );

  const handleDeleteQuickCaptureDraft = useCallback((storageKey: string) => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setQuickCaptureDraftNonce((n) => n + 1);
  }, []);

  const handleDeleteDraft = (draftId: string) => {
    setDrafts((prev) => {
      const next = prev.filter((draft) => draft.id !== draftId);
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const deletedDraft = drafts.find((draft) => draft.id === draftId);
    if (deletedDraft && getDraftSignature(deletedDraft) === savedDraftSignature) {
      setSavedDraftSignature(null);
    }
    if (activeDraftIdRef.current === draftId) {
      activeDraftIdRef.current = null;
    }
  };

  const handleClearAllDrafts = () => {
    setDrafts([]);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify([]));
    setSavedDraftSignature(null);
    activeDraftIdRef.current = null;
  };

  const handleSaveDraft = useCallback(() => {
    const uploadedAttachments = files
      .map((file) => file.uploadedFile)
      .filter((file): file is NonNullable<IOnUploadPayload["uploadedFile"]> => Boolean(file));
    const draftId = isDesktopComposer ? (activeDraftIdRef.current ?? uuidv4()) : uuidv4();
    if (isDesktopComposer) activeDraftIdRef.current = draftId;
    const nextDraft: MemoryDraft = {
      id: draftId,
      title: values.title.trim(),
      body: editor?.getHTML() || "",
      tags,
      attachments: uploadedAttachments,
      updatedAt: new Date().toISOString(),
    };

    setDrafts((prev) => {
      const remaining = isDesktopComposer
        ? prev.filter((draft) => draft.id !== draftId)
        : prev.filter((draft) => draft.title !== nextDraft.title || draft.body !== nextDraft.body);
      const next = [nextDraft, ...remaining].slice(0, MAX_DRAFTS);
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSavedDraftSignature(getDraftSignature(nextDraft));
    toast.success("Draft saved");
  }, [editor, files, isDesktopComposer, tags, values.title]);

  const handleSaveDraftAndClose = useCallback(() => {
    handleSaveDraft();
    setShowCloseConfirmation(false);
    close("create-memory", { force: true });
  }, [close, handleSaveDraft]);

  const handleSlashCommandSelect = (command: (typeof SLASH_COMMANDS)[0]) => {
    selectSlashCommand(command);
  };

  const { from, to } = editor?.state.selection || { from: 0, to: 0 };
  const selectedText = editor?.state.doc.textBetween(from, to, " ") || "";
  const previousUrl = editor?.getAttributes("link").href || "";
  const isUploading = files.some((f) => !f.uploadedFile);
  const bodyPlainText = editor?.getText() ?? "";
  const currentDraftSignature = getDraftSignature({
    title: values.title.trim(),
    body: editor?.getHTML() || "",
    tags,
    attachments: files.flatMap((file) => file.uploadedFile ? [file.uploadedFile] : []),
  });
  const isCurrentDraftSaved =
    !isUploading &&
    savedDraftSignature === currentDraftSignature &&
    drafts.some((draft) => getDraftSignature(draft) === savedDraftSignature);
  latestCloseStateRef.current = {
    dirty:
      files.length > 0 ||
      values.title.trim().length > 0 ||
      bodyPlainText.trim().length > 0 ||
      tags.length > 0 ||
      selectedAccess.length > 0 ||
      shareAudience !== "private",
    saved: isCurrentDraftSaved,
  };
  const inlineAttachmentFiles = useMemo(() => files, [files]);
  const mediaFiles = useMemo(
    () => files.filter((file) => getUploadDisplayKind(resolveUploadMimeType(file)) === "media"),
    [files],
  );
  const documentFiles = useMemo(
    () => files.filter((file) => getUploadDisplayKind(resolveUploadMimeType(file)) === "document"),
    [files],
  );
  const formattedToday = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );
  const normalizedStoryText = `${values.title} ${bodyPlainText}`.trim();
  const photoCount = useMemo(
    () =>
      mediaFiles.filter((file) =>
        resolveUploadMimeType(file).startsWith("image/"),
      ).length,
    [mediaFiles],
  );
  const videoCount = useMemo(
    () =>
      mediaFiles.filter((file) =>
        resolveUploadMimeType(file).startsWith("video/"),
      ).length,
    [mediaFiles],
  );
  const voiceNoteCount = useMemo(
    () =>
      mediaFiles.filter((file) =>
        resolveUploadMimeType(file).startsWith("audio/"),
      ).length,
    [mediaFiles],
  );
  const documentCount = documentFiles.length;
  const uploadedFileIds = useMemo(
    () =>
      files
        .map((file) => file.uploadedFile?._id)
        .filter((fileId): fileId is string => typeof fileId === "string" && fileId.length > 0),
    [files],
  );
  const {
    input: assistantInput,
    isWorking: isAssistantWorking,
    messages: assistantMessages,
    suggestions: assistantSuggestions,
    tone: assistantTone,
    setTone: setAssistantTone,
    setInput: setAssistantInput,
    submitMessage: submitAssistantMessage,
    applyAction: applyAssistantAction,
  } = useCreateMemoryAssistant({
    title: values.title,
    bodyText: bodyPlainText,
    uploadedFileIds,
    uploadedMediaCount: mediaFiles.length,
    uploadedDocumentCount: documentFiles.length,
    onApplyTitle: (nextTitle) =>
      setValues((prev) => ({
        ...prev,
        title: nextTitle,
      })),
    onApplyTags: (nextTags) =>
      setTags((prev) => {
        const seen = new Set(prev.map((tag) => tag.toLowerCase()));
        const merged = [...prev];
        for (const tag of nextTags) {
          const trimmed = tag.trim();
          if (!trimmed) continue;
          const key = trimmed.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(trimmed);
        }
        return merged;
      }),
    onApplyBody: (_nextBody, nextHtml) => {
      setValues((prev) => ({
        ...prev,
        body: nextHtml,
      }));
      editor?.commands.setContent(nextHtml);
    },
  });
  const readingMinutes = useMemo(() => {
    const words = normalizedStoryText.split(/\s+/).filter(Boolean).length;
    if (words === 0) return 0;
    return Math.max(1, Math.ceil(words / 200));
  }, [normalizedStoryText]);
  const qualityChecks = useMemo(() => {
    const lower = normalizedStoryText.toLowerCase();
    const tokens = normalizedStoryText.split(/\s+/).filter(Boolean);
    const hasCharacters =
      tokens.length >= 40 ||
      /\b(i|we|he|she|they|mom|dad|mother|father|friend|family)\b/i.test(normalizedStoryText);
    const hasPlaces =
      /\b(in|at|near|inside|outside|home|school|lagos|abuja|london|paris|beach|park|room|street)\b/i.test(
        normalizedStoryText,
      );
    const hasDates =
      /\b(today|yesterday|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?)\b/i.test(
        normalizedStoryText,
      );
    const hasEmotions =
      /\b(happy|sad|angry|joy|excited|afraid|nervous|calm|love|loved|grateful|worried|proud)\b/i.test(
        lower,
      );
    const hasSensoryDetails =
      /\b(bright|dark|loud|quiet|warm|cold|soft|rough|smell|scent|taste|heard|saw|felt)\b/i.test(lower);

    return [
      { label: "Characters", complete: hasCharacters },
      { label: "Places", complete: hasPlaces },
      { label: "Dates", complete: hasDates },
      { label: "Emotions", complete: hasEmotions },
      { label: "Sensory details", complete: hasSensoryDetails },
    ];
  }, [normalizedStoryText]);
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

  const draftsDropdownContent = (
    <DropdownMenuContent
      align="end"
      side="bottom"
      onEscapeKeyDown={variant === "next" && !isMobile ? (event) => event.stopPropagation() : undefined}
      className="z-[220] w-[min(320px,calc(100vw-2rem))] max-h-[min(320px,50vh)] overflow-y-auto border border-stroke-neutral-weak bg-popover text-popover-foreground shadow-lg"
    >
      {quickCaptureKeys.length > 0 ? (
        <>
          <DropdownMenuLabel className="font-inter text-xs font-semibold text-text-neutral-strong">
            Quick capture &amp; daily prompt
          </DropdownMenuLabel>
          {quickCaptureKeys.map((k) => {
            const raw = typeof window !== "undefined" ? localStorage.getItem(k) : null;
            const d = raw ? parseQuickCaptureDraftJson(raw) : null;
            const preview = d ? quickCaptureDraftPreviewLine(d) : "(empty note)";
            const kind = quickCaptureDraftKindLabel(k);
            return (
              <div
                key={k}
                className="flex items-start gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-fill-neutral-weaker"
              >
                <Button
                  type="button"
                  onClick={() => handleLoadQuickCaptureDraft(k)}
                  variant="ghost"
                  size="sm"
                  className="min-w-0 h-auto flex-1 justify-start rounded-lg px-1 py-1 text-left"
                >
                  <div className="truncate text-sm font-medium text-text-neutral-strong">{preview}</div>
                  <div className="mt-0.5 text-[11px] text-text-neutral-weaker">{kind}</div>
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteQuickCaptureDraft(k);
                  }}
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto rounded-md px-2 py-1 text-[11px] text-text-neutral-weak hover:text-text-neutral-strong"
                  title="Delete draft"
                >
                  Delete
                </Button>
              </div>
            );
          })}
          {drafts.length > 0 ? <DropdownMenuSeparator /> : null}
        </>
      ) : null}
      {drafts.length > 0 ? (
        <>
          <DropdownMenuLabel
            className={cn(
              "font-inter text-xs font-semibold text-text-neutral-strong",
              isDesktopComposer && "flex items-center justify-between gap-2",
            )}
          >
            <span>Story composer</span>
            {isDesktopComposer ? (
              <Button
                type="button"
                onClick={handleClearAllDrafts}
                variant="ghost"
                size="xs"
              >
                Clear all
              </Button>
            ) : null}
          </DropdownMenuLabel>
          {!isDesktopComposer ? (
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
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-start gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-fill-neutral-weaker"
            >
              <Button
                type="button"
                onClick={() => handleLoadDraft(draft)}
                variant="ghost"
                size="sm"
                className="min-w-0 h-auto flex-1 justify-start rounded-lg px-1 py-1 text-left"
              >
                <div className="truncate text-sm font-medium text-text-neutral-strong">
                  {draft.title || "Untitled draft"}
                </div>
                <div className="mt-0.5 truncate text-xs text-text-neutral-weak">
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
          ))}
        </>
      ) : null}
      {quickCaptureKeys.length === 0 && drafts.length === 0 ? (
        <div className="px-3 py-2 text-sm text-text-neutral-weak">No drafts yet</div>
      ) : null}
    </DropdownMenuContent>
  );

  const fileInputs = (
    <>
      <input
        ref={fileInputImageRef}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_IMAGES}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputVideoRef}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_VIDEOS}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputAudioRef}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_AUDIO}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputDocsRef}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_DOCUMENTS}
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
    </>
  );

  const uploadGateBanner = showUploadGate ? (
    <div className="mb-3">
      <UpgradePrompt
        feature="storage"
        variant="inline"
        upgradeLabel="View plans"
        onUpgrade={() => navigate("/pricing")}
        onDismiss={() => setShowUploadGate(false)}
      />
    </div>
  ) : null;

  const titleSection = (
    <TitleField
      id="create-memory-title"
      value={values.title}
      name="title"
      onChange={handleChange}
      draftTitle={values.title ?? ""}
      bodyPlain={editor?.getText() ?? ""}
      onSuggestTitle={(t) => handleValue("title", t)}
    />
  );

  const composerSection = (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-stroke-neutral-weak bg-card text-card-foreground shadow-none",
        "transition-[color,box-shadow,border-color]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-inset focus-within:ring-ring/50",
      )}
    >
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
            <DropdownMenu
              modal={false}
              onOpenChange={(open) => {
                if (open) setQuickCaptureDraftNonce((n) => n + 1);
              }}
            >
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
              {draftsDropdownContent}
            </DropdownMenu>
          </div>
        </div>
      <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden">
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
      <div className="mt-3 mb-3 w-full min-w-0 px-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-h-[48px] items-center justify-start gap-1 rounded-2xl border border-stroke-neutral-weak bg-fill-neutral-weaker/60 px-2 py-1.5">
              {/* Attachments & media */}
              <DropdownMenu
                modal={false}
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
                  className="z-[220] min-w-[8.5rem] max-w-[9.5rem] border border-stroke-neutral-weak bg-popover p-0.5 text-popover-foreground shadow-md"
                >
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-1.5 py-1 text-xs text-text-neutral-strong focus:bg-fill-neutral-weaker"
                    onClick={() => fileInputImageRef.current?.click()}
                    title="JPG, PNG, HEIC, WebP, GIF…"
                  >
                    <ImageIcon className="size-3.5 shrink-0 text-text-brand-strong" />
                    Photos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-1.5 py-1 text-xs text-text-neutral-strong focus:bg-fill-neutral-weaker"
                    onClick={() => fileInputVideoRef.current?.click()}
                    title="MP4, WebM, MOV, AVI…"
                  >
                    <Video className="size-3.5 shrink-0 text-text-brand-strong" />
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-1.5 py-1 text-xs text-text-neutral-strong focus:bg-fill-neutral-weaker"
                    onClick={() => fileInputAudioRef.current?.click()}
                    title="MP3, M4A, WAV, FLAC, AAC, OGG…"
                  >
                    <Music className="size-3.5 shrink-0 text-text-brand-strong" />
                    Audio
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-1.5 py-1 text-xs text-text-neutral-strong focus:bg-fill-neutral-weaker"
                    onClick={() => fileInputDocsRef.current?.click()}
                    title="PDF, Word, plain text…"
                  >
                    <Paperclip className="size-3.5 shrink-0 text-text-brand-strong" />
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-0.5" />
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-1.5 py-1 text-xs text-text-neutral-strong focus:bg-fill-neutral-weaker"
                    onClick={() => fileInputAllRef.current?.click()}
                    title="Mixed selection in one picker"
                  >
                    <Plus className="size-3.5 shrink-0 text-icon-neutral-strong" />
                    All types
                  </DropdownMenuItem>
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
                onClick={() =>
                  push("audio-recorder", {
                    onFinish: handleAddAudioFile,
                    recordingNumber: audioRecordingCount,
                  })
                }
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
  );

  const mediaUploadsSection = mediaFiles.length > 0 ? (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-inter text-xs font-semibold uppercase tracking-[0.08em] text-[rgba(15,7,0,0.5)]">
          Media
        </p>
        <p className="font-inter text-xs text-[rgba(15,7,0,0.45)]">
          Images, video, and audio appear inline
        </p>
      </div>
      <FileThumbnails files={mediaFiles} onRemove={handleRemoveFile} variant="media-inline" />
    </div>
  ) : null;

  const fileThumbnailsSection = documentFiles.length > 0 ? (
    <div className="space-y-2">
      <p className="font-inter text-xs font-semibold uppercase tracking-[0.08em] text-[rgba(15,7,0,0.5)]">
        Attachments
      </p>
      <FileThumbnails files={documentFiles} onRemove={handleRemoveFile} />
    </div>
  ) : null;

  const accessSection = (
    <AccessField
      value={selectedAccess}
      onChange={setSelectedAccess}
      shareAudience={shareAudience}
      onShareAudienceChange={setShareAudience}
    />
  );

  const tagsSection = (
    <TagsField
      tags={tags}
      setTags={setTags}
      title={values.title ?? ""}
      body={editor?.getText() ?? ""}
    />
  );

  const legacyFormContent = (
    <>
      {fileInputs}
      {uploadGateBanner}
      {titleSection}
      {composerSection}
      {mediaUploadsSection}
      {fileThumbnailsSection}
      {accessSection}
      {tagsSection}
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

  const closeConfirmationPortal = variant === "next" && !isMobile ? (
    <Dialog
      open={showCloseConfirmation}
      onOpenChange={(open) => setShowCloseConfirmation(open)}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[300]"
        className="z-[310] gap-5 rounded-[24px] border border-stroke-neutral-weak bg-[#fffdf9] sm:max-w-[460px]"
        onClick={(event) => event.stopPropagation()}
        onEscapeKeyDown={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="font-geist text-xl font-semibold text-text-neutral-strong">
            Save this story?
          </DialogTitle>
          <DialogDescription className="font-geist leading-6 text-text-neutral-weak">
            You have unsaved changes. Save them as a draft before leaving, or discard them.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCloseConfirmation(false)}
          >
            Keep editing
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirmClose}>
            Discard
          </Button>
          <Button
            type="button"
            onClick={handleSaveDraftAndClose}
            disabled={isUploading}
          >
            Save draft and exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : showCloseConfirmation ? (
    createPortal(
      <CloseWithFilesConfirmation
        open={showCloseConfirmation}
        close={() => setShowCloseConfirmation(false)}
        onConfirm={handleConfirmClose}
      />,
      document.body,
    )
  ) : null;

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
  if (isMobile && variant === "legacy") {
    return (
      <>
        <Sheet detent="content" isOpen onClose={handleClose} snapPoints={[0, 0.8]} initialSnap={1}>
          <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-v3-bg">
            <Sheet.Header className="rounded-t-3xl bg-v3-bg" />
            <Sheet.Content className="max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain bg-v3-bg px-4 pb-6">
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
              <div className="space-y-4">{legacyFormContent}</div>
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

  if (variant === "legacy") {
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
          <CardContent className="flex h-[700px] min-h-0 flex-col overflow-y-auto px-6 pt-5 pb-16 hide-scrollbar space-y-5">
            {legacyFormContent}
          </CardContent>
          <CardFooter className="shrink-0 border-t border-stroke-neutral-weak px-6 py-4">{footer}</CardFooter>
        </Card>

        {closeConfirmationPortal}
        {videoRecorderDialog}
      </>
    );
  }

  const nextToolbarButton = (
    pressed: boolean,
    onClick: () => void,
    children: ReactNode,
    title?: string,
  ) => (
    <Toggle
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      pressed={pressed}
      onPressedChange={onClick}
      title={title}
      aria-label={title}
      size="sm"
      className="size-8 min-w-8 rounded-[8px] px-0 text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak data-[state=on]:bg-fill-neutral-weak data-[state=on]:text-text-neutral-strong [&_svg]:pointer-events-none"
    >
      {children}
    </Toggle>
  );

  return (
    <>
      <div
        data-testid="desktop-story-environment"
        className="absolute inset-0 overflow-auto bg-cover bg-center py-4 pl-0 pr-4 xl:py-9 xl:pl-0 xl:pr-9 min-[1900px]:px-9"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 12, 8, 0.22), rgba(18, 12, 8, 0.22)), url(${scenicBackground})`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {fileInputs}
        <main
          data-testid="desktop-journal-shell"
          className="add-story-journal relative mx-0 h-[calc(100dvh-32px)] min-h-[720px] w-full max-w-[1440px] overflow-hidden rounded-l-none rounded-r-[30px] shadow-[0_28px_80px_rgba(20,12,7,0.28)] xl:h-[calc(100dvh-72px)] min-[1900px]:mx-auto"
          onKeyDown={(event) => {
            if (event.key !== "Escape" || (!showLinkInput && !showEmoji)) return;
            event.stopPropagation();
            if (showLinkInput) {
              setShowLinkInput(false);
              editor?.commands.focus();
            } else {
              setShowEmoji(false);
              emojiPickerRef.current?.querySelector("button")?.focus();
            }
          }}
        >
          <img
            data-testid="desktop-album-artwork"
            src={albumArtwork}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full rounded-l-none rounded-r-[30px] object-cover object-left-top"
          />
          <div className="relative grid h-full min-h-[720px] grid-rows-[auto_minmax(0,1fr)] gap-5 py-6 pl-[max(225px,22%,calc((100dvh-32px)*0.31))] pr-6 xl:gap-8 xl:py-10 xl:pl-[max(250px,22%,calc((100dvh-72px)*0.31))] xl:pr-10">
            <div>
              <header className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex shrink-0 items-center gap-2 font-geist text-sm text-text-neutral-weak">
                  <CalendarDays aria-hidden className="size-4 text-icon-info-strong" />
                  <span>{formattedToday}</span>
                </div>
                <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-3">
                  <DropdownMenu
                    modal={false}
                    onOpenChange={(open) => {
                      if (open) setQuickCaptureDraftNonce((n) => n + 1);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="sm">
                        Drafts
                      </Button>
                    </DropdownMenuTrigger>
                    {draftsDropdownContent}
                  </DropdownMenu>
                  <div className="flex shrink-0 items-center gap-2 whitespace-nowrap font-geist text-sm text-text-neutral-weaker" role="status">
                    <Cloud aria-hidden className="size-4" />
                    <span>{isCurrentDraftSaved ? "Draft saved" : "Not saved"}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => toast.message("Preview is not available yet.")}
                  >
                    <Play data-icon="inline-start" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isMutating || isUploading}
                  >
                    Publish Story
                    <Spinner loading={isMutating} className="size-4!" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-lg" onClick={handleClose} aria-label="Close">
                    <X />
                  </Button>
                </div>
              </header>
              {showUploadGate ? <div className="mt-4">{uploadGateBanner}</div> : null}
            </div>
            <div
              className="story-composer-layout grid min-h-0 gap-5 xl:gap-7"
              data-details-open={isDetailsOpen}
            >
              <section className="flex min-h-0 min-w-0 flex-col pr-1">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2 pt-8 xl:px-3 xl:pt-10">
                    <div
                      data-testid="desktop-composer-scroll-surface"
                      className="flex min-h-full min-w-0 max-w-[760px] flex-col"
                    >
                      <textarea
                        ref={titleTextareaRef}
                        id="create-memory-title-next"
                        placeholder="Give this story a title..."
                        value={values.title}
                        name="title"
                        onChange={handleTitleChange}
                        onKeyDown={handleTitleKeyDown}
                        rows={1}
                        className="w-full shrink-0 resize-none overflow-hidden border-0 bg-transparent p-0 font-garamond text-[clamp(2rem,3vw,2.5rem)] italic leading-[1.15] text-text-neutral-strong placeholder:text-text-neutral-weaker focus:outline-none"
                      />

                      <div className="relative mt-6 flex min-h-[240px] flex-1 flex-col">
                        <EditorContent
                          editor={editor}
                          className="tiptap-editor tiptap-editor--memory-next min-h-[240px] w-full flex-1"
                        />
                        <SlashCommandPopup
                          show={showSlashMenu}
                          position={slashPosition}
                          commands={SLASH_COMMANDS}
                          selectedIndex={slashSelectedIndex}
                          onSelectedIndexChange={setSlashSelectedIndex}
                          onCommandSelect={handleSlashCommandSelect}
                          onClose={() => setShowSlashMenu(false)}
                        />
                        {showLinkInput ? (
                          <LinkInput
                            show={showLinkInput}
                            position={linkPosition}
                            initialText={selectedText}
                            initialUrl={previousUrl}
                            onSubmit={handleLinkSubmit}
                            onRemove={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
                            onClose={() => setShowLinkInput(false)}
                          />
                        ) : null}
                      </div>

                      <div
                        data-testid="desktop-composer-media-section"
                        className={cn("mt-auto", inlineAttachmentFiles.length > 0 ? "pt-6" : "pt-0")}
                      >
                        {inlineAttachmentFiles.length > 0 ? (
                          <FileThumbnails
                            files={inlineAttachmentFiles}
                            onRemove={handleRemoveFile}
                            variant="media-inline"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 w-full max-w-[760px] shrink-0 rounded-[14px] border border-stroke-neutral-weak bg-[rgba(232,226,216,0.64)] px-3 py-2 shadow-[0_8px_24px_rgba(61,45,32,0.06)] backdrop-blur-[6px]">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <DropdownMenu
                          modal={false}
                          onOpenChange={(open) => {
                            if (open) setShowEmoji(false);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="default"
                              size="icon"
                              className="size-9 rounded-[10px] bg-fill-neutral-strong text-text-inverse-strong hover:bg-fill-neutral-strong/90"
                              aria-label="Add attachment"
                              title="Add attachment"
                            >
                              <Plus className="size-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="top"
                            align="start"
                            onEscapeKeyDown={(event) => event.stopPropagation()}
                            className="z-[220]"
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Choose upload type</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => fileInputImageRef.current?.click()}>
                                <ImageIcon />
                                Photos
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => fileInputVideoRef.current?.click()}>
                                <Video />
                                Videos
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => fileInputAudioRef.current?.click()}>
                                <Music />
                                Audio
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => fileInputDocsRef.current?.click()}>
                                <Paperclip />
                                Documents
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <div ref={emojiPickerRef} className="relative">
                          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 rounded-[10px] text-icon-neutral-strong hover:bg-fill-neutral-weak"
                                aria-label="Insert emoji"
                                title="Insert emoji"
                              >
                                <span aria-hidden className="text-lg leading-none">🙂</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              ref={emojiPickerPortalRef}
                              side="top"
                              align="start"
                              sideOffset={12}
                              onEscapeKeyDown={(event) => event.stopPropagation()}
                              className="z-[220] w-auto overflow-hidden border-stroke-neutral-weak p-0 shadow-lg"
                            >
                              <Picker
                                data={emojiData}
                                onEmojiSelect={(e: { native: string }) => {
                                  editor?.chain().focus().insertContent(e.native).run();
                                  setShowEmoji(false);
                                }}
                                theme="light"
                                previewPosition="none"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <Separator orientation="vertical" className="h-5 bg-stroke-neutral-weak" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            push("audio-recorder", {
                              onFinish: handleAddAudioFile,
                              recordingNumber: audioRecordingCount,
                            })
                          }
                          className="size-9 rounded-[10px] text-icon-neutral-strong hover:bg-fill-neutral-weak"
                          aria-label="Record audio"
                          title="Record audio"
                        >
                          <Mic className="size-5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setVideoRecordedFile(null);
                            setShowVideoRecorder(true);
                          }}
                          className="size-9 rounded-[10px] text-icon-neutral-strong hover:bg-fill-neutral-weak"
                          aria-label="Record video"
                          title="Record video"
                        >
                          <Video className="size-5" />
                        </Button>
                      </div>

                      <div className="flex min-w-0 flex-wrap items-center gap-1">
                        {nextToolbarButton(
                          formattingState.bold,
                          () => editor?.chain().focus().toggleBold().run(),
                          <span className="font-geist text-sm font-bold leading-none text-text-neutral-strong">B</span>,
                          "Bold",
                        )}
                        {nextToolbarButton(
                          formattingState.italic,
                          () => editor?.chain().focus().toggleItalic().run(),
                          <span className="font-geist text-sm italic leading-none text-text-neutral-strong">I</span>,
                          "Italic",
                        )}
                        {nextToolbarButton(
                          formattingState.strike,
                          () => editor?.chain().focus().toggleStrike().run(),
                          <span className="font-geist text-sm leading-none line-through text-text-neutral-strong">S</span>,
                          "Strikethrough",
                        )}
                        {nextToolbarButton(
                          formattingState.underline,
                          () => editor?.chain().focus().toggleUnderline().run(),
                          <span className="font-geist text-sm leading-none underline text-text-neutral-strong">U</span>,
                          "Underline",
                        )}
                        {nextToolbarButton(
                          formattingState.link || showLinkInput,
                          handleLinkClick,
                          <LinkIcon width={15} height={10} />,
                          "Link",
                        )}
                        <Separator orientation="vertical" className="h-5 bg-stroke-neutral-weak" />
                        {nextToolbarButton(
                          formattingState.bulletList,
                          () => editor?.chain().focus().toggleBulletList().run(),
                          <UnorderedListIcon width={16} height={14} />,
                          "Bullet list",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <div className="relative min-h-0 min-w-0">
                <div
                  className="story-details-trigger-rail absolute inset-0 flex items-start justify-start pt-8 xl:pt-10"
                  data-visible={!isDetailsOpen}
                  aria-hidden={isDetailsOpen}
                  inert={isDetailsOpen}
                >
                  <Button
                    ref={detailsTriggerRef}
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-expanded={isDetailsOpen}
                    aria-controls="story-details-panel"
                    onClick={() => {
                      hasToggledDetailsRef.current = true;
                      setIsDetailsOpen(true);
                    }}
                    className="gap-2 px-2 font-geist font-semibold text-text-neutral-strong hover:bg-fill-neutral-weak"
                  >
                    <ListFilter aria-hidden className="size-4 text-icon-neutral-strong" />
                    Story Details
                  </Button>
                </div>

                <aside
                  id="story-details-panel"
                  className="story-details-panel absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-stroke-neutral-weak bg-fill-neutral-weaker"
                  data-visible={isDetailsOpen}
                  aria-hidden={!isDetailsOpen}
                  inert={!isDetailsOpen}
                >
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <Tabs
                    value={activeSidebarTab}
                    onValueChange={(value) => {
                      if (value === "properties" || value === "assistant") {
                        setActiveSidebarTab(value);
                      }
                    }}
                    className="min-h-0 flex-1 flex-col gap-0"
                  >
                    <div className="mb-5 flex shrink-0 items-center gap-1 px-3 pt-4">
                      <TabsList className="h-9 min-w-0 flex-1 rounded-[10px] bg-fill-neutral-weaker p-0">
                        <TabsTrigger
                          ref={detailsTabRef}
                          value="properties"
                          className="rounded-[8px] px-3 font-geist text-sm text-text-neutral-weak data-[state=active]:bg-fill-neutral-weak data-[state=active]:text-text-neutral-strong"
                        >
                          Story Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="assistant"
                          className="rounded-[8px] px-3 font-geist text-sm text-text-neutral-weak data-[state=active]:bg-fill-neutral-weak data-[state=active]:text-text-neutral-strong"
                        >
                          Assistant
                        </TabsTrigger>
                      </TabsList>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Collapse story details"
                        onClick={() => {
                          hasToggledDetailsRef.current = true;
                          setIsDetailsOpen(false);
                        }}
                        className="rounded-[8px] text-icon-neutral-weak hover:bg-fill-neutral-weak hover:text-icon-neutral-strong"
                      >
                        <PanelRightClose aria-hidden className="size-4" />
                      </Button>
                    </div>

                    <TabsContent value="properties" className="hide-scrollbar min-h-0 overflow-y-auto px-4 pb-5">
                      <div className="flex flex-col gap-6">
                        <AccessField
                          value={selectedAccess}
                          onChange={setSelectedAccess}
                          shareAudience={shareAudience}
                          onShareAudienceChange={setShareAudience}
                          variant="panel"
                          dismissOnEscape
                        />

                        <TagsField
                          tags={tags}
                          setTags={setTags}
                          title={values.title ?? ""}
                          body={bodyPlainText}
                          variant="panel"
                        />

                        <section className="flex flex-col gap-3">
                          <h3 className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">
                            Story quality
                          </h3>
                          <div className="rounded-[12px] border border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-2">
                            {qualityChecks.map((item) => (
                              <div key={item.label} className="flex items-center justify-between gap-3 py-1">
                                <span className="font-geist text-sm leading-5 text-text-neutral-strong">{item.label}</span>
                                {item.complete ? (
                                  <Check aria-label={`${item.label} complete`} className="size-4 shrink-0 text-icon-success-strong" />
                                ) : (
                                  <Circle aria-label={`${item.label} incomplete`} className="size-4 shrink-0 text-icon-neutral-weaker" />
                                )}
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-3">
                          <h3 className="font-geist text-base font-semibold leading-6 text-[rgba(15,7,0,0.9)]">
                            Story Overview
                          </h3>
                          <div className="space-y-2">
                            {[
                              { label: "Photos", value: photoCount, icon: ImageIcon },
                              { label: "Videos", value: videoCount, icon: Video },
                              { label: "Voice notes", value: voiceNoteCount, icon: Mic },
                              { label: "Documents", value: documentCount, icon: FileText },
                              { label: "Mins read", value: readingMinutes, icon: Clock3 },
                            ].map(({ label, value, icon: Icon }) => (
                              <div key={label} className="flex items-center gap-2.5">
                                <Icon className="size-4 text-[rgba(15,7,0,0.45)]" aria-hidden />
                                <div className="flex min-w-0 flex-1 items-center gap-1.5 font-geist text-xs leading-4 text-[rgba(15,7,0,0.9)]">
                                  <span>{value}</span>
                                  <span>{label}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    <TabsContent value="assistant" className="hide-scrollbar min-h-0 overflow-y-auto px-4 pb-5 data-[state=active]:flex data-[state=active]:flex-col">
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

                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>
      {closeConfirmationPortal}
      {videoRecorderDialog}
    </>
  );
}
