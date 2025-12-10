import wave from "@/assets/image/wave.png";
import { useModal } from "@/hooks/use-modal";
import { getDuration } from "@/utility";
import type { IFile } from "@/utility/interface";

function AudioFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(file.duration || 0);
  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-lg bg-grey-400">
      <div className="flex flex-col p-3 font-inter">
        <span className="text-sm font-medium text-[#050709] text-ellipsis whitespace-nowrap overflow-hidden">
          {file.name}
        </span>
        <span className="text-xs text-grey-600">
          {hrs !== "00" && `${hrs}:`}
          {mins}:{secs}
        </span>
      </div>
      <img src={wave} alt="wave" />
    </div>
  );
}

function VideoFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(file.duration || 0);
  return (
    <div className="flex w-full h-full flex-col justify-between overflow-hidden rounded-lg bg-grey-400">
      <div className="flex flex-col p-3 font-inter">
        <span className="truncate text-sm font-medium text-[#050709] text-ellipsis whitespace-nowrap overflow-hidden">
          {file.name}
        </span>
        <span className="text-xs text-grey-600">
          {hrs !== "00" && `${hrs}:`}
          {mins}:{secs}
        </span>
      </div>
      <img src={wave} alt="wave" />
    </div>
  );
}

function FileGalleryItem({ file }: { file: IFile }) {
  if (file.type.includes("video")) {
    return <VideoFile file={file} />;
  }
  if (file.type.includes("audio")) {
    return <AudioFile file={file} />;
  }
  return (
    <img
      src={file.url}
      className="size-full! rounded-sm object-cover h-full"
      alt={file.name}
      loading="lazy"
    />
  );
}

export default function FileGallery({ files }: { files: IFile[] }) {
  const { open } = useModal();

  const maxFiles = 6;
  const displayFiles = files.slice(0, maxFiles);
  const hasOverflow = files.length > maxFiles;

  const getGridLayout = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-2";
    if (count <= 3) return "grid-cols-3";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    return "grid-cols-3 grid-rows-2";
  };

  const totalItems = displayFiles.length + (hasOverflow ? 1 : 0);
  const gridLayout = getGridLayout(totalItems);
  const overflowFile = hasOverflow ? files[maxFiles] : undefined;

  const handleGalleryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const fileElement = target.closest("[data-file-index]") as HTMLElement;

    if (fileElement) {
      const clickedIndex = parseInt(fileElement.dataset.fileIndex || "0", 10);
      open?.("file-preview", { files, startIndex: clickedIndex });
    }
  };

  return (
    <div
      onClick={handleGalleryClick}
      className={`grid max-h[266px] w-fit gap-1 rounded-xl bg-sand-3 p-4 ${gridLayout}!`}
    >
      {displayFiles.map((file, index) => (
        <div key={index} data-file-index={index} className="cursor-pointer">
          <FileGalleryItem file={file} />
        </div>
      ))}
      {overflowFile && (
        <div className="h-[115px] max-w[239.3333282470703px]">
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-0 flex h-full w-full items-center justify-center rounded-lg bg-[rgba(94,94,94,0.5)] backdrop-blur-sm font-bricolage text-2xl font-semibold text-white">
              {files.length - maxFiles}+
            </div>
            <FileGalleryItem file={overflowFile} />
          </div>
        </div>
      )}
    </div>
  );
}
