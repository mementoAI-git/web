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

function Slider({ volume, onVolumeChange }: { volume: number; onVolumeChange: (volume: number) => void }) {
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
      setIsDragging(true);
      updateVolume(event);
    },
    [updateVolume],
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
      updateVolume(event);
    },
    [updateVolume],
  );

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  return (
    <div
      ref={sliderRef}
      className="relative h-[6px] w-full cursor-pointer rounded-full bg-sand-3"
      onClick={handleSliderClick}
    >
      <div className="relative h-full rounded-full bg-sand-7 transition-all duration-150" style={{ width: `${volume}%` }}>
        <div
          className="absolute right-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-sand-8 bg-white transition-transform duration-150 hover:scale-110"
          onMouseDown={handleMouseDown}
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
      <div className="flex items-center justify-between">
        <span className="font-garamond text-xl text-sand-12">Background Music</span>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={isMutating} />
      </div>
      {isEnabled && (
        <>
          <Slider volume={volume} onVolumeChange={setVolume} />
          <div className="grid grid-cols-2 gap-3">
            {audioFiles.map((audio, index) => (
              <button
                type="button"
                key={audio.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl border py-2.5 px-3 transition-colors",
                  currentTrackIndex === index ? "border-2 border-blue-6 bg-blue-1" : "border-[#EAECF0] hover:border-gray-300",
                  isMutating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                )}
                onClick={() => !isMutating && handleTrackSelect(index)}
              >
                <img src={musicImage} width={32} height={32} alt="Music" className="size-8" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-inter text-sm font-medium text-sand-12">{audio.title}</span>
                  <span className="font-inter text-xs text-[#667085]">Tune {index + 1}</span>
                </div>
                {currentTrackIndex === index && isPlaying && (
                  <span className="relative flex size-2">
                    <span className="absolute size-full animate-ping rounded-full bg-blue-6" />
                    <span className="relative inline-flex size-2 rounded-full bg-blue-6" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
