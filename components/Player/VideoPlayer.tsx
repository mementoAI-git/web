import usePlayer from "@/hooks/use-player"
import { getDuration } from "@/utility"
import PlaySolidIcon from "@/public/icon/play-solid.svg";
import PauseIcon from "@/public/icon/pause-rec.svg";
import { Ref, useRef } from "react";
import Spinner from "../Spinner";

export default function VideoPlayer({ src }: { src: string }) {
  const { ref, media, togglePlay, seek, canPlay, playing, progress } = usePlayer()
  const progressBar = useRef(null)
  const current = getDuration(media?.currentTime || 0)
  const end = getDuration(media?.duration || 0)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBar.current) return;

    const rect = progressBar.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    seek(media?.duration * clickRatio);
  };
  return (
    <div className="size-full relative">
      <video
        ref={ref as Ref<HTMLVideoElement>}
        autoPlay
        // muted
        preload="auto"
        className="size-full object-cover"
        src={src}
        playsInline
        onError={() => { }}
      />
      <div className="absolute top-0 right-0 left-0 bottom-0 size-full flex justify-center items-end">
        {
          canPlay ?
            <div className="w-full p-3 space-y-2 bg-gradient-to-t from-50% to-95% from-black/20 to-transparent">
              <div className={`${canPlay ? "text-white" : "text-white/45"} flex items-center gap-2`}>
                <div onClick={togglePlay} className="cursor-pointer">
                  {
                    playing ?
                      <PauseIcon width={13} /> :
                      <PlaySolidIcon width={13} />
                  }
                </div>
                <div ref={progressBar} onClick={handleSeek} className="flex-1 h-[9px] bg-white/20 rounded-full overflow-hidden">
                  <div style={{ width: `${progress}%` }} className="h-full rounded-full bg-white" />
                </div>
              </div>
              <div className="flex items-center justify-between font-inter text-white font-semibold text-[13px]">
                <span>{current.mins}:{current.secs}</span>
                <span>{end.mins}:{end.secs}</span>
              </div>
            </div> :
            <div className="size-full bg-black/30 flex items-center justify-center">
              <Spinner loading className="!size-35" />
            </div>
        }
      </div>
    </div>
  )
}