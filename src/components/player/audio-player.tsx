import {
  useRef,
  type ReactEventHandler,
  type Ref,
  type RefObject,
} from "react";
import {
  Backward15Icon,
  Forward15Icon,
  PauseRecIcon,
  PlayIcon,
  VolumeIcon,
} from "@/components/icons";
import usePlayer from "@/hooks/use-player";
import { getDuration } from "@/utility";
import wave from "@/assets/image/wave.png";
import Transcription from "./transcription";

export interface MediaPlayerProps {
  src: string;
  id?: string;
  alt?: string;
  className?: string;
  duration?: number;
  audioRef?: RefObject<HTMLAudioElement>;
  onError?: ReactEventHandler<HTMLAudioElement>;
}

export default function AudioPlayer({
  src,
  alt,
  className = "",
  id = null,
  duration = 0,
  audioRef,
  onError,
}: MediaPlayerProps) {
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
    toggleMute,
  } = usePlayer({ src, externalRef: audioRef, duration });
  const progressBar = useRef<HTMLDivElement | null>(null);
  const current = getDuration(media?.currentTime || 0);
  // Use media.duration only when it is a real finite value; fall back to the
  // DB-supplied duration prop (which correctly represents the recording length).
  const knownDuration = (media?.duration && isFinite(media.duration)) ? media.duration : duration;
  const end = getDuration(knownDuration);

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBar.current || !media?.duration) return;

    const rect = progressBar.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = clickX / rect.width;
    seek(media.duration * ratio);
  };

  return (
    <div
      className={`flex flex-1 flex-col items-center justify-between rounded-2xl border border-v3-stroke-weak bg-white ${className}`}
    >
      <div />
      <div className="w-62.5 space-y-6">
        {alt && (
          <span className="block font-inter font-semibold text-foreground">
            {alt}
          </span>
        )}
        <audio
          ref={ref as Ref<HTMLAudioElement>}
          preload="auto"
          crossOrigin="anonymous"
          src={src}
          onError={onError}
          key={id}
        />
        <div className="space-y-2">
          <div
            ref={progressBar}
            onClick={handleSeek}
            className="h-1 w-full cursor-pointer rounded-[1px] bg-[#DCC7FF]"
          >
            <div
              style={{ width: `${progress}%` }}
              className="relative h-full bg-primary"
            >
              <div className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rounded-full bg-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-medium text-foreground">
              {current.mins}:{current.secs}/
              <span className="font-normal text-grey-800">
                {end.mins}:{end.secs}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                onClick={toggleMute}
                className="flex items-center justify-center rounded transition-colors hover:bg-grey-100 p-1"
                type="button"
              >
                <VolumeIcon
                  width={10}
                  className={isMuted ? "opacity-50" : ""}
                />
              </button>
              <input
                aria-label="Audio volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(event) =>
                  setVolumeLevel(parseFloat(event.target.value))
                }
                className="volume__slider h-[2px] w-8 cursor-pointer appearance-none rounded-lg bg-grey-300"
                style={{
                  background: `linear-gradient(to right, var(--icon-neutral-strong) 0%, var(--icon-neutral-strong) ${(isMuted ? 0 : volume) * 100}%, #d1d5db ${(isMuted ? 0 : volume) * 100}%, #d1d5db 100%)`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            aria-label="Skip back 15 seconds"
            onClick={() => backward()}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-grey-500 transition-all duration-200 hover:scale-[97%] hover:bg-grey-400"
          >
            <Backward15Icon width={24} />
          </button>
          <button
            type="button"
            disabled={!canPlay}
            onClick={togglePlay}
            className="btn !px-8 !py-3"
          >
            {playing ? <PauseRecIcon width={11} /> : <PlayIcon width={11} />}
            <span className="font-inter text-sm font-semibold">
              {playing ? "Pause" : "Play"}
            </span>
          </button>
          <button
            type="button"
            aria-label="Skip forward 15 seconds"
            onClick={() => forward()}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-grey-500 transition-all duration-200 hover:scale-[97%] hover:bg-grey-400"
          >
            <Forward15Icon width={24} />
          </button>
        </div>
        {id && <Transcription id={id} currentTime={media?.currentTime || 0} />}
      </div>
      <img
        src={wave}
        height={79}
        className="h-20 w-full object-cover"
        alt="wave"
      />
    </div>
  );
}
