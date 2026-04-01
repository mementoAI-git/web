import wave from "@/assets/image/wave.png";
import { useModal } from "@/hooks/use-modal";
import { getDuration } from "@/utility";
import type { IFile } from "@/utility/interface";

function AudioFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(file.duration || 0);
  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-lg bg-grey-400">
      <div className="flex flex-col p-3 font-inter">
        <span className="text-sm font-medium text-text-neutral-strong text-ellipsis whitespace-nowrap overflow-hidden">
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
        <span className="truncate text-sm font-medium text-text-neutral-strong text-ellipsis whitespace-nowrap overflow-hidden">
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
  const type = file.type ?? "";
  if (type.includes("video")) {
    return <VideoFile file={file} />;
  }
  if (type.includes("audio")) {
    return <AudioFile file={file} />;
  }
  return (
    <img
      src={file.url}
      className="w-full h-full rounded-sm object-cover"
      alt={file.name}
      loading="lazy"
    />
  );
}

export default function FileGallery({ files }: { files: IFile[] }) {
  const { push } = useModal();

  const maxFiles = 6;
  const displayFiles = files.slice(0, maxFiles);
  const hasOverflow = files.length > maxFiles;
  const overflowFile = hasOverflow ? files[maxFiles] : undefined;

  const handleGalleryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const fileElement = target.closest("[data-file-index]") as HTMLElement;

    if (fileElement) {
      const clickedIndex = parseInt(fileElement.dataset.fileIndex || "0", 10);
      push?.("file-preview", { files, startIndex: clickedIndex });
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
