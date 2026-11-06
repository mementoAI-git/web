import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "react-modal-sheet";
import { EditorContent } from "@tiptap/react";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import { FooterBtnGroup } from "@/components/memory";
import { LinkInput } from "@/components/memory/text-area/link-input";
import { SlashCommandPopup } from "@/components/memory/text-area/slash-command-popup";
import { SLASH_COMMANDS } from "@/components/memory/text-area/slash-commands";
import useFetcher from "@/hooks/use-fetcher";
import useFileUpload from "@/hooks/use-file-upload";
import { useModal } from "@/hooks/use-modal";
import { AudioAttachmentRecorder } from "@/components/recorder/voice-recorder";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import { deleteFetcher } from "@/api/fetcher";
import { cn, resolvePath } from "@/utility";
import type { IFile, IMemory, IOnUploadPayload } from "@/utility/interface";
import { SUPPORTED_FILE_TYPES } from "@/utility/constant";
import { FileThumbnails } from "./create/file-thumbnails";
import {
  AccessField,
  type MemoryShareAudience,
  type SearchResultItem,
} from "./create/access-field";
import { TagsField } from "./create/tags-field";
import { HeadingIcon, LinkIcon, UnorderedListIcon } from "@/components/icons";
import { useMemoryEditor } from "@/components/memory/text-area/use-memory-editor";
import addPlusSvg from "@/assets/icon/Add-plus.svg";
import smileySvg from "@/assets/icon/noto_slightly-smiling-face.svg";
import micSvg from "@/assets/icon/microphone-01.svg";
import videoRecorderSvg from "@/assets/icon/video-recorder.svg";

const ACTIVE_BG = "bg-fill-neutral-strong";

interface UpdateMemoryData {
  memory?: IMemory;
}

type ContentData = UpdateMemoryData & Partial<IMemory>;

interface ContentProps {
  data: ContentData;
}

interface UpdateMemoryPayload {
  body?: string;
  title?: string;
  attachments?: string[];
  removeAttachments?: string[];
  groups?: string[];
  beneficiaries?: string[];
  tags?: string[];
  visibility?: MemoryShareAudience;
}

function toSearchItems(
  groups: { _id?: string; name: string; color?: number }[] = [],
  beneficiaries: { _id?: string; name: string }[] = []
): SearchResultItem[] {
  const groupItems: SearchResultItem[] = (groups || [])
    .filter((g) => g._id)
    .map((g) => ({ id: g._id!, name: g.name, source: "group" as const, color: g.color ?? 0 }));
  const beneficiaryItems: SearchResultItem[] = (beneficiaries || [])
    .filter((b) => b._id)
    .map((b) => ({ id: b._id!, name: b.name, source: "beneficiary" as const, color: 0 }));
  return [...groupItems, ...beneficiaryItems];
}

function memoryShareAudience(m: IMemory): MemoryShareAudience {
  return m.visibility === "everyone" ? "everyone" : "private";
}

function Content({ data }: ContentProps) {
  const memory = data.memory ?? data;
  const savedShareAudience = memoryShareAudience(memory);
  const { push, close } = useModal();
  const fileInputMediaRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const fileInputAudioRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(memory.body || "");
  const [title, setTitle] = useState(memory?.title || "");
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<IFile[]>(memory?.attachments || []);
  const [selectedAccess, setSelectedAccess] = useState<SearchResultItem[]>(() =>
    toSearchItems(memory?.groups, memory?.beneficiaries)
  );
  const [shareAudience, setShareAudience] = useState<MemoryShareAudience>(() => savedShareAudience);
  const [tags, setTags] = useState<string[]>(memory?.tags || []);
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory._id}`, "put");
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();

  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const plusMenuPortalRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerPortalRef = useRef<HTMLDivElement>(null);

  const {
    editor,
    showLinkInput,
    setShowLinkInput,
    linkPosition,
    showSlashMenu,
    slashPosition,
    slashSelectedIndex,
    setSlashSelectedIndex,
    openLinkInputAtSelection,
    submitLink,
    selectSlashCommand,
  } = useMemoryEditor({
    initialContent: memory.body || "",
    placeholder: "What's on your mind today? Type / for formatting options",
    editorClassName: "prose prose-sm focus:outline-none px-4 py-4 text-sm text-text-neutral-strong",
    linkClassName: "text-blue-500 underline cursor-pointer",
    onHtmlChange: setText,
  });

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

  const handleContinueBtn = async () => {
    if (isMutating) return;

    const payload: UpdateMemoryPayload = {};

    if (text !== memory.body) {
      payload.body = text;
    }

    if (title !== memory?.title) {
      payload.title = title;
    }

    const newAttachmentIds = files.filter(f => f.uploadedFile).map(f => f.uploadedFile._id);
    const remainingAttachmentIds = currentAttachments.map(a => a._id);
    const allAttachmentIds = [...remainingAttachmentIds, ...newAttachmentIds];
    if (allAttachmentIds.length > 0 || newAttachmentIds.length > 0 || removedAttachmentIds.length > 0) {
      payload.attachments = allAttachmentIds;
    }

    if (removedAttachmentIds.length > 0) {
      payload.removeAttachments = removedAttachmentIds;
    }

    const groupIds = selectedAccess.filter((a) => a.source === "group").map((a) => a.id);
    const beneficiaryIds = selectedAccess.filter((a) => a.source === "beneficiary").map((a) => a.id);
    const currentGroupIds = (memory?.groups || []).filter((g) => g._id).map((g) => g._id!);
    const currentBeneficiaryIds = (memory?.beneficiaries || []).filter((b) => b._id).map((b) => b._id!);
    const accessChanged =
      JSON.stringify([...groupIds].sort()) !== JSON.stringify([...currentGroupIds].sort()) ||
      JSON.stringify([...beneficiaryIds].sort()) !== JSON.stringify([...currentBeneficiaryIds].sort());
    if (accessChanged) {
      payload.groups = groupIds;
      payload.beneficiaries = beneficiaryIds;
    }

    const tagsChanged = JSON.stringify([...tags].sort()) !== JSON.stringify([...(memory?.tags || [])].sort());
    if (tagsChanged) {
      payload.tags = tags;
    }

    const visibilityChanged = shareAudience !== savedShareAudience;
    if (visibilityChanged) {
      payload.visibility = shareAudience;
    }

    if (Object.keys(payload).length > 0) {
      await trigger(payload);
      mutate(endpoint.memories);
    }

    close("edit-memory");
  };

  const handleRemoveAttachment = useCallback(async (attachmentId: string) => {
    const attachment = currentAttachments.find(a => a._id === attachmentId);

    if (attachment) {
      try {
        await deleteFetcher(resolvePath(endpoint.files, { id: attachment.name }), { arg: {} });
      } catch (error) {
        console.error("Failed to delete file from server", error);
      }

      setRemovedAttachmentIds(prev => [...prev, attachmentId]);
      setCurrentAttachments(prev => prev.filter(a => a._id !== attachmentId));
    }
  }, [currentAttachments]);

  const handleRemoveFile = useCallback(async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      if (fileToRemove.uploadedFile) {
        await handleDeleteFile(fileToRemove);
      } else {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }
    }
  }, [files, handleDeleteFile, setFiles]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    selectedFiles.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleUpload({
            id: uuidv4(),
            file,
            base64: reader.result as string,
            progress: 0,
          });
        };
        reader.readAsDataURL(file);
      } else {
        handleUpload({ id: uuidv4(), file, progress: 0 });
      }
    });

    event.target.value = "";
  };

  const handleAddAudioFile = (file: File, duration?: number) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0, ...(duration !== undefined && { duration }) });
    };
    reader.readAsDataURL(file);
  };

  const handleLinkClick = () => {
    openLinkInputAtSelection();
  };

  const handleLinkSubmit = (linkText: string, url: string) => {
    submitLink(linkText, url);
  };

  const handleSlashCommandSelect = (command: (typeof SLASH_COMMANDS)[0]) => {
    selectSlashCommand(command);
  };

  const attachmentsAsPayloads: IOnUploadPayload[] = currentAttachments.map((att) => ({
    id: att._id,
    uploadedFile: att,
    progress: 100,
    base64: att.url,
    file: null,
  }));

  const allDisplayFiles = [...attachmentsAsPayloads, ...files];

  const handleRemoveDisplayFile = useCallback((id: string) => {
    const isAttachment = currentAttachments.some(a => a._id === id);
    if (isAttachment) {
      handleRemoveAttachment(id);
    } else {
      handleRemoveFile(id);
    }
  }, [currentAttachments, handleRemoveAttachment, handleRemoveFile]);

  const { from, to } = editor?.state.selection || { from: 0, to: 0 };
  const selectedText = editor?.state.doc.textBetween(from, to, " ") || "";
  const previousUrl = editor?.getAttributes("link").href || "";

  const toolbarBtn = (isActive: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={cn(
        "size-9 flex items-center justify-center rounded-lg transition-colors hover:bg-fill-neutral-weak",
        isActive && ACTIVE_BG,
      )}
    >
      {children}
    </button>
  );

  const accessChanged =
    JSON.stringify(
      selectedAccess.map((a) => a.id).sort()
    ) !==
    JSON.stringify(
      [
        ...(memory?.groups || []).filter((g) => g._id).map((g) => g._id!),
        ...(memory?.beneficiaries || []).filter((b) => b._id).map((b) => b._id!),
      ].sort()
    );
  const tagsChanged =
    JSON.stringify([...tags].sort()) !== JSON.stringify([...(memory?.tags || [])].sort());
  const visibilityChanged = shareAudience !== savedShareAudience;
  const hasChanges =
    title !== (memory?.title ?? "") ||
    text !== (memory.body ?? "") ||
    removedAttachmentIds.length > 0 ||
    files.some((f) => f.uploadedFile) ||
    accessChanged ||
    tagsChanged ||
    visibilityChanged;
  const hasUploadingFiles = files.some((file) => !file.uploadedFile);

  return (
    <div className="space-y-4">
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
      <div className="space-y-6">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={2}
          className="w-full min-w-0 pr-14 sm:pr-16 bg-transparent border-none outline-none focus:ring-0 p-0 font-garamond text-[24px] text-text-neutral-strong placeholder:text-text-neutral-weaker resize-none overflow-y-auto hide-scrollbar leading-tight block"
          placeholder="Enter title"
        />

        <div className="rounded-[16px] border border-stroke-neutral-weaker flex flex-col overflow-hidden">
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

            <div className="w-px h-5 bg-stroke-neutral-weaker mx-1.5" />

            {toolbarBtn(!!editor?.isActive("link"), handleLinkClick, <LinkIcon width={16} height={11} />, "Link")}
            {toolbarBtn(
              !!editor?.isActive("bulletList"),
              () => editor?.chain().focus().toggleBulletList().run(),
              <UnorderedListIcon width={16} height={14} />,
              "List",
            )}
          </div>

          <div className="editor-fill-500 relative flex min-h-[350px] h-[350px] shrink-0 flex-col overflow-hidden">
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

          {allDisplayFiles.length > 0 && (
            <FileThumbnails files={allDisplayFiles} onRemove={handleRemoveDisplayFile} />
          )}

          <div className="mt-6 mx-4 mb-4" onClick={(e) => e.stopPropagation()}>
            {showAudioRecorder && (
              <AudioAttachmentRecorder
                onFinish={handleAddAudioFile}
                onClose={() => setShowAudioRecorder(false)}
              />
            )}
            <div className="bg-bg-neutral-weak rounded-2xl flex items-center justify-start gap-3 px-[12px] py-[9px]">
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
                      className="fixed z-[9999] bg-background rounded-xl shadow-lg border border-stroke-neutral-weaker py-1 min-w-[180px]"
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
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-neutral-weak hover:bg-fill-neutral-weaker text-left"
                      >
                        <span className="text-base">📷</span> Photos & Videos
                      </button>
                      <button
                        type="button"
                        onClick={() => { fileInputAudioRef.current?.click(); setShowPlusMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-neutral-weak hover:bg-fill-neutral-weaker text-left"
                      >
                        <span className="text-base">🎵</span> Audio
                      </button>
                      <button
                        type="button"
                        onClick={() => { fileInputAllRef.current?.click(); setShowPlusMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-neutral-weak hover:bg-fill-neutral-weaker text-left"
                      >
                        <span className="text-base">📎</span> Files
                      </button>
                    </div>,
                    document.body,
                  )}
              </div>

              <div ref={emojiPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setShowEmoji((p) => !p); setShowPlusMenu(false); }}
                  className="size-10 flex items-center justify-center rounded-xl hover:bg-fill-neutral-weaker transition-colors"
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
                        onEmojiSelect={(e: { native: string }) => {
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

              <div className="w-px h-6 bg-stroke-neutral-weak shrink-0" />

              <button
                type="button"
                disabled={showAudioRecorder}
                onClick={() => setShowAudioRecorder(true)}
                className="size-10 flex items-center justify-center rounded-xl hover:bg-fill-neutral-weaker transition-colors"
                title="Record audio"
              >
                <img src={micSvg} alt="Record audio" width={20} height={20} />
              </button>

              <button
                type="button"
                onClick={() => push("video-recorder", {
                  onFinish: (file: File) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
                    };
                    reader.readAsDataURL(file);
                  },
                })}
                className="size-10 flex items-center justify-center rounded-xl hover:bg-fill-neutral-weaker transition-colors"
                title="Record video"
              >
                <img src={videoRecorderSvg} alt="Record video" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>

        <AccessField
          value={selectedAccess}
          onChange={setSelectedAccess}
          shareAudience={shareAudience}
          onShareAudienceChange={setShareAudience}
        />

        <TagsField
          tags={tags}
          setTags={setTags}
          title={title}
          body={editor?.getText() ?? ""}
        />
      </div>
      <FooterBtnGroup
        onDiscard={() => close("edit-memory")}
        onSave={handleContinueBtn}
        disabled={!hasChanges || hasUploadingFiles || showAudioRecorder}
        saving={isMutating}
        cta="Save changes"
        discardLabel="Dismiss"
        discardDisabled={false}
      />
    </div>
  );
}

export function UpdateMemory({ data }: ContentProps) {
  const { close } = useModal();

  return (
    <div className="sm:shrink-0">
      <div className="modal-container hidden sm:block !min-w-[520px] !w-[520px] !max-w-[520px] shrink-0 !rounded-[24px] !p-5 !max-h-[75vh] hide-scrollbar">
        <ModalCloseBtn onClick={() => close("edit-memory")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close("edit-memory")}
        snapPoints={[0, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-bg-raised">
          <Sheet.Header className="rounded-3xl bg-bg-raised" />
          <Sheet.Content className="max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain bg-bg-raised px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto mb-2 !right-0 !top-0" onClick={() => close("edit-memory")} />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}
