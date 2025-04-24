import { IFile } from "@/utility/interface";
import { useModal } from "@/hooks/use-modal";
import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import AudioPlayer from "@/components/AudioPlayer";

interface IFilePlayer {
  src: string
  alt?: string
}

function VideoPreview({ src }: IFilePlayer) {
  return (
    <div className="w-[90%] relative h-120 mx-auto rounded-[9px] overflow-hidden">
      <div className="size-full top-0 right-0">
        <VideoPlayer src={src} />
      </div>
    </div>
  )
}

function AudioPreview({ src, alt }: IFilePlayer) {
  return (
    <div className="modal-container !mx-auto flex !min-h-126 !w-154.5">
      <AudioPlayer {...{ src, alt }} />
    </div>
  );
}

export default function FilePreview({ files }: { files: IFile[] }) {
  const [index, setIndex] = useState(0)
  const { close } = useModal();

  return (
    <div className="relative z-50 flex items-center justify-center flex-col min-w-[80%]">
      <div onClick={() => close("file-preview")} className="absolute cursor-pointer -top-9 -right-9 size-10 flex items-center justify-center text-white rounded-full bg-black/[32%]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2L22 22M22 2L2 22" stroke="#FCFCFD" strokeWidth="2.33333" strokeLinecap="round" />
        </svg>
      </div>
      {
        files.map((file, i) => (
          <div key={i} className={`transition-opacity duration-1000 ease-in-out w-full ${index === i ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
            {
              file.type.includes("video") ?
                <VideoPreview alt={file.name} src={file.url} /> :
                file.type.includes("audio") ?
                  <AudioPreview alt={file.name} src={file.url} /> :
                  <img src={file.url} alt={file.name} className="rounded-2xl size-full mx-auto max-w-110 h-auto border-[3px] border-grey-500" />
            }
          </div>
        ))
      }
      <div>
        <div className="mx-auto mt-7 flex w-fit items-center justify-center gap-1 rounded-full bg-black/[32%] px-2 py-1">
          {
            files.map((_, i) => (
              <div
                key={i}
                onClick={() => setIndex(i)}
                className={`size-2 cursor-pointer rounded-full ${index === i ? "bg-white" : "bg-[#C7C9C8]"}`}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
}
