import FocusTrap from "focus-trap-react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { classifyConversationFile, type ConversationPreviewFile } from "@/pages/dashboard/chat/conversation/conversation-assets";
import VideoPreview from "./video";
import AudioPreview from "./audio";
import ImagePreview from "./image";
import ActionBtn from "./action-btns";
import DocumentPreview from "./document";
import { getDocumentKind } from "./document-kind";

export interface FilePreviewItemBase extends ConversationPreviewFile {
  onDelete: (id: string) => void;
}

export interface FilePreviewItem extends FilePreviewItemBase { isActive?: boolean }

interface FilePreviewProps {
  data: { files: ConversationPreviewFile[]; startIndex?: number };
}

const clampIndex = (value: number, length: number) =>
  Math.max(0, Math.min(value, Math.max(0, length - 1)));

export default function FilePreview({ data }: FilePreviewProps) {
  const [files, setFiles] = useState<ConversationPreviewFile[]>(data.files);
  const [index, setIndex] = useState(() => clampIndex(data.startIndex ?? 0, data.files.length));
  const { close } = useModal();
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const target = returnFocusRef.current;
      if (target?.isConnected) requestAnimationFrame(() => target.focus());
    };
  }, []);

  useEffect(() => {
    setFiles(data.files);
    setIndex(clampIndex(data.startIndex ?? 0, data.files.length));
  }, [data.files, data.startIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!files[index] || event.defaultPrevented || getDocumentKind(files[index]) === "pdf") return;
      if (event.target instanceof HTMLElement && event.target.closest("[data-document-content], input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") setIndex((value) => clampIndex(value - 1, files.length));
      if (event.key === "ArrowRight") setIndex((value) => clampIndex(value + 1, files.length));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, index]);

  const active = files[index];
  const kind = useMemo(() => active ? classifyConversationFile(active) : "document", [active]);
  const handleDelete = (id: string) => {
    const remainingFiles = files.filter((file) => file._id !== id);
    if (!remainingFiles.length) {
      close?.("file-preview");
      return;
    }
    setFiles(remainingFiles);
    setIndex((value) => clampIndex(value, remainingFiles.length));
  };

  if (!active) return null;
  const sharedLabel = active.sharedAt && dayjs(active.sharedAt).isValid()
    ? `Shared ${dayjs(active.sharedAt).format("MMM D, YYYY [at] h:mm A")}`
    : null;

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: "[data-viewer-close]", escapeDeactivates: false, clickOutsideDeactivates: false }}>
      <section role="dialog" aria-modal="true" aria-label={`Preview ${active.name || "file"}`} className="fixed inset-0 z-50 overflow-hidden bg-overlay-media-backdrop" onClick={(event) => {
        event.stopPropagation();
        if (event.target instanceof Element && !event.target.closest("[data-viewer-content], button")) close?.("file-preview");
      }}>
        <header data-viewer-content className="absolute inset-x-0 top-0 z-20 flex min-h-[72px] items-center gap-4 border-b border-stroke-neutral-weak bg-bg-neutral-solid px-4 py-3 text-text-neutral-strong sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fill-brand-weak text-text-brand-strong" aria-hidden>
              {kind === "video" ? "▶" : kind === "audio" ? "♪" : kind === "document" ? <FileText className="size-4" /> : "▧"}
            </span>
            <span className="min-w-0">
              <strong className="block truncate font-geist text-sm font-semibold sm:text-base">{active.name || "File"}</strong>
              {sharedLabel ? <span className="block truncate font-inter text-xs text-text-neutral-weak">{sharedLabel}</span> : null}
            </span>
          </div>
          <ActionBtn {...active} onDelete={handleDelete} />
        </header>

        <div className={`absolute inset-x-0 bottom-0 top-[72px] flex items-center justify-center py-4 pb-16 sm:py-8 sm:pb-20 ${kind === "document" && files.length > 1 ? "px-16 sm:px-40" : "px-4 sm:px-8"}`}>
          <div data-viewer-content className="contents">
          {kind === "video" ? <VideoPreview {...active} onDelete={handleDelete} isActive />
            : kind === "audio" ? <AudioPreview {...active} onDelete={handleDelete} isActive />
              : kind === "image" ? <ImagePreview {...active} onDelete={handleDelete} />
                : <DocumentPreview key={`${active._id}:${active.url}`} {...active} onDelete={handleDelete} />}
          </div>
        </div>

        {files.length > 1 ? <>
          <button type="button" onClick={() => setIndex((value) => clampIndex(value - 1, files.length))} disabled={index === 0} aria-label="Previous file" className="overlay-control overlay-control-on-media absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-text-inverse-strong/12 text-text-inverse-strong backdrop-blur-sm disabled:opacity-25 sm:left-8 sm:size-[120px] sm:rounded-3xl">
            <ChevronLeft className="size-7 sm:size-14" aria-hidden />
          </button>
          <button type="button" onClick={() => setIndex((value) => clampIndex(value + 1, files.length))} disabled={index === files.length - 1} aria-label="Next file" className="overlay-control overlay-control-on-media absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-text-inverse-strong/12 text-text-inverse-strong backdrop-blur-sm disabled:opacity-25 sm:right-8 sm:size-[120px] sm:rounded-3xl">
            <ChevronRight className="size-7 sm:size-14" aria-hidden />
          </button>
          <div className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex justify-center gap-2" aria-label="File position">
            {files.map((file, dotIndex) => <button type="button" key={file._id || `${file.name}-${dotIndex}`} onClick={() => setIndex(dotIndex)} aria-label={`Show file ${dotIndex + 1}`} aria-current={index === dotIndex ? "true" : undefined} className={`overlay-control-position size-3 rounded-full border border-text-inverse-strong/70 ${index === dotIndex ? "bg-fill-brand-strong" : "bg-text-inverse-strong/40"}`} />)}
          </div>
        </> : null}
      </section>
    </FocusTrap>
  );
}
