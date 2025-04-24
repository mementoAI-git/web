import { getDuration } from "@/utility"
import { Ref } from "react";
import VolumeIcon from "@/public/icon/volume.svg";
import PauseIcon from "@/public/icon/pause-rec.svg";
import PlayIcon from "@/public/icon/play.svg";
import BackwardIcon from "@/public/icon/15-sec-back.svg";
import ForwardIcon from "@/public/icon/15-sec-forward.svg";
import usePlayer from "@/hooks/use-player";
import Image from "next/image";
import wave from "@/public/image/wave.png"

export interface IMediaPlayer {
  src: string
  alt?: string
}

export default function AudioPlayer({ src, alt }: IMediaPlayer) {
  const { ref, media, togglePlay, backward, forward, canPlay, playing, progress } = usePlayer()
  const current = getDuration(media?.currentTime)
  const end = getDuration(media?.duration || 0)

  return (
    <div className="flex flex-col flex-1 items-center justify-between rounded-2xl border border-[#F3F3F3] bg-[#FCFCFD]">
      <div />
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
      <Image src={wave} height={79} className="w-full h-20 object-cover" alt="wave" />
    </div>
  )
}