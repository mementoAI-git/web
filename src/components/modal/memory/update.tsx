import { useRef, useState, useCallback, useEffect } from "react";
import { Sheet } from "react-modal-sheet";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import { FooterBtnGroup } from "@/components/memory";
import { LinkInput } from "@/components/memory/text-area/link-input";
import useFetcher from "@/hooks/use-fetcher";
import useFileUpload from "@/hooks/use-file-upload";
import { useModal } from "@/hooks/use-modal";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import { deleteFetcher } from "@/api/fetcher";
import { cn, resolvePath } from "@/utility";
import type { IFile, IOnUploadPayload } from "@/utility/interface";
import { SUPPORTED_FILE_TYPES } from "@/utility/constant";
import { FileThumbnails } from "./create/file-thumbnails";
import { AccessField, type SearchResultItem } from "./create/access-field";
import { TagsField } from "./create/tags-field";
import { HeadingIcon, LinkIcon, UnorderedListIcon } from "@/components/icons";
import addPlusSvg from "@/assets/icon/Add-plus.svg";
import smileySvg from "@/assets/icon/noto_slightly-smiling-face.svg";
import micSvg from "@/assets/icon/microphone-01.svg";
import videoRecorderSvg from "@/assets/icon/video-recorder.svg";

const ACTIVE_BG = "bg-[rgba(23,11,0,0.1)]";

interface ContentProps {
  data: any;
}

function toSearchItems(
  groups: { _id?: string; name: string }[] = [],
  beneficiaries: { _id?: string; name: string }[] = []
): SearchResultItem[] {
  const groupItems: SearchResultItem[] = (groups || [])
    .filter((g) => g._id)
    .map((g) => ({ id: g._id!, name: g.name, source: "group" as const }));
  const beneficiaryItems: SearchResultItem[] = (beneficiaries || [])
    .filter((b) => b._id)
    .map((b) => ({ id: b._id!, name: b.name, source: "beneficiary" as const }));
  return [...groupItems, ...beneficiaryItems];
}

function Content({ data }: ContentProps) {
  const memory = data.memory ?? data;
  const { push, close } = useModal();
  const fileInputMediaRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(memory.body || "");
  const [title, setTitle] = useState(memory?.title || "");
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<IFile[]>(memory?.attachments || []);
  const [selectedAccess, setSelectedAccess] = useState<SearchResultItem[]>(() =>
    toSearchItems(memory?.groups, memory?.beneficiaries)
  );
  const [tags, setTags] = useState<string[]>(memory?.tags || []);
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory._id}`, "put");
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();

  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [audioRecordingCount, setAudioRecordingCount] = useState(1);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      Placeholder.configure({ placeholder: "What's on your mind today?" }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-500 underline cursor-pointer" },
      }),
    ],
    content: memory.body || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none px-4 py-4 text-sm text-gray-800",
      },
    },
    onUpdate: ({ editor }) => {
      setText(editor.getHTML());
    },
  });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (plusMenuRef.current?.contains(target) || emojiPickerRef.current?.contains(target)) {
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

    const payload: any = {};

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
    });

    if (fileInputMediaRef.current) fileInputMediaRef.current.value = "";
    if (fileInputAllRef.current) fileInputAllRef.current.value = "";
  };

  const handleAddAudioFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpload({ id: uuidv4(), file, base64: reader.result as string, progress: 0 });
    };
    reader.readAsDataURL(file);
    setAudioRecordingCount((c) => c + 1);
  };

  const handleLinkClick = () => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setLinkPosition({ top: coords.top - 100, left: coords.left });
    setShowLinkInput(true);
  };

  const handleLinkSubmit = (linkText: string, url: string) => {
    if (!editor) return;
    if (!editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({ type: "text", marks: [{ type: "link", attrs: { href: url } }], text: linkText })
        .insertContent(" ")
        .focus()
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", marks: [{ type: "link", attrs: { href: url } }], text: linkText })
        .insertContent(" ")
        .focus()
        .run();
    }
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
        "size-9 flex items-center justify-center rounded-lg transition-colors hover:bg-[rgba(23,11,0,0.05)]",
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
  const hasChanges =
    title !== (memory?.title ?? "") ||
    text !== (memory.body ?? "") ||
    removedAttachmentIds.length > 0 ||
    files.some((f) => f.uploadedFile) ||
    accessChanged ||
    tagsChanged;
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
      <div className="space-y-6">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={2}
          className="w-full min-w-0 pr-14 sm:pr-16 bg-transparent border-none outline-none focus:ring-0 p-0 font-garamond text-[24px] text-gray-900 placeholder:text-gray-400 resize-none overflow-y-auto hide-scrollbar leading-tight block"
          placeholder="Enter title"
        />

        <div className="rounded-[16px] border border-gray-200 flex flex-col overflow-hidden">
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
          </div>

          <div className="editor-fill-500 relative flex min-h-[350px] h-[350px] shrink-0 flex-col overflow-hidden">
            <EditorContent editor={editor} className="tiptap-editor size-full min-h-0" />
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
            <div className="bg-[#F4F4F4] rounded-2xl flex items-center justify-start gap-3 px-[12px] py-[9px]">
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

              <div ref={emojiPickerRef} className="relative">
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

              <button
                type="button"
                onClick={() => push("audio-recorder", { onFinish: handleAddAudioFile, recordingNumber: audioRecordingCount })}
                className="size-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
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
                className="size-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
                title="Record video"
              >
                <img src={videoRecorderSvg} alt="Record video" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AccessField value={selectedAccess} onChange={setSelectedAccess} />

      <TagsField
        tags={tags}
        setTags={setTags}
        title={title}
        body={editor?.getText() ?? ""}
      />
      <FooterBtnGroup
        onDiscard={() => close("edit-memory")}
        onSave={handleContinueBtn}
        disabled={!hasChanges || hasUploadingFiles}
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
        snapPoints={[0.5, 0.75, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="bg-sand-1">
          <Sheet.Header className="rounded-3xl bg-sand-1" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto mb-2 !right-0 !top-0" onClick={() => close("edit-memory")} />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}
