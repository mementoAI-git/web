import { useModal } from "@/hooks/use-modal"
import Image from "next/image"
import wave from "@/public/image/wave.png"
import { getDuration, isEmpty } from "@/utility"
import { IFile } from "@/utility/interface"

const sizes = [
  "w-[40%]",
  "w-[30%]",
  "grow",
  "w-1/4",
  "w-[30%]"
]

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
    className="h-50 rounded-sm object-cover"
    alt={file.name}
  />
}

export default function FileGallery({ files }: { files: IFile[] }) {
  const { open } = useModal()
  return (
    <div
      onClick={() => open("file-preview", files)}
      className="flex space-y-[2%] flex-row flex-wrap gap-[2%]"
    >
      {
        files.slice(0, 5).map((file, i) => (
          <div key={i} className={sizes[i]}>
            <FileGalleryItem file={file} />
          </div>
        ))
      }
      {
        files.length > 5 &&
        <div className="h-50 w-[40%]">
          <div className="relative overflow-hidden">
            <div className="absolute flex items-center justify-center w-full h-full top-0 left-0 right-0 rounded-lg backdrop-blur-[1px] font-semibold font-bricolage text-5xl text-white bg-[rgba(94,94,94,0.5)]">
              {files.length - 5}+
            </div>
            <FileGalleryItem file={files[5]} />
          </div>
        </div>
      }
    </div>
  )
}