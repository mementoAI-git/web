import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
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
      className={cn(
        "relative h-1.5 w-full rounded-full bg-fill-neutral-weaker",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
      )}
      onClick={handleSliderClick}
      aria-disabled={disabled}
    >
      <div
        className="relative h-full rounded-full bg-fill-brand-strong transition-all duration-150"
        style={{ width: `${volume}%` }}
      >
        <div
          className="absolute right-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-stroke-neutral-weak bg-white transition-transform duration-150 hover:scale-110"
          onMouseDown={disabled ? undefined : handleMouseDown}
          style={{ right: "-8px" }}
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
    <div className="space-y-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="min-w-0 flex-1 font-garamond text-xl font-medium leading-snug text-text-neutral-strong">
          Background Music
        </span>
        <Switch
          checked={isEnabled}
          onCheckedChange={(next) => void handleToggle(next)}
          disabled={isMutating}
          aria-label="Turn background music on or off"
          className={cn(
            "shrink-0 border shadow-sm transition-[background-color,border-color] duration-200",
            /* On: brand track (aria + data-state — Radix may use either) */
            "aria-checked:border-fill-brand-strong aria-checked:bg-fill-brand-strong",
            "data-[state=checked]:border-fill-brand-strong data-[state=checked]:bg-fill-brand-strong",
            /* Off: clearly different neutral track vs orange “on” */
            "aria-[checked=false]:border-stroke-neutral-weak aria-[checked=false]:bg-stone-200/95 dark:aria-[checked=false]:bg-stone-600",
            "data-[state=unchecked]:border-stroke-neutral-weak data-[state=unchecked]:bg-stone-200/95 dark:data-[state=unchecked]:bg-stone-600",
            /* Thumb: light circle on both tracks */
            "[&_[data-slot=switch-thumb]]:bg-white [&_[data-slot=switch-thumb]]:shadow-sm",
          )}
        />
      </div>
      <Slider volume={volume} onVolumeChange={setVolume} disabled={!isEnabled} />
      <div className="flex flex-wrap gap-3">
        {audioFiles.map((audio, index) => (
          <button
            type="button"
            key={audio.key}
            className={cn(
              "flex max-w-full min-w-[9rem] flex-[1_1_calc(50%-0.375rem)] items-center gap-3 rounded-xl border py-2.5 px-3 text-left transition-colors",
              currentTrackIndex === index
                ? "border-2 border-stroke-brand-strong bg-fill-neutral-weakest"
                : "border-stroke-neutral-weaker hover:border-stroke-neutral-weak",
              isMutating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              !isEnabled && "opacity-70",
            )}
            onClick={() => !isMutating && handleTrackSelect(index)}
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
          </button>
        ))}
      </div>
    </div>
  );
}
