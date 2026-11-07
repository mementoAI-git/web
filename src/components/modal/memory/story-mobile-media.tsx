import { FileText, Play } from "lucide-react";
import VideoThumbnail from "@/components/video-thumbnail";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { useModal } from "@/hooks/use-modal";
import { classifyConversationFile } from "@/pages/dashboard/chat/conversation/conversation-assets";
import { cn } from "@/utility";
import { displayFileName } from "@/utility/file-label";
import type { IFile } from "@/utility/interface";

const MAX_MOSAIC_IMAGES = 5;
const FALLBACK_BARS = [8, 16, 24, 20, 12, 22, 14, 24, 18, 8, 16, 24];

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function voiceBars(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Array.from({ length: 16 }, (_, i) =>
    Math.min(28, 4 + Math.round((Math.sin((Math.abs(hash) + i * 997) * 0.013) * 0.5 + 0.5) * 20)),
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

function AudioCard({
  file,
  title,
  onOpen,
}: {
  file: IFile;
  title?: string;
  onOpen: () => void;
}) {
  const duration = Number(file.duration ?? 0);
  const name = title?.trim() || displayFileName(file.name) || "Audio";
  const isVoice = /^voice[_-]/i.test(file.name ?? "");
  const artwork = file.thumbnail;

  if (artwork) {
    return (
      <button
        type="button"
        aria-label={`Play ${name}`}
        onClick={onOpen}
        className="relative block h-[120px] w-full overflow-hidden rounded-2xl"
      >
        <img src={artwork} alt="" className="size-full object-cover" />
        <span className="story-media-scrim absolute inset-x-0 bottom-0 flex items-center gap-2 px-3.5 py-2.5 text-left font-inter text-[11px] leading-4">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {duration > 0 ? <span className="story-media-weak">{formatDuration(duration)}</span> : null}
        </span>
      </button>
    );
  }

  const bars = isVoice ? voiceBars(file._id || file.name || "") : FALLBACK_BARS;
  return (
    <button
      type="button"
      aria-label={`Play ${name}`}
      onClick={onOpen}
      className={cn(
        "flex aspect-square w-[calc(50%-4px)] max-w-[340px] flex-col items-center justify-center gap-3 rounded-[20px] p-4",
        isVoice ? "story-media-surface" : "bg-fill-neutral-weak text-text-neutral-strong",
      )}
    >
      <span className="flex h-8 items-end gap-0.5" aria-hidden>
        {bars.map((height, index) => (
          <span
            key={index}
            className="w-[3px] rounded-[2px] bg-fill-brand-strong"
            style={{ height, opacity: isVoice ? 0.8 : 1 }}
          />
        ))}
      </span>
      <span className="line-clamp-2 text-center font-inter text-[11px] leading-4">{name}</span>
      {duration > 0 ? (
        <span
          className={cn(
            "rounded-full px-2.5 py-[3px] font-inter text-[11px] leading-4",
            isVoice ? "story-media-pill story-media-weak" : "bg-fill-neutral-weaker text-text-neutral-weak",
          )}
        >
          {formatDuration(duration)}
        </span>
      ) : null}
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
              <AudioCard key={file._id || index} file={file} title={title} onOpen={() => open(file)} />
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
