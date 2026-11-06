import { useModal } from "@/hooks/use-modal";
import { getDuration } from "@/utility";
import { displayFileName } from "@/utility/file-label";
import { SavedVoiceNoteTile } from "@/components/recorder/voice-note-tile";
import type { IFile } from "@/utility/interface";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { Play } from "lucide-react";
import { classifyConversationFile } from "@/pages/dashboard/chat/conversation/conversation-assets";
import DocumentThumbnail from "./document-thumbnail";
import VideoThumbnail from "./video-thumbnail";

function VideoFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(file.duration || 0);
  return (
    <div className="relative size-full overflow-hidden rounded-lg bg-fill-neutral-weaker">
      <VideoThumbnail file={file} />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-overlay-media-backdrop p-2 text-text-inverse-strong">
          <Play className="size-4" aria-hidden />
        </span>
      </span>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-overlay-media-backdrop px-2 py-1 font-inter text-text-inverse-strong">
        <span className="block truncate text-[9px]" title={file.name}>
          {file.name}
        </span>
        <span className="block text-[9px]">
          {hrs !== "00" && `${hrs}:`}
          {mins}:{secs}
        </span>
      </div>
    </div>
  );
}

function FileGalleryItem({ file, nested = false }: { file: IFile; nested?: boolean }) {
  const kind = classifyConversationFile(file);
  if (kind === "video") {
    return <VideoFile file={file} />;
  }
  if (kind === "audio") {
    return (
      <SavedVoiceNoteTile
        file={file}
        label={displayFileName(file.name) || "Voice note"}
        compact
        // A stacked card is already a button that opens the viewer.
        interactive={!nested}
        className="size-full rounded-lg border-0"
      />
    );
  }
  if (kind === "document") return <DocumentThumbnail file={file} />;
  return <ImageFile file={file} />;
}

function ImageFile({ file }: { file: IFile }) {
  const { src, onError } = useSignedMediaAccess(file);
  return (
    <img
      src={src}
      onError={onError}
      className="w-full h-full rounded-sm object-cover"
      alt={file.name}
      loading="lazy"
    />
  );
}

export default function FileGallery({
  files,
  variant = "grid",
  readOnly,
}: {
  files: IFile[];
  variant?: "grid" | "stacked";
  /** Readers of a shared story can view and download, but not change, attachments. */
  readOnly?: boolean;
}) {
  const { push } = useModal();

  if (variant === "stacked") {
    const positions = [
      "left-0 top-10 z-30 rotate-[10deg]",
      "left-[60px] top-[54px] z-20 -rotate-[3deg]",
      "left-[98px] top-4 z-10 -rotate-[10deg]",
    ];
    return (
      <div
        className="relative h-[200px] w-[250px]"
        aria-label="Story attachment previews"
      >
        {files.slice(0, 3).map((file, index) => (
          <button
            key={file._id || index}
            type="button"
            aria-label={`Open attachment ${index + 1}: ${displayFileName(file.name)}`}
            className={`absolute h-[116px] w-[148px] rounded-[20px] border border-stroke-neutral-weak bg-bg-neutral-solid p-[3px] shadow-sm outline-none focus-visible:z-40 focus-visible:ring-2 focus-visible:ring-stroke-brand-strong ${positions[index]}`}
            onClick={() => push?.("file-preview", { files, startIndex: index, readOnly })}
          >
            <div className="size-full overflow-hidden rounded-2xl">
              <FileGalleryItem file={file} nested />
            </div>
          </button>
        ))}
      </div>
    );
  }

  const maxFiles = 6;
  const displayFiles = files.slice(0, maxFiles);
  const hasOverflow = files.length > maxFiles;
  const overflowFile = hasOverflow ? files[maxFiles] : undefined;

  const handleGalleryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const fileElement = target.closest("[data-file-index]") as HTMLElement;

    if (fileElement) {
      const clickedIndex = parseInt(fileElement.dataset.fileIndex || "0", 10);
      push?.("file-preview", { files, startIndex: clickedIndex, readOnly });
    }
  };

  return (
    <div
      onClick={handleGalleryClick}
      className="flex flex-wrap gap-2 rounded-xl"
    >
      {displayFiles.map((file, index) => (
        <div
          key={index}
          data-file-index={index}
          className="cursor-pointer w-[100px] h-[100px] overflow-hidden rounded-lg"
        >
          <FileGalleryItem file={file} />
        </div>
      ))}
      {overflowFile && (
        <div
          data-file-index={maxFiles}
          className="cursor-pointer w-[100px] h-[100px] overflow-hidden rounded-lg relative"
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-overlay-backdrop backdrop-blur-sm font-inter text-2xl font-semibold text-white z-10">
            {files.length - maxFiles}+
          </div>
          <FileGalleryItem file={overflowFile} />
        </div>
      )}
    </div>
  );
}
