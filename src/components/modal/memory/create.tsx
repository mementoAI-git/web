"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useModal } from "@/hooks/use-modal";
import useForm from "@/hooks/use-form";
import useFileUpload from "@/hooks/use-file-upload";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import { fileUploadFetcher, postFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { cn, isEmpty } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import { SUPPORTED_FILE_TYPES } from "@/utility/constant";
import { TimesIcon, LinkIcon, UnorderedListIcon } from "@/components/icons";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import Spinner from "@/components/spinner";
import type { IBeneficiary } from "@/utility/interface";
import { createPortal } from "react-dom";
import { CloseWithFilesConfirmation } from "./close-with-files-confirmation";
import { Sheet } from "react-modal-sheet";
import { LinkInput } from "@/components/memory/text-area/link-input";
import { VideoRecorder } from "@/components/recorder/video";
import useRecorder from "@/hooks/use-recorder";

import addPlusSvg from "@/assets/icon/Add-plus.svg";
import smileySvg from "@/assets/icon/noto_slightly-smiling-face.svg";
import micSvg from "@/assets/icon/microphone-01.svg";
import videoRecorderSvg from "@/assets/icon/video-recorder.svg";
import recUploadSvg from "@/assets/icon/rec upload - short.svg";
import videoUploadSvg from "@/assets/icon/Video Upload.svg";
import docUploadSvg from "@/assets/icon/Document Upload.svg";
import musicUploadSvg from "@/assets/icon/music upload - short.svg";
import imageUploadSvg from "@/assets/icon/Image Upload.svg";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function getFileThumbSvg(mimeType: string): string | null {
  if (mimeType.startsWith("image/")) return null;
  if (mimeType === "audio/webm" || mimeType === "audio/ogg") return recUploadSvg;
  if (mimeType.startsWith("audio/")) return musicUploadSvg;
  if (mimeType.startsWith("video/")) return videoUploadSvg;
  return docUploadSvg;
}

const chipColors = [
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-purple-50 text-purple-600 border-purple-100",
  "bg-pink-50 text-pink-600 border-pink-100",
];

const ACTIVE_BG = "bg-[rgba(23,11,0,0.1)]";
const initial = { title: "", body: "", attachments: [] as string[] };

// ─── Audio Recorder Popup ────────────────────────────────────────────────────

function AudioRecorderPopup({
  onClose,
  onAddFile,
  recordingNumber,
}: {
  onClose: () => void;
  onAddFile: (file: File) => void;
  recordingNumber: number;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const rec = useRecorder(stream, "audio/webm");

  const handleStart = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        setTimeout(() => rec.start(), 500);
      })
      .catch(() => toast.error("Mic access denied or not available."));
  };

  const handleReset = () => {
    rec.reset();
    setStream(null);
  };

  const handleAddToPost = () => {
    if (rec.url) {
      // Already stopped — use the blob URL
      fetch(rec.url)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], `recording-${recordingNumber}.webm`, { type: "audio/webm" });
          onAddFile(file);
          onClose();
        });
    } else if (rec.chunks.length > 0) {
      // Paused — build file from accumulated chunks directly
      const blob = new Blob(rec.chunks, { type: "audio/webm" });
      const file = new File([blob], `recording-${recordingNumber}.webm`, { type: "audio/webm" });
      rec.stop(); // clean up stream
      onAddFile(file);
      onClose();
    }
  };

  const isIdle = rec.timer === 0 && !rec.url;
  const isRecording = rec.recording;
  const isPaused = !rec.recording && rec.timer > 0 && !rec.url;
  const isDone = !!rec.url;

  const barHeights = [6, 12, 18, 10, 22, 14, 20, 8, 16, 12, 24, 10, 15];
  const barColor = isRecording ? "#7C3AED" : isPaused ? "#F97316" : isDone ? "#22C55E" : "#D1D5DB";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-[28px] w-full max-w-[380px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 0L7.2 4H11L8 6.5L9.2 10.5L6 8L2.8 10.5L4 6.5L1 4H4.8L6 0Z" fill="#7C3AED" />
            </svg>
            <span className="font-inter text-xs font-bold text-purple-600 tracking-widest uppercase">Record Audio</span>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <TimesIcon width={10} height={10} />
          </button>
        </div>

        {/* Waveform card */}
        <div className="mx-6 mt-4 mb-5 bg-gray-50 rounded-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-inter text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              New Recording #{String(recordingNumber).padStart(2, "0")}
            </span>
            <span className="font-mono text-[11px] text-gray-400">{formatTimer(rec.timer)}</span>
          </div>
          <div className="flex items-end justify-center gap-1 h-10">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-colors duration-300"
                style={{ height: h, backgroundColor: barColor }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-7">
          {/* Idle */}
          {isIdle && (
            <div className="flex flex-col items-center gap-4">
              <p className="font-inter text-xs font-semibold text-gray-400 tracking-widest uppercase">Click to record</p>
              <button
                onClick={handleStart}
                className="w-full h-12 rounded-full bg-[#170B00] text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Start talking
              </button>
            </div>
          )}

          {/* Recording */}
          {isRecording && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-inter text-sm font-bold text-red-500 tracking-widest uppercase">Recording</span>
              </div>
              <div className="flex items-center justify-center gap-12">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={rec.pause}
                    className="size-14 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                      <rect x="0" y="0" width="4.5" height="18" rx="2" fill="#374151" />
                      <rect x="9.5" y="0" width="4.5" height="18" rx="2" fill="#374151" />
                    </svg>
                  </button>
                  <span className="font-inter text-xs text-gray-500">Pause</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => rec.stop()}
                    className="size-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="3" fill="white" />
                    </svg>
                  </button>
                  <span className="font-inter text-xs text-gray-500">Stop</span>
                </div>
              </div>
            </div>
          )}

          {/* Paused or Done */}
          {(isPaused || isDone) && (
            <div className="flex flex-col items-center gap-4">
              {isPaused && (
                <div className="flex items-center gap-2">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                    <rect x="0" y="0" width="4" height="14" rx="2" fill="#EF4444" />
                    <rect x="8" y="0" width="4" height="14" rx="2" fill="#EF4444" />
                  </svg>
                  <span className="font-inter text-sm font-bold text-red-500 tracking-widest uppercase">Paused</span>
                </div>
              )}
              {isDone && (
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="font-inter text-sm font-semibold text-green-600">Recording ready</span>
                </div>
              )}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleReset}
                  className="flex-1 h-10 rounded-full bg-gray-100 text-gray-600 font-inter font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
                {isPaused && (
                  <button
                    onClick={rec.resume}
                    className="flex-1 h-10 rounded-full bg-orange-100 text-orange-600 font-inter font-semibold text-sm hover:bg-orange-200 transition-colors"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={handleAddToPost}
                  className="flex-1 h-10 rounded-full bg-[#170B00] text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Add to post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── CreateMemory ─────────────────────────────────────────────────────────────

interface CreateMemoryProps {
  data: any;
  isMobile?: boolean;
}

export function CreateMemory({ data, isMobile = false }: CreateMemoryProps) {
  const { close, open } = useModal();
  const fileInputMediaRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const videoRecorderRef = useRef<any>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [accessInput, setAccessInput] = useState("");
  const [selectedAccess, setSelectedAccess] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoRecordedFile, setVideoRecordedFile] = useState<File | null>(null);
  const [isUsingVideo, setIsUsingVideo] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [audioRecordingCount, setAudioRecordingCount] = useState(1);

  const { trigger, isMutating } = useSWRMutation(endpoint.memories, fileUploadFetcher);
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();
  const { data: beneficiariesData } = useSWR(`${endpoint.beneficiaries}?page=1`);
  const beneficiaries: IBeneficiary[] = beneficiariesData?.data?.docs || [];

  const { values, handleChange, handleSubmit, handleValue, setValues } = useForm({
    initial: { ...initial, ...data?.payload },
    async onSubmit(p) {
      if (isEmpty(p.title)) return toast.error("Title is required");
      const bodyText = editor?.getText()?.trim() || "";
      if (!bodyText && files.length === 0) {
        return toast.error("Please add some content or a media file before continuing");
      }
      const uploadedFiles = files.filter((f) => f.uploadedFile).map((f) => f.uploadedFile._id);
      if (uploadedFiles.length > 0) p.attachments = uploadedFiles;
      const result = await trigger({ ...p, status: "draft", tags });
      if (result?.success) {
        mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories));
        open("share-post", { id: result.data?._id || result.data?.id });
        setValues(initial);
        setFiles([]);
        setTags([]);
      }
    },
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "What's on your mind today?" }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-500 underline cursor-pointer" },
      }),
    ],
    content: values.body || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[140px] px-4 py-4 text-sm text-gray-800",
      },
    },
    onUpdate: ({ editor }) => {
      handleValue("body", editor.getHTML());
    },
  });

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const fileItems = items.filter((item) => item.kind === "file");
      if (fileItems.length === 0) return;
      e.preventDefault();
      fileItems.forEach((item) => {
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
        };
        reader.readAsDataURL(file);
      });
    },
    [handleUpload],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    const handle = () => {
      setShowEmoji(false);
      setShowPlusMenu(false);
      setShowAccessDropdown(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
      };
      reader.readAsDataURL(file);
    });
    if (fileInputMediaRef.current) fileInputMediaRef.current.value = "";
    if (fileInputAllRef.current) fileInputAllRef.current.value = "";
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

  const handleAddAudioFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
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

  const handleClose = () => {
    if (files.length > 0) {
      setShowCloseConfirmation(true);
    } else {
      close("create-memory");
    }
  };

  const handleConfirmClose = async () => {
    setShowCloseConfirmation(false);
    const deletes = files.filter((f) => f.uploadedFile).map((f) => handleDeleteFile(f));
    await Promise.all(deletes);
    setFiles([]);
    close("create-memory");
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

  const handleAutogenerateTags = async () => {
    const content = editor?.getText()?.trim() || "";
    if (!content) return toast.error("Add some story content first to autogenerate tags");
    setIsGeneratingTags(true);
    try {
      const result = await postFetcher(endpoint.aiPrompt, {
        arg: {
          message: `Based on the following story content, suggest 5–7 short, relevant tags (single words or short phrases). Return only the tags as a comma-separated list with no extra text:\n\n${content.slice(0, 800)}`,
        },
      });
      const tagsText =
        result?.data?.message || result?.data?.content || result?.data?.text || result?.message || "";
      const newTags = tagsText
        .split(/[,\n]/)
        .map((t: string) => t.trim().replace(/^#/, "").replace(/['"]/g, ""))
        .filter((t: string) => t.length > 0 && t.length < 40);
      if (newTags.length > 0) {
        setTags((prev) => [...new Set([...prev, ...newTags])]);
      } else {
        toast.error("Couldn't parse tags from the response. Try again.");
      }
    } catch {
      toast.error("Failed to autogenerate tags");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      !selectedAccess.find((a) => a.id === b._id) &&
      b.name.toLowerCase().includes(accessInput.replace("@", "").toLowerCase()),
  );

  const addAccess = (b: IBeneficiary) => {
    setSelectedAccess((prev) => [...prev, { id: b._id!, name: b.name }]);
    setAccessInput("");
    setShowAccessDropdown(false);
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const { from, to } = editor?.state.selection || { from: 0, to: 0 };
  const selectedText = editor?.state.doc.textBetween(from, to, " ") || "";
  const previousUrl = editor?.getAttributes("link").href || "";
  const isUploading = files.some((f) => !f.uploadedFile);

  const toolbarBtn = (isActive: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "size-9 flex items-center justify-center rounded-lg transition-colors hover:bg-[rgba(23,11,0,0.05)]",
        isActive && ACTIVE_BG,
      )}
    >
      {children}
    </button>
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
        accept={SUPPORTED_FILE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Title */}
      <input
        placeholder="Enter title here"
        value={values.title}
        name="title"
        onChange={handleChange}
        className="create-memory-title font-inter text-base w-full outline-none border border-gray-200 rounded-xl px-4 py-3"
        style={{ color: "rgba(23,11,0,0.9)" }}
      />

      {/* Editor box */}
      <div className="rounded-[24px] border border-gray-200 flex flex-col overflow-hidden">
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 pt-4 px-4 pb-3">
          {toolbarBtn(
            !!editor?.isActive("bold"),
            () => editor?.chain().focus().toggleBold().run(),
            <span className="font-bold text-sm text-gray-800 leading-none">B</span>,
            "Bold",
          )}
          {toolbarBtn(
            !!editor?.isActive("italic"),
            () => editor?.chain().focus().toggleItalic().run(),
            <span className="italic text-sm text-gray-800 leading-none">I</span>,
            "Italic",
          )}
          {toolbarBtn(
            !!editor?.isActive("strike"),
            () => editor?.chain().focus().toggleStrike().run(),
            <span className="line-through text-sm text-gray-800 leading-none">S</span>,
            "Strikethrough",
          )}
          {toolbarBtn(
            false,
            () => {},
            <span className="underline text-sm text-gray-800 leading-none">U</span>,
            "Underline",
          )}

          <div className="w-px h-5 bg-gray-200 mx-1.5" />

          {toolbarBtn(!!editor?.isActive("link"), handleLinkClick, <LinkIcon width={16} height={11} />, "Link")}
          {toolbarBtn(
            !!editor?.isActive("bulletList"),
            () => editor?.chain().focus().toggleBulletList().run(),
            <UnorderedListIcon width={16} height={14} />,
            "List",
          )}

          <button
            type="button"
            className="ml-auto font-inter text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-[rgba(23,11,0,0.05)] transition-colors"
          >
            Drafts
          </button>
        </div>

        {/* Editor */}
        <div className="relative flex-1">
          <EditorContent editor={editor} className="tiptap-editor" />
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

        {/* File thumbnails */}
        {files.length > 0 && (
          <div className="mt-6 px-4 overflow-x-auto hide-scrollbar">
            <div className="flex gap-3 pb-1">
              {files.map((f) => {
                const mimeType = f.file?.type || f.uploadedFile?.type || "";
                const thumbSvg = getFileThumbSvg(mimeType);
                const isImage = mimeType.startsWith("image/");
                const imgSrc = isImage ? (f.base64 || f.uploadedFile?.url || "") : (thumbSvg ?? imageUploadSvg);
                const sizeBytes =
                  f.file?.size ?? (typeof f.uploadedFile?.size === "number" ? f.uploadedFile.size : 0);
                const sizeLabel = sizeBytes ? formatFileSize(sizeBytes) : "";
                const isUpl = f.progress !== undefined && f.progress !== 100;

                return (
                  <div key={f.id} className="relative shrink-0">
                    {/* X button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.id)}
                      className="absolute -top-2 -right-2 z-10 size-6 rounded-full bg-gray-500 hover:bg-gray-700 flex items-center justify-center transition-colors shadow"
                    >
                      <TimesIcon width={8} height={8} />
                    </button>

                    <div className="w-24 h-24 rounded-xl overflow-hidden relative bg-gray-100">
                      <img
                        src={imgSrc}
                        className="w-full h-full object-cover"
                        alt=""
                      />

                      {/* Upload progress overlay */}
                      {isUpl && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="font-inter text-white text-xs font-semibold">{f.progress}%</span>
                        </div>
                      )}

                      {/* Size pill */}
                      {sizeLabel && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/55 rounded-full px-2 py-0.5">
                          <span className="font-inter text-white text-[9px] font-semibold whitespace-nowrap">
                            {sizeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Icons bar */}
        <div className="mt-6 mx-4 mb-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#F4F4F4] rounded-2xl flex items-center gap-3 px-[12px] py-[10px]">
            {/* Plus menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu((p) => !p);
                  setShowEmoji(false);
                }}
                className="shrink-0 rounded-[10px] overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img src={addPlusSvg} alt="Add" width={40} height={40} />
              </button>
              {showPlusMenu && (
                <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => { fileInputMediaRef.current?.click(); setShowPlusMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <span className="text-base">📷</span> Photos & Videos
                  </button>
                  <button
                    type="button"
                    onClick={() => { fileInputAllRef.current?.click(); setShowPlusMenu(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <span className="text-base">📎</span> Files
                  </button>
                </div>
              )}
            </div>

            {/* Emoji */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowEmoji((p) => !p); setShowPlusMenu(false); }}
                className="size-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
              >
                <img src={smileySvg} alt="Emoji" width={20} height={20} />
              </button>
              {showEmoji && (
                <div className="absolute bottom-12 left-0 z-20 shadow-xl">
                  <Picker
                    data={emojiData}
                    onEmojiSelect={(e: any) => {
                      editor?.chain().focus().insertContent(e.native).run();
                      setShowEmoji(false);
                    }}
                    theme="light"
                    previewPosition="none"
                  />
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-300 shrink-0" />

            {/* Record audio */}
            <button
              type="button"
              onClick={() => setShowAudioRecorder(true)}
              className="size-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
              title="Record audio"
            >
              <img src={micSvg} alt="Record audio" width={20} height={20} />
            </button>

            {/* Record video */}
            <button
              type="button"
              onClick={() => { setVideoRecordedFile(null); setShowVideoRecorder(true); }}
              className="size-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
              title="Record video"
            >
              <img src={videoRecorderSvg} alt="Record video" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Who has access */}
      <div>
        <p className="font-inter text-sm font-medium text-gray-700 mb-2">
          Who has access to this story?{" "}
          <span className="text-gray-400 font-normal">(tag a user with @)</span>
        </p>
        <div
          className="relative flex flex-wrap gap-2 min-h-[48px] px-3 py-2 border border-gray-200 rounded-xl bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedAccess.map((a, i) => (
            <span
              key={a.id}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium",
                chipColors[i % chipColors.length],
              )}
            >
              @{a.name}
              <button
                type="button"
                onClick={() => setSelectedAccess((prev) => prev.filter((x) => x.id !== a.id))}
                className="opacity-60 hover:opacity-100 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={accessInput}
            onChange={(e) => {
              setAccessInput(e.target.value);
              setShowAccessDropdown(e.target.value.length > 0);
            }}
            onKeyDown={(e) => { if (e.key === "Escape") setShowAccessDropdown(false); }}
            placeholder={selectedAccess.length === 0 ? "Type @ to tag someone..." : ""}
            className="flex-1 min-w-[100px] outline-none font-inter text-sm text-gray-700 placeholder:text-gray-400"
          />
          {showAccessDropdown && filteredBeneficiaries.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 max-h-40 overflow-y-auto">
              {filteredBeneficiaries.map((b) => (
                <button
                  type="button"
                  key={b._id}
                  onClick={() => addAccess(b)}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 text-left"
                >
                  <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {b.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium leading-tight">{b.name}</p>
                    {b.relationship && (
                      <p className="text-xs text-gray-400 capitalize">{b.relationship}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="font-inter text-sm font-medium text-gray-700 mb-2">Tags</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 font-inter text-xs text-gray-700"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  className="opacity-60 hover:opacity-100 leading-none ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
            }}
            placeholder="Manually add tags or click to autogenerate"
            className="flex-1 outline-none font-inter text-sm text-gray-500 placeholder:text-gray-400 px-4 py-3"
          />
          <button
            type="button"
            onClick={handleAutogenerateTags}
            disabled={isGeneratingTags}
            className="shrink-0 flex items-center gap-1.5 bg-[#EEEAF8] hover:bg-[#E5DFFF] text-[#6941C6] font-inter font-semibold text-sm px-3 py-2 mx-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {isGeneratingTags ? (
              <Spinner loading className="size-4!" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <defs>
                  <linearGradient id="sparkle-grad" x1="0" y1="0" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#9E77ED" />
                    <stop offset="100%" stopColor="#6941C6" />
                  </linearGradient>
                </defs>
                <path d="M9 1.5L10.545 6.455L15.5 8L10.545 9.545L9 14.5L7.455 9.545L2.5 8L7.455 6.455L9 1.5Z" fill="url(#sparkle-grad)" />
                <path d="M14.5 12.5L15.25 14.75L17.5 15.5L15.25 16.25L14.5 18.5L13.75 16.25L11.5 15.5L13.75 14.75L14.5 12.5Z" fill="url(#sparkle-grad)" opacity="0.7" />
                <path d="M3 1L3.5 2.5L5 3L3.5 3.5L3 5L2.5 3.5L1 3L2.5 2.5L3 1Z" fill="url(#sparkle-grad)" opacity="0.5" />
              </svg>
            )}
            Autogenerate
          </button>
        </div>
      </div>
    </>
  );

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        className="h-11 px-6 rounded-full font-inter font-semibold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        Dismiss
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isMutating || isUploading}
        className="h-11 px-6 rounded-full font-inter font-semibold text-sm text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
        style={{ backgroundColor: "#FF5E00" }}
      >
        Continue
        <Spinner loading={isMutating} className="size-4!" />
      </button>
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

  // Video recorder portal popup
  const videoRecorderPortal = showVideoRecorder
    ? createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-[28px] w-full max-w-[480px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 0L7.2 4H11L8 6.5L9.2 10.5L6 8L2.8 10.5L4 6.5L1 4H4.8L6 0Z" fill="#7C3AED" />
                </svg>
                <span className="font-inter text-xs font-bold text-purple-600 tracking-widest uppercase">Record Video</span>
              </div>
              <button
                onClick={() => {
                  if (videoRecorderRef.current?.reset) videoRecorderRef.current.reset();
                  if (videoRecorderRef.current?.resetStream) videoRecorderRef.current.resetStream();
                  setVideoRecordedFile(null);
                  setShowVideoRecorder(false);
                }}
                className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <TimesIcon width={10} height={10} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <VideoRecorder
                ref={videoRecorderRef}
                onStart={() => {}}
                onFinish={setVideoRecordedFile}
              />
              {videoRecordedFile && (
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoRecordedFile(null);
                      if (videoRecorderRef.current?.reset) videoRecorderRef.current.reset();
                      if (videoRecorderRef.current?.resetStream) videoRecorderRef.current.resetStream();
                    }}
                    className="flex-1 h-10 rounded-full bg-gray-100 text-gray-600 font-inter font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Re-record
                  </button>
                  <button
                    type="button"
                    onClick={handleUseVideo}
                    disabled={isUsingVideo}
                    className="flex-1 h-10 rounded-full bg-[#170B00] text-white font-inter font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                  >
                    Add to post
                    <Spinner loading={isUsingVideo} className="size-4!" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  // Mobile
  if (isMobile) {
    return (
      <>
        <Sheet detent="content" isOpen onClose={handleClose} snapPoints={[0.5, 0.75, 1]} initialSnap={1}>
          <Sheet.Container className="bg-white">
            <Sheet.Header className="bg-white rounded-t-3xl" />
            <Sheet.Content className="bg-white px-4 pb-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-garamond text-xl font-medium text-gray-900">Add New Story</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <TimesIcon width={10} height={10} />
                </button>
              </div>
              <div className="space-y-4">{formContent}</div>
              <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div>
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop onTap={handleClose} />
        </Sheet>
        {closeConfirmationPortal}
        {showAudioRecorder && (
          <AudioRecorderPopup
            onClose={() => setShowAudioRecorder(false)}
            onAddFile={handleAddAudioFile}
            recordingNumber={audioRecordingCount}
          />
        )}
        {videoRecorderPortal}
      </>
    );
  }

  // Desktop
  return (
    <>
      <div
        className="absolute top-5 right-5 bottom-5 w-full max-w-[520px] bg-white flex flex-col shadow-2xl rounded-[24px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="font-garamond text-2xl font-medium text-gray-900">Add New Story</h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-5 space-y-5">
          {formContent}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">{footer}</div>
      </div>

      {closeConfirmationPortal}
      {showAudioRecorder && (
        <AudioRecorderPopup
          onClose={() => setShowAudioRecorder(false)}
          onAddFile={handleAddAudioFile}
          recordingNumber={audioRecordingCount}
        />
      )}
      {videoRecorderPortal}
    </>
  );
}
