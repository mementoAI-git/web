import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { CheckCircle2, VolumeX } from "lucide-react";
import musicImage from "@/assets/image/music.png";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import { cn } from "@/utility";

function Slider({
  volume,
  onVolumeChange,
  disabled = false,
}: {
  volume: number;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateVolume = useCallback(
    (event: MouseEvent | ReactMouseEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onVolumeChange(Math.round(percentage));
    },
    [onVolumeChange],
  );

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      updateVolume(event);
    },
    [disabled, updateVolume],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;
      updateVolume(event);
    },
    [isDragging, updateVolume],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSliderClick = useCallback(
    (event: ReactMouseEvent) => {
      if (disabled) return;
      updateVolume(event);
    },
    [disabled, updateVolume],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        onVolumeChange(Math.min(100, volume + 1));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        onVolumeChange(Math.max(0, volume - 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        onVolumeChange(0);
      } else if (event.key === "End") {
        event.preventDefault();
        onVolumeChange(100);
      }
    },
    [disabled, onVolumeChange, volume],
  );

  useEffect(() => {
    if (disabled) setIsDragging(false);
  }, [disabled]);

  useEffect(() => {
    if (!isDragging || disabled) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [disabled, handleMouseMove, handleMouseUp, isDragging]);

  return (
    <div
      ref={sliderRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Background ambience volume"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={volume}
      className={cn(
        "relative flex h-5 w-full items-center overflow-hidden rounded bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
      )}
      onClick={handleSliderClick}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
    >
      <div
        className="relative h-full rounded-sm bg-fill-brand-strong"
        style={{ width: `${volume}%` }}
      >
        <div
          data-testid="ambience-volume-marker"
          className="absolute right-1 top-1/2 h-2.5 w-px -translate-y-1/2 rounded-sm bg-background"
        />
      </div>
    </div>
  );
}

export default function BackgroundMusic() {
  const { user, setUser } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const { isPlaying, currentTrack, volume, setVolume, playTrack, pauseTrack, resumeTrack, stopTrack, audioFiles } =
    useBackgroundMusic();

  const currentTrackIndex = currentTrack ? audioFiles.findIndex((audio) => audio.key === currentTrack) : -1;
  const isEnabled = Boolean(user?.bg_music);

  const mergeBgMusic = useCallback(
    (bg_music: string | null) => {
      if (!user) return;
      setUser({
        ...user,
        ...(bg_music === null ? { bg_music: undefined } : { bg_music }),
      });
    },
    [setUser, user],
  );

  const handleTrackSelect = useCallback(
    async (index: number) => {
      const selectedAudio = audioFiles[index];
      if (!selectedAudio) return;

      if (currentTrackIndex === index) {
        if (isPlaying) {
          pauseTrack();
        } else {
          resumeTrack();
        }
        return;
      }

      try {
        await trigger({ bg_music: selectedAudio.key });
        mergeBgMusic(selectedAudio.key);
        toast.success("Background music updated");
        playTrack(selectedAudio.key);
        void mutate(endpoint.profile);
      } catch (error) {
        console.error(error);
        toast.error("Failed to update background music");
      }
    },
    [
      audioFiles,
      currentTrackIndex,
      isPlaying,
      mergeBgMusic,
      pauseTrack,
      playTrack,
      resumeTrack,
      trigger,
    ],
  );

  const handleToggle = useCallback(
    async (enabled: boolean) => {
      try {
        if (enabled) {
          const trackToEnable = user?.bg_music || audioFiles[0]?.key;
          if (!trackToEnable) return;
          await trigger({ bg_music: trackToEnable });
          mergeBgMusic(trackToEnable);
          toast.success("Background music enabled");
          playTrack(trackToEnable);
          void mutate(endpoint.profile);
        } else {
          await trigger({ bg_music: null });
          mergeBgMusic(null);
          toast.success("Background music disabled");
          stopTrack();
          void mutate(endpoint.profile);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update background music settings");
      }
    },
    [audioFiles, mergeBgMusic, playTrack, stopTrack, trigger, user?.bg_music],
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">
        Background Ambience
      </h2>
      <Slider volume={volume} onVolumeChange={setVolume} />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={cn(
            "relative flex min-h-[66px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98]",
            !isEnabled ? "border-stroke-brand-strong bg-background" : "border-stroke-neutral-weak bg-background",
          )}
          onClick={() => void handleToggle(false)}
          disabled={isMutating}
          aria-label="Off No tune"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill-neutral-weaker">
            <VolumeX className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-geist text-sm font-semibold text-text-neutral-strong">Off</span>
            <span className="font-inter text-xs text-text-neutral-weak">No tune</span>
          </span>
          {!isEnabled ? (
            <CheckCircle2 className="absolute right-1.5 top-1.5 fill-fill-brand-strong text-text-inverse-strong" aria-hidden />
          ) : null}
        </button>
        {audioFiles.map((audio, index) => (
          <button
            type="button"
            key={audio.key}
            className={cn(
              "relative flex min-h-[66px] max-w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98]",
              currentTrackIndex === index && isEnabled
                ? "border-stroke-brand-strong bg-background"
                : "border-stroke-neutral-weak bg-background text-text-neutral-strong hover:bg-fill-neutral-weaker",
              isMutating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
            onClick={() => !isMutating && handleTrackSelect(index)}
            disabled={isMutating}
          >
            <img src={musicImage} width={32} height={32} alt="" className="size-8 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="block truncate font-inter text-sm font-medium text-text-neutral-strong">{audio.title}</span>
              <span className="font-inter text-xs text-text-neutral-weak">Tune {index + 1}</span>
            </div>
            {currentTrackIndex === index && isPlaying && isEnabled && (
              <span className="relative flex size-2 shrink-0">
                <span className="absolute size-full animate-ping rounded-full bg-fill-brand-strong" />
                <span className="relative inline-flex size-2 rounded-full bg-fill-brand-strong" />
              </span>
            )}
            {currentTrackIndex === index && isEnabled ? (
              <CheckCircle2 className="absolute right-1.5 top-1.5 fill-fill-brand-strong text-text-inverse-strong" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
