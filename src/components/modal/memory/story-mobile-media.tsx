import { FileText, Play } from "lucide-react";
import VideoThumbnail from "@/components/video-thumbnail";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { useModal } from "@/hooks/use-modal";
import { classifyConversationFile } from "@/pages/dashboard/chat/conversation/conversation-assets";
import { cn } from "@/utility";
import { displayFileName } from "@/utility/file-label";
import type { IFile } from "@/utility/interface";

const MAX_MOSAIC_IMAGES = 5;

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

const ROW_BAR_COUNT = 36;

/** A steady waveform per file, so a recording always draws the same. */
function rowBars(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Array.from({ length: ROW_BAR_COUNT }, (_, i) =>
    8 + Math.round((Math.sin((Math.abs(hash) + i * 997) * 0.013) * 0.5 + 0.5) * 22),
  );
}

function MosaicTile({
  file,
  wide,
  square,
  moreCount,
  onOpen,
}: {
  file: IFile;
  wide?: boolean;
  square?: boolean;
  moreCount?: number;
  onOpen: () => void;
}) {
  const { src, onError } = useSignedMediaAccess(file);
  return (
    <button
      type="button"
      aria-label={`Open ${file.name || "photo"}`}
      onClick={onOpen}
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[14px] bg-fill-neutral-weak",
        wide ? "flex-[1.7]" : "flex-1",
        square && "aspect-square",
      )}
    >
      <img src={src} onError={onError} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      {moreCount ? (
        <span className="story-media-scrim absolute inset-0 flex items-center justify-center font-inter text-xl font-semibold">
          +{moreCount} more
        </span>
      ) : null}
    </button>
  );
}

/**
 * The story page's audio row, as on mobile: title, a small play button, a
 * waveform and the length. Clicking anywhere opens the audio player.
 */
function AudioRow({
  file,
  title,
  onOpen,
}: {
  file: IFile;
  title?: string;
  onOpen: () => void;
}) {
  const duration = Number(file.duration ?? 0);
  const storyTitle = title?.trim() && title !== "Untitled Memory" ? title.trim() : null;
  const name = storyTitle || displayFileName(file.name) || "Audio";
  const length = duration > 0 ? formatDuration(duration) : null;
  const bars = rowBars(file._id || file.name || "");
  return (
    <button
      type="button"
      aria-label={`Play ${name}${length ? `, ${length}` : ""}`}
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-col gap-3 rounded-[20px] bg-fill-neutral-weak p-4 text-left transition-[filter] duration-150 hover:brightness-[0.97] motion-reduce:transition-none"
    >
      <span className="truncate font-inter text-sm font-semibold leading-5 text-text-neutral-strong">{name}</span>
      <span className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-tab-active text-text-tab-active">
          <Play aria-hidden fill="currentColor" stroke="none" className="size-3.5 translate-x-px" />
        </span>
        <span aria-hidden className="flex h-[30px] min-w-0 flex-1 items-center justify-between">
          {bars.map((height, index) => (
            <span key={index} className="w-[2.5px] rounded-full bg-fill-brand-strong" style={{ height }} />
          ))}
        </span>
        {length ? (
          <span className="shrink-0 font-inter text-[13px] tabular-nums text-text-neutral-weak">{length}</span>
        ) : null}
      </span>
    </button>
  );
}

function DocumentCard({ file, onOpen }: { file: IFile; onOpen: () => void }) {
  const type = file.type?.split("/")[1]?.toUpperCase() ?? "FILE";
  const size = Number(file.size) > 0 ? `${(Number(file.size) / 1024 / 1024).toFixed(1)} MB` : null;
  return (
    <button
      type="button"
      aria-label={`Open ${file.name || "document"}`}
      onClick={onOpen}
      className="flex aspect-square w-[calc(50%-4px)] max-w-[340px] flex-col items-center justify-center gap-2.5 rounded-[20px] bg-fill-neutral-weak p-4"
    >
      <span className="flex size-12 items-center justify-center rounded-[14px] border border-stroke-neutral-weaker bg-bg-neutral-solid text-text-brand-strong">
        <FileText className="size-6" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="line-clamp-2 text-center font-inter text-[11px] leading-4 text-text-neutral-strong">
        {file.name || "Document"}
      </span>
      <span className="flex items-center gap-1 font-inter text-[10px] font-bold leading-[14px]">
        <span className="rounded-full bg-fill-brand-weak px-2 py-0.5 text-text-brand-strong">{type}</span>
        {size ? <span className="text-text-neutral-weaker">{size}</span> : null}
      </span>
    </button>
  );
}

/** The mobile app's attachments: media sits above the story text, documents below it. */
export function StoryMobileMedia({
  section,
  files = [],
  title,
  readOnly,
}: {
  section: "media" | "documents";
  files?: IFile[];
  title?: string;
  readOnly?: boolean;
}) {
  const { push } = useModal();
  const byKind = (kind: string) =>
    files.filter((file) => classifyConversationFile(file) === kind);
  const images = byKind("image");
  const videos = byKind("video");
  const audio = byKind("audio");
  const documents = byKind("document");
  const ordered = [...images, ...videos, ...audio, ...documents];
  const open = (file: IFile) =>
    push?.("file-preview", { files: ordered, startIndex: ordered.indexOf(file), readOnly });

  const shown = images.slice(0, MAX_MOSAIC_IMAGES);
  const extra = images.length - shown.length;

  if (section === "media") {
    return (
      <>
        {images.length ? (
          <div className="mb-2 flex flex-col gap-1.5 px-4">
            <div className="flex h-[200px] gap-1.5">
              {shown.slice(0, 2).map((file, index) => (
                <MosaicTile key={file._id || index} file={file} wide={index === 0} onOpen={() => open(file)} />
              ))}
            </div>
            {shown.length > 2 ? (
              <div className="flex gap-1.5">
                {shown.slice(2).map((file, index) => (
                  <MosaicTile
                    key={file._id || index}
                    file={file}
                    square
                    moreCount={index === 2 && extra > 0 ? extra : undefined}
                    onOpen={() => open(file)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {videos.length ? (
          <div className="mb-2 flex flex-col gap-2 px-4">
            {videos.map((file, index) => (
              <button
                key={file._id || index}
                type="button"
                aria-label={`Play ${file.name || "video"}`}
                onClick={() => open(file)}
                className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-fill-neutral-weak"
              >
                <VideoThumbnail file={file} />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="story-media-scrim rounded-full p-3">
                    <Play className="size-5" aria-hidden />
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {audio.length ? (
          <div className="mb-2 flex flex-col gap-2 px-4">
            {audio.map((file, index) => (
              <AudioRow key={file._id || index} file={file} title={title} onOpen={() => open(file)} />
            ))}
          </div>
        ) : null}
      </>
    );
  }

  if (!documents.length) return null;
  return (
    <div className="flex flex-col gap-2 px-4 pt-5">
      <p className="mb-1 font-inter text-[10px] font-bold uppercase leading-[14px] tracking-[1.2px] text-text-neutral-weaker">
        Documents
      </p>
      <div className="flex flex-wrap gap-2">
        {documents.map((file, index) => (
          <DocumentCard key={file._id || index} file={file} onOpen={() => open(file)} />
        ))}
      </div>
    </div>
  );
}
