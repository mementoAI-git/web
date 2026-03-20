"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useModal } from "@/hooks/use-modal";
import useForm from "@/hooks/use-form";
import useFileUpload from "@/hooks/use-file-upload";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { cn, isEmpty } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import { SUPPORTED_FILE_TYPES } from "@/utility/constant";
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
import { FileThumbnails } from "./file-thumbnails";

import addPlusSvg from "@/assets/icon/Add-plus.svg";
import smileySvg from "@/assets/icon/noto_slightly-smiling-face.svg";
import micSvg from "@/assets/icon/microphone-01.svg";
import videoRecorderSvg from "@/assets/icon/video-recorder.svg";

const ACTIVE_BG = "bg-[rgba(23,11,0,0.1)]";
const initial = { title: "", body: "", attachments: [] as string[] };

// ─── CreateMemory ─────────────────────────────────────────────────────────────

interface CreateMemoryProps {
  data: any;
  isMobile?: boolean;
}

export function CreateMemory({ data, isMobile = false }: CreateMemoryProps) {
  const { close, open, push } = useModal();
  const fileInputMediaRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const fileInputAudioRef = useRef<HTMLInputElement>(null);
  const videoRecorderRef = useRef<any>(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const plusMenuPortalRef = useRef<HTMLDivElement>(null);
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

  const { trigger, isMutating } = useSWRMutation(endpoint.memories, fileUploadFetcher);
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

      const result = await trigger(payload as Parameters<typeof trigger>[0]);
      if (result?.success) {
        mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories));
        open("share-post", { id: result.data?._id || result.data?.id });
        setValues(initial);
        setFiles([]);
        setTags([]);
        setSelectedAccess([]);
      }
    },
  });

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
          class: "text-blue-500 underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
    ],
    content: values.body || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[140px] px-4 py-4 text-sm text-gray-800",
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
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        plusMenuRef.current?.contains(target) ||
        plusMenuPortalRef.current?.contains(target) ||
        emojiPickerRef.current?.contains(target) ||
        emojiPickerPortalRef.current?.contains(target)
      ) {
        return;
      }
      setShowEmoji(false);
      setShowPlusMenu(false);
    };
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
        };
        reader.readAsDataURL(file);
      } else {
        handleUpload({ id: uuidv4(), file, progress: 0 });
      }
    });
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

  const toolbarBtn = (isActive: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
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
      <input
        ref={fileInputAudioRef}
        type="file"
        multiple
        accept="audio/*"
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
            !!editor?.isActive("heading", { level: 2 }),
            () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            <HeadingIcon width={11} height={14} />,
            "Heading",
          )}
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
            !!editor?.isActive("underline"),
            () => editor?.chain().focus().toggleUnderline().run(),
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

        {/* File thumbnails */}
        <FileThumbnails files={files} onRemove={handleRemoveFile} />

        {/* Icons bar */}
        <div className="mt-6 mx-4 mb-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#F4F4F4] rounded-2xl flex items-center justify-start gap-3 px-[12px] py-[9px]">
            {/* Plus menu */}
            <div ref={plusMenuRef} className="relative h-[40px]">
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
              {showPlusMenu &&
                createPortal(
                  <div
                    ref={plusMenuPortalRef}
                    className="fixed z-[9999] bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[180px]"
                    style={(() => {
                      const rect = plusMenuRef.current?.getBoundingClientRect();
                      return rect
                        ? {
                            left: rect.left,
                            bottom: window.innerHeight - rect.top + 12,
                          }
                        : { left: 0, bottom: 0 };
                    })()}
                  >
                    <button
                      type="button"
                      onClick={() => { fileInputMediaRef.current?.click(); setShowPlusMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <span className="text-base">📷</span> Photos & Videos
                    </button>
                    <button
                      type="button"
                      onClick={() => { fileInputAudioRef.current?.click(); setShowPlusMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <span className="text-base">🎵</span> Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => { fileInputAllRef.current?.click(); setShowPlusMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <span className="text-base">📎</span> Files
                    </button>
                  </div>,
                  document.body,
                )}
            </div>

            {/* Emoji */}
            <div ref={emojiPickerRef} className="relative">
              <button
                type="button"
                onClick={() => { setShowEmoji((p) => !p); setShowPlusMenu(false); }}
                className="size-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
              >
                <img src={smileySvg} alt="Emoji" width={20} height={20} />
              </button>
              {showEmoji &&
                createPortal(
                  <div
                    ref={emojiPickerPortalRef}
                    className="fixed z-[9999] shadow-xl"
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
                    <Picker
                      data={emojiData}
                      onEmojiSelect={(e: any) => {
                        editor?.chain().focus().insertContent(e.native).run();
                        setShowEmoji(false);
                      }}
                      theme="light"
                      previewPosition="none"
                    />
                  </div>,
                  document.body,
                )}
            </div>

            <div className="w-px h-6 bg-gray-300 shrink-0" />

            {/* Record audio */}
            <button
              type="button"
              onClick={() => push("audio-recorder", { onFinish: handleAddAudioFile, recordingNumber: audioRecordingCount })}
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
        className="h-11 rounded-full bg-v3-brand-strong px-6 font-inter font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
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
              onStart={() => { }}
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
        {videoRecorderPortal}
      </>
    );
  }

  // Desktop
  return (
    <>
      <div
        className="absolute top-0 right-0 bottom-0 w-full max-w-[520px] bg-white flex flex-col shadow-2xl rounded-[24px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="font-garamond text-2xl font-medium text-gray-900">Add New Story</h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pt-5 pb-16 space-y-5">
          {formContent}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">{footer}</div>
      </div>

      {closeConfirmationPortal}
      {videoRecorderPortal}
    </>
  );
}
