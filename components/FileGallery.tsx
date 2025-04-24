import { useModal } from "@/hooks/use-modal"
import Image from "next/image"
import wave from "@/public/image/wave.png"
import { getDuration } from "@/utility"
import { IFile } from "@/utility/interface"


const sizes = [
  "w-[40%]",
  "w-[30%]",
  "grow",
  "w-1/4",
  "w-[40%]",
  "grow",
  "w-[40%]",
  "w-[30%]",
  "grow",
]

function AudioFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(new Audio(file.url).duration || 0)
  return (
    <div className="h-50 w-full flex flex-col justify-between grow rounded-lg bg-grey-400 overflow-hidden">
      <div className="flex flex-col font-inter p-3">
        <span className="font-medium whitespace-nowrap truncate text-sm text-[#050709]">{file.name}</span>
        <span className="text-grey-600 text-xs">{hrs}:{mins}:{secs}</span>
      </div>
      <Image src={wave} alt="wave" />
    </div>
  )
}

function VideoFile({ file }: { file: IFile }) {
  const { mins, secs, hrs } = getDuration(new Audio(file.url).duration || 0)
  return (
    <div className="h-50 w-full grow flex flex-col justify-between rounded-lg bg-grey-400 overflow-hidden">
      <div className="flex flex-col font-inter p-3">
        <span className="font-medium text-sm whitespace-nowrap truncate text-[#050709]">{file.name}</span>
        <span className="text-grey-600 text-xs">{hrs}:{mins}:{secs}</span>
      </div>
      <Image src={wave} alt="wave" />
    </div>)
}

export default function FileGallery({ files }: { files: IFile[] }) {
  const { open } = useModal()
  return (
    <div onClick={() => open("file-preview", files)} className="flex flex-wrap gap-2">
      {
        files.map((file, i) => {
          const size = sizes[i % sizes.length]

          if (file.type.includes("video")) {
            return (
              <div key={i} className={`${size} max-w-1/2`}>
                <VideoFile file={file} />
              </div>
            )
          }
          if (file.type.includes("audio")) {
            return (
              <div key={i} className={`${size} max-w-1/2`}>
                <AudioFile file={file} />
              </div>
            )
          }
          return (
            <img
              key={i}
              src={file.url}
              className={`max-h-50 rounded-sm object-cover ${size}`}
              alt={file.name}
            />
          )
        })
      }
    </div>
  )
}