import { getDuration } from "@/utility"
import { Ref, useRef } from "react";
import VolumeIcon from "@/public/icon/volume.svg";
import PauseIcon from "@/public/icon/pause-rec.svg";
import PlayIcon from "@/public/icon/play.svg";
import BackwardIcon from "@/public/icon/15-sec-back.svg";
import ForwardIcon from "@/public/icon/15-sec-forward.svg";
import usePlayer from "@/hooks/use-player";
import Image from "next/image";
import wave from "@/public/image/wave.png"
import Transcription from "./Transcription";

export interface IMediaPlayer {
  src: string
  id?: string
  alt?: string
  className?: string
  duration?: number
}

export default function AudioPlayer({
  src,
  alt,
  className = "",
  id = null,
  duration = 0
}: IMediaPlayer) {
  const {
    ref,
    media,
    togglePlay,
    backward,
    forward,
    seek,
    canPlay,
    playing,
    progress,
    volume,
    isMuted,
    setVolumeLevel,
    toggleMute
  } = usePlayer()
  const progressBar = useRef(null)
  const current = getDuration(media?.currentTime)
  const end = getDuration(media?.duration || duration)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBar.current) return;

    const rect = progressBar.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    seek(media?.duration * clickRatio);
  };

  return (
    <div className={`flex flex-col flex-1 items-center justify-between rounded-2xl border border-[#F3F3F3] bg-[#FCFCFD] ${className}`}>
      <div />
      <div className="w-62.5 space-y-6">
        <span className="block font-inter font-semibold text-secondary">
          {alt}
        </span>
        <audio ref={ref as Ref<HTMLAudioElement>} src={src} preload="auto" />
        <div className="space-y-2">
          <div ref={progressBar} onClick={handleSeek} className="h-1 w-full rounded-[1px] bg-[#DCC7FF] cursor-pointer">
            <div style={{ width: `${progress}%` }} className="relative h-full bg-primary">
              <div className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-medium text-secondary">
              {current.mins}:{current.secs}/<span className="font-normal text-grey-800">{end.mins}:{end.secs}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="flex items-center justify-center p-1 hover:bg-grey-100 rounded transition-colors"
              >
                <VolumeIcon width={10} className={isMuted ? "opacity-50" : ""} />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-8 h-[2px] bg-grey-300 rounded-lg appearance-none cursor-pointer volume__slider"
                style={{
                  background: `linear-gradient(to right, var(--color-secondary) 0%, var(--color-secondary) ${(isMuted ? 0 : volume) * 100}%, #d1d5db ${(isMuted ? 0 : volume) * 100}%, #d1d5db 100%)`
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between">
          <div
            className="flex size-11 items-center justify-center rounded-full bg-grey-500 cursor-pointer hover:bg-grey-400 hover:scale-[97%] transition-colors duration-200"
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
            <span className="font-inter text-sm font-semibold">
              {playing ? "Pause" : "Play"}
            </span>
          </button>
          <div
            className="flex size-11 items-center justify-center rounded-full bg-grey-500 cursor-pointer hover:bg-grey-400 hover:scale-[97%] transition-colors duration-200"
            onClick={() => forward()}
          >
            <ForwardIcon width={24} />
          </div>
        </div>
        {
          id &&
          <Transcription id={id} currentTime={media?.currentTime || 0} />
        }
      </div>
      <Image src={wave} height={79} className="w-full h-20 object-cover" alt="wave" />
    </div>
  )
}