import { displayFileName, isVoiceConversationName, recordedAtFromName, voiceNoteLabel } from "@/utility/file-label";
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
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardOverlayFrame } from "@/pages/dashboard/component/dashboard-overlay-frame";
import { DashboardHeader } from "@/pages/dashboard/component/dashboard-header";
import { overlayTitleClass } from "@/pages/dashboard/component/overlay-title";
import { isSkyCardPage } from "@/pages/dashboard/component/sky-card-page";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";

export interface FilePreviewItemBase extends ConversationPreviewFile {
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export interface FilePreviewItem extends FilePreviewItemBase { isActive?: boolean }

interface FilePreviewProps {
  /**
   * `title`: the story's title, shown as the heading of a recording's page.
   * `storyId`: seeds the recording's identicon, so it matches the story's thumbnail.
   */
  data: { files: ConversationPreviewFile[]; startIndex?: number; readOnly?: boolean; title?: string; storyId?: string };
}

/** When a recording was made: from its name, else when it was saved or shared. */
function recordedAt(file: ConversationPreviewFile): Date | null {
  const fromName = recordedAtFromName(file.name);
  const raw = fromName ?? (file as { created_at?: string }).created_at ?? file.sharedAt;
  if (raw === undefined || raw === null) return null;
  const date = dayjs(raw);
  return date.isValid() ? date.toDate() : null;
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

  // Recordings open as a full page, like My plan: the player beside its transcript.
  if (kind === "audio") {
    return (
      <RecordingPage
        active={active}
        files={files}
        index={index}
        setIndex={setIndex}
        onDelete={handleDelete}
        readOnly={data.readOnly}
        storyTitle={data.title}
        identicon={getQuestionIdenticonUrl(data.storyId || active._id || active.name)}
        sharedLabel={sharedLabel}
      />
    );
  }

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: "[data-viewer-close]", escapeDeactivates: false, clickOutsideDeactivates: false }}>
      <section role="dialog" aria-modal="true" aria-label={`Preview ${displayFileName(active.name) || "file"}`} className="fixed inset-0 z-50 overflow-hidden bg-overlay-media-backdrop" onClick={(event) => {
        event.stopPropagation();
        if (event.target instanceof Element && !event.target.closest("[data-viewer-content], button")) close?.("file-preview");
      }}>
        <header data-viewer-content className="absolute inset-x-0 top-0 z-20 flex min-h-[72px] items-center gap-4 border-b border-stroke-neutral-weak bg-bg-neutral-solid px-4 py-3 text-text-neutral-strong sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fill-brand-weak text-text-brand-strong" aria-hidden>
              {kind === "video" ? "▶" : kind === "document" ? <FileText className="size-4" /> : "▧"}
            </span>
            <span className="min-w-0">
              <strong className="block truncate font-geist text-sm font-semibold sm:text-base">{displayFileName(active.name) || "File"}</strong>
              {sharedLabel ? <span className="block truncate font-inter text-xs text-text-neutral-weak">{sharedLabel}</span> : null}
            </span>
          </div>
          <ActionBtn {...active} onDelete={handleDelete} readOnly={data.readOnly} />
        </header>

        <div className={`absolute inset-x-0 bottom-0 top-[72px] flex items-center justify-center py-4 pb-16 sm:py-8 sm:pb-20 ${kind === "document" && files.length > 1 ? "px-16 sm:px-40" : "px-4 sm:px-8"}`}>
          <div data-viewer-content className="contents">
          {kind === "video" ? <VideoPreview {...active} onDelete={handleDelete} isActive />
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

/** A recording as a full page, like My plan: the player beside its transcript. */
function RecordingPage({
  active,
  files,
  index,
  setIndex,
  onDelete: handleDelete,
  readOnly,
  storyTitle: rawTitle,
  sharedLabel,
  identicon,
}: {
  active: ConversationPreviewFile;
  files: ConversationPreviewFile[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  storyTitle?: string;
  sharedLabel: string | null;
  identicon: string;
}) {
  const { close, open: openModal } = useModal();
  const { pathname } = useLocation();
  const closePage = () => close?.("file-preview");
  const conversation = isVoiceConversationName(active.name);
  const voice = Boolean(voiceNoteLabel(active.name));
  const storyTitle = rawTitle?.trim() && rawTitle.trim() !== "Untitled Memory" ? rawTitle.trim() : null;
  const heading = storyTitle || (voice ? (conversation ? "Voice conversation" : "Voice note") : displayFileName(active.name) || "Audio");
  const at = recordedAt(active);
  const meta = [
    at ? dayjs(at).format(dayjs(at).year() === dayjs().year() ? "MMM D [at] h:mm A" : "MMM D, YYYY [at] h:mm A") : null,
    sharedLabel && !at ? sharedLabel : null,
  ].filter(Boolean).join(" · ");
  return (
    <Dialog open onOpenChange={(value) => { if (!value) closePage(); }}>
      <DialogContent
        data-sky-card-page={isSkyCardPage(pathname) ? "" : undefined}
        showCloseButton={false}
        className="insights-overlay"
        overlayClassName="insights-overlay-backdrop z-[100]"
      >
        <TooltipProvider>
          <DashboardOverlayFrame>
            <DashboardHeader
              overlay={{
                title: (
                  <p className={overlayTitleClass}>
                    {voice ? <>Voice <em>{conversation ? "conversation" : "note"}</em></> : <>Audio</>}
                  </p>
                ),
                searchLabel: "Search memories",
                closeLabel: "Close",
                onSearch: () => {
                  // Search opens beneath this page, so leave it first.
                  closePage();
                  openModal?.("search-memory");
                },
                onClose: closePage,
              }}
            />
            <div className="insights-scroll">
              <main className="page-motion mx-auto flex w-[min(100%-32px,960px)] flex-col pb-16 pt-5 sm:w-[min(100%-64px,960px)] sm:pt-9">
                <AudioPreview
                  {...active}
                  onDelete={handleDelete}
                  isActive
                  identicon={identicon}
                  heading={
                    <div className="page-rise page-rise--heading flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <DialogTitle className="font-garamond text-2xl font-normal leading-tight text-text-neutral-strong">
                          {heading}
                        </DialogTitle>
                        <DialogDescription className={meta ? "font-inter text-sm text-text-neutral-weaker" : "sr-only"}>
                          {meta || "Recording"}
                        </DialogDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <ActionBtn {...active} onDelete={handleDelete} readOnly={readOnly} variant="page" />
                        {files.length > 1 ? (
                          <div className="ml-auto flex gap-2">
                            <button type="button" onClick={() => setIndex((value) => clampIndex(value - 1, files.length))} disabled={index === 0} aria-label="Previous file" className="flex size-11 items-center justify-center rounded-full border border-stroke-neutral-weak text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak disabled:opacity-40">
                              <ChevronLeft className="size-5" aria-hidden />
                            </button>
                            <button type="button" onClick={() => setIndex((value) => clampIndex(value + 1, files.length))} disabled={index === files.length - 1} aria-label="Next file" className="flex size-11 items-center justify-center rounded-full border border-stroke-neutral-weak text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak disabled:opacity-40">
                              <ChevronRight className="size-5" aria-hidden />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  }
                />
              </main>
            </div>
          </DashboardOverlayFrame>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
