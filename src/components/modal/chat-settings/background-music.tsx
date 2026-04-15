import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { toast } from "sonner";
import Switch from "@/components/switch";
import musicImage from "@/assets/image/music.png";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
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
  const isEnabled = user?.bg_music !== null;

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
        const result = await trigger({ bg_music: selectedAudio.key });
        if (result?.data) {
          setUser?.({ ...user, bg_music: selectedAudio.key });
          toast.success("Background music updated");
          playTrack(selectedAudio.key);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update background music");
      }
    },
    [audioFiles, currentTrackIndex, isPlaying, pauseTrack, playTrack, resumeTrack, setUser, trigger, user],
  );

  const handleToggle = useCallback(
    async (enabled: boolean) => {
      try {
        if (enabled) {
          const trackToEnable = user?.bg_music || audioFiles[0]?.key;
          if (!trackToEnable) return;
          const result = await trigger({ bg_music: trackToEnable });
          if (result?.data) {
            setUser?.({ ...user, bg_music: trackToEnable });
            toast.success("Background music enabled");
            playTrack(trackToEnable);
          }
        } else {
          const result = await trigger({ bg_music: null });
          if (result?.data) {
            setUser?.({ ...user, bg_music: null });
            toast.success("Background music disabled");
            stopTrack();
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update background music settings");
      }
    },
    [audioFiles, playTrack, setUser, stopTrack, trigger, user],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-garamond text-xl font-medium text-text-neutral-strong">Background Music</span>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={isMutating} />
      </div>
      <Slider volume={volume} onVolumeChange={setVolume} disabled={!isEnabled} />
      <div className="grid grid-cols-2 gap-3">
        {audioFiles.map((audio, index) => (
          <button
            type="button"
            key={audio.key}
            className={cn(
              "flex items-center gap-3 rounded-xl border py-2.5 px-3 transition-colors",
              currentTrackIndex === index
                ? "border-2 border-stroke-brand-strong bg-fill-neutral-weakest"
                : "border-stroke-neutral-weaker hover:border-stroke-neutral-weak",
              isMutating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              !isEnabled && "opacity-70",
            )}
            onClick={() => !isMutating && handleTrackSelect(index)}
          >
            <img src={musicImage} width={32} height={32} alt="" className="size-8" />
            <div className="min-w-0 flex-1 text-left">
              <span className="block truncate font-inter text-sm font-medium text-text-neutral-strong">{audio.title}</span>
              <span className="font-inter text-xs text-text-neutral-weak">Tune {index + 1}</span>
            </div>
            {currentTrackIndex === index && isPlaying && isEnabled && (
              <span className="relative flex size-2">
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
