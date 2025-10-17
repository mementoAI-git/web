import { useModal } from "@/hooks/use-modal"
import Image from "next/image"
import wave from "@/public/image/wave.png"
import { getDuration } from "@/utility"
import { IFile } from "@/utility/interface"

function AudioFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(file.duration || 0)
  return (
    <div className="h-50 flex flex-col justify-between rounded-lg bg-grey-400 overflow-hidden">
      <div className="flex flex-col font-inter p-3">
        <span className="font-medium whitespace-nowrap truncate text-sm text-[#050709]">{file.name}</span>
        <span className="text-grey-600 text-xs">
          {hrs !== "00" && `${hrs}:`}{mins}:{secs}
        </span>
      </div>
      <Image src={wave} alt="wave" />
    </div>
  )
}

function VideoFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(file.duration || 0)
  return (
    <div className="h-50 flex flex-col justify-between rounded-lg bg-grey-400 overflow-hidden">
      <div className="flex flex-col font-inter p-3">
        <span className="font-medium text-sm whitespace-nowrap truncate text-[#050709]">{file.name}</span>
        <span className="text-grey-600 text-xs">{hrs !== "00" && `${hrs}:`}{mins}:{secs}</span>
      </div>
      <Image src={wave} alt="wave" />
    </div>)
}

function FileGalleryItem({ file }: { file: IFile }) {
  if (file.type.includes("video")) {
    return <VideoFile file={file} />
  }
  else if (file.type.includes("audio")) {
    return <AudioFile file={file} />
  }
  return <img
    src={file.url}
    className="size-full rounded-sm object-cover"
    alt={file.name}
  />
}

export default function FileGallery({ files }: { files: IFile[] }) {
  const { open } = useModal()

  // Show max 6 files
  const maxFiles = 6
  const displayFiles = files.slice(0, maxFiles)
  const hasOverflow = files.length > maxFiles

  // Calculate grid layout based on file count
  const getGridLayout = (count: number) => {
    if (count <= 1) return "grid-cols-1"
    if (count <= 2) return "grid-cols-2"
    if (count <= 3) return "grid-cols-3"
    if (count <= 6) return "grid-cols-3 grid-rows-2"
    return "grid-cols-3 grid-rows-2"
  }

  const totalItems = displayFiles.length + (hasOverflow ? 1 : 0)
  const gridLayout = getGridLayout(totalItems)

  return (
    <div
      onClick={() => open("file-preview", files)}
      className={`grid gap-1 bg-sand-3 p-4 rounded-xl w-fit max-h-[266px] ${gridLayout}`}
    >
      {displayFiles.map((file, i) => (
        <div key={i} className="max-w-[239.3333282470703px] h-[115px]">
          <FileGalleryItem file={file} />
        </div>
      ))}
      {hasOverflow && (
        <div className="max-w-[239.3333282470703px] h-[115px]">
          <div className="relative overflow-hidden h-full">
            <div className="absolute flex items-center justify-center w-full h-full top-0 left-0 right-0 rounded-lg backdrop-blur-[1px] font-semibold font-bricolage text-2xl text-white bg-[rgba(94,94,94,0.5)]">
              {files.length - maxFiles}+
            </div>
            <FileGalleryItem file={files[maxFiles]} />
          </div>
        </div>
      )}
    </div>
  )
}