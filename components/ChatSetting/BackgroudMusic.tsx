import Switch from "@/components/Switch";
import musicImage from "@/public/image/music.png"
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { useBackgroundMusic } from "@/hooks/use-background-music";

function Slider({ volume, onVolumeChange }: { volume: number; onVolumeChange: (volume: number) => void }) {
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updateVolume(e);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateVolume(e);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateVolume = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onVolumeChange(Math.round(percentage));
  }, [onVolumeChange]);

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSliderClick = useCallback((e: React.MouseEvent) => {
    updateVolume(e);
  }, [updateVolume]);

  return (
    <div
      ref={sliderRef}
      className="w-full bg-sand-3 h-[6px] rounded-full cursor-pointer relative"
      onClick={handleSliderClick}
    >
      <div
        className="bg-sand-7 h-full rounded-full relative transition-all duration-150"
        style={{ width: `${volume}%` }}
      >
        <div
          className="bg-white cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-sand-8 hover:scale-110 transition-transform duration-150"
          onMouseDown={handleMouseDown}
          style={{
            right: '-8px'
          }}
        />
      </div>
    </div>
  )
}

export default function BackgroundMusic() {
  const { user, setUser } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const {
    isPlaying,
    currentTrack,
    volume,
    setVolume,
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    audioFiles
  } = useBackgroundMusic();

  // Get current track index from global state
  const currentTrackIndex = currentTrack ? audioFiles.findIndex(audio => audio.key === currentTrack) : -1;
  const isEnabled = user?.bg_music !== null;

  // Handle track selection and playback
  const handleTrackSelect = useCallback(async (index: number) => {
    const selectedAudio = audioFiles[index];

    // If same track is selected, toggle play/pause
    if (currentTrackIndex === index) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
      return;
    }

    // Update user's bg_music preference in backend
    try {
      const result = await trigger({ bg_music: selectedAudio.key });
      if (result?.data) {
        // Update local user state
        setUser({ ...user, bg_music: selectedAudio.key });
        toast.success("Background music updated");

        // Play the new track globally
        playTrack(selectedAudio.key);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update background music");
    }
  }, [currentTrackIndex, isPlaying, user, setUser, trigger, playTrack, pauseTrack, resumeTrack, audioFiles]);

  // Handle enable/disable toggle
  const handleToggle = useCallback(async (enabled: boolean) => {
    try {
      if (enabled) {
        // If enabling, use current track or default to first track
        const trackToEnable = user?.bg_music || audioFiles[0].key;
        const result = await trigger({ bg_music: trackToEnable });
        if (result?.data) {
          setUser({ ...user, bg_music: trackToEnable });
          toast.success("Background music enabled");
          playTrack(trackToEnable);
        }
      } else {
        // If disabling, set bg_music to null and stop playback
        const result = await trigger({ bg_music: null });
        if (result?.data) {
          setUser({ ...user, bg_music: null });
          toast.success("Background music disabled");
          stopTrack();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update background music settings");
    }
  }, [user, setUser, trigger, playTrack, stopTrack, audioFiles]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sand-12 font-canela text-xl">Background Music</span>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isMutating}
        />
      </div>
      {
        isEnabled &&
        <React.Fragment>
          <Slider volume={volume} onVolumeChange={setVolume} />
          <div className="grid grid-cols-2 gap-3">
            {audioFiles.map((audio, i) => (
              <div
                key={i}
                className={`border py-2.5 px-3 rounded-xl flex gap-3 items-center cursor-pointer transition-colors ${currentTrackIndex === i
                  ? 'border-blue-6 border-2 bg-blue-1'
                  : 'border-[#EAECF0] hover:border-gray-300'
                  } ${isMutating ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isMutating && handleTrackSelect(i)}
              >
                <Image src={musicImage} width={32} height={32} className="size-8" alt="Music" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sand-12 flex-1 font-inter font-medium truncate text-sm">{audio.title}</span>
                  <span className="font-inter text-xs text-[#667085]">Tune {i + 1}</span>
                </div>
                {currentTrackIndex === i && isPlaying && (
                  <span className="relative flex size-2">
                    <div className="size-full absolute bg-blue-6 animate-ping rounded-full" />
                    <span className="relative inline-flex size-2 rounded-full bg-blue-6"></span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </React.Fragment>
      }
    </div>
  )
}