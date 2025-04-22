import { IFile } from "@/utility/interface";
import Image from "next/image";
import BackwardIcon from "@/public/icon/15-sec-back.svg";
import ForwardIcon from "@/public/icon/15-sec-forward.svg";
import PlayIcon from "@/public/icon/play.svg";
import PlaySolidIcon from "@/public/icon/play-solid.svg";
import PauseIcon from "@/public/icon/pause-rec.svg";
import VolumeIcon from "@/public/icon/volume.svg";

import { useModal } from "@/hooks/use-modal";
import { Ref, useState } from "react";
import usePlayer from "@/hooks/use-player";
import { getDuration } from "@/utility";

interface IFilePlayer {
  src: string
  alt?: string
}

function VideoPreview({ src }: IFilePlayer) {
  const { ref, media, togglePlay, canPlay, playing, progress } = usePlayer()

  const current = getDuration(media?.currentTime || 0)
  const end = getDuration(media?.duration || 0)
  return (
    <div className="w-[90%] max-h-120 mx-auto rounded-[9px] relative overflow-hidden">
      <video ref={ref as Ref<HTMLVideoElement>} className="size-full object-cover" src={src} playsInline />
      <div className="absolute p-3 top-0 right-0 left-0 bottom-0 size-full flex items-end">
        <div className="w-full space-y-2">
          <div className={`${canPlay ? "text-white" : "text-white/45"} flex items-center gap-2`}>
            <div onClick={togglePlay} className="cursor-pointer">
              {
                playing ?
                  <PauseIcon width={13} /> :
                  <PlaySolidIcon width={13} />
              }
            </div>
            <div className="flex-1 h-[9px] bg-white/20 rounded-full overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-full rounded-full bg-white" />
            </div>
          </div>
          <div className="flex items-center justify-between font-inter text-white font-semibold text-[13px]">
            <span>{current.mins}:{current.secs}</span>
            <span>{end.mins}:{end.secs}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AudioPreview({ src, alt }: IFilePlayer) {
  const { ref, media, togglePlay, backward, forward, canPlay, playing, progress } = usePlayer()
  const current = getDuration(media?.currentTime)
  const end = getDuration(media?.duration || 0)

  return (
    <div className="modal-container !mx-auto flex !min-h-126 !w-154.5">
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-[#F3F3F3] bg-[#FCFCFD]">
        <div className="w-62.5 space-y-6">
          <span className="block font-inter font-semibold text-secondary">
            {alt}
          </span>
          <audio ref={ref as Ref<HTMLAudioElement>} src={src} preload="auto" />
          <div className="space-y-2">
            <div className="h-1 w-full rounded-[1px] bg-[#DCC7FF]">
              <div style={{ width: `${progress}%` }} className="relative h-full bg-primary">
                <div className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-inter text-xs font-medium text-secondary">
                {current.mins}:{current.secs}/<span className="font-normal text-grey-800">{end.mins}:{end.secs}</span>
              </span>
              <span>
                <VolumeIcon width={10} />
              </span>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <div
              className="flex size-11 items-center justify-center rounded-full bg-grey-500 cursor-pointer"
              onClick={() => backward()}
            >
              <BackwardIcon width={24} />
            </div>
            <button disabled={!canPlay} onClick={togglePlay} className="btn !px-8 !py-3">
              {
                playing ?
                  <PauseIcon width={11} /> :
                  <PlayIcon width={11} />
              }
              <span className="font-inter text-sm font-semibold">Play</span>
            </button>
            <div
              className="flex size-11 items-center justify-center rounded-full bg-grey-500"
              onClick={() => forward()}
            >
              <ForwardIcon width={24} />
            </div>
          </div>
          <div>
            <span className="mx-auto block text-center font-inter text-xs text-secondary">
              Show transcription
            </span>
          </div>
        </div>
      </div>
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
