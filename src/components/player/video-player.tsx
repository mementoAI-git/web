import { useRef, type Ref } from "react";
import { PauseRecIcon, PlaySolidIcon } from "@/components/icons";
import Spinner from "@/components/spinner";
import usePlayer from "@/hooks/use-player";
import { getDuration } from "@/utility";

export default function VideoPlayer({ src }: { src: string }) {
  const { ref, media, togglePlay, seek, canPlay, playing, progress } =
    usePlayer();
  const progressBar = useRef<HTMLDivElement | null>(null);
  const current = getDuration(media?.currentTime || 0);
  const end = getDuration(media?.duration || 0);

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBar.current || !media?.duration) return;
    const rect = progressBar.current.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(media.duration * ratio);
  };

  return (
    <div className="relative size-full">
      <video
        ref={ref as Ref<HTMLVideoElement>}
        autoPlay
        preload="auto"
        className="size-full object-cover"
        src={src}
        playsInline
      />
      <div className="absolute inset-0 flex size-full items-end justify-center">
        {canPlay ? (
          <div className="w-full space-y-2 bg-gradient-to-t from-black/20 via-black/0 to-black/0 p-3">
            <div className="flex items-center gap-2 text-white">
              <button
                onClick={togglePlay}
                className="cursor-pointer"
                type="button"
              >
                {playing ? (
                  <PauseRecIcon width={13} />
                ) : (
                  <PlaySolidIcon width={13} />
                )}
              </button>
              <div
                ref={progressBar}
                onClick={handleSeek}
                className="h-[9px] flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
              >
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between font-inter text-[13px] font-semibold text-white">
              <span>
                {current.mins}:{current.secs}
              </span>
              <span>
                {end.mins}:{end.secs}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-black/30">
            <Spinner loading className="size-35!" />
          </div>
        )}
      </div>
    </div>
  );
}
