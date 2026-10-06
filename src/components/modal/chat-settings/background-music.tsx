import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import "./volume-slider.css";
import { useCallback } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { CheckCircle2, Disc3, Play, SkipBack, SkipForward, Square, VolumeX } from "lucide-react";
import musicImage from "@/assets/image/music.png";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import { cn } from "@/utility";

export default function BackgroundMusic({ compact = false }: { compact?: boolean } = {}) {
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

  if (compact) {
    const savedIndex = audioFiles.findIndex((audio) => audio.key === user?.bg_music);
    const selectedIndex = currentTrackIndex >= 0 ? currentTrackIndex : Math.max(savedIndex, 0);
    const selectedTrack = audioFiles[selectedIndex];
    const skipTrack = (direction: number) => {
      if (!audioFiles.length) return;
      void handleTrackSelect((selectedIndex + direction + audioFiles.length) % audioFiles.length);
    };
    return (
      <section aria-label="Music player" className="flex flex-col gap-3 rounded-xl bg-fill-neutral-weaker p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-fill-neutral-strong text-text-inverse-strong">
            <Disc3 className="size-12" strokeWidth={1} aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs text-text-neutral-weak">Music</span>
            <span className="truncate text-sm font-medium text-text-neutral-strong" aria-live="polite">
              {selectedTrack?.title ?? "No music available"}
            </span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous track" disabled={isMutating || audioFiles.length < 2} onClick={() => skipTrack(-1)}>
                <SkipBack aria-hidden />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" aria-label={isPlaying ? "Stop music" : "Play music"} disabled={isMutating || !selectedTrack} onClick={() => {
                if (isPlaying) stopTrack();
                else if (currentTrack) resumeTrack();
                else void handleTrackSelect(selectedIndex);
              }}>
                {isPlaying ? <Square aria-hidden /> : <Play aria-hidden />}
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Next track" disabled={isMutating || audioFiles.length < 2} onClick={() => skipTrack(1)}>
                <SkipForward aria-hidden />
              </Button>
            </div>
          </div>
        </div>
        <Slider className="ambience-volume-slider" label="Volume" size="compact" value={volume} onChange={(value) => { if (typeof value === "number") setVolume(value); }} min={0} max={100} formatValue={(value) => `${value}%`} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">
        Background Ambience
      </h2>
      <Slider
        className="ambience-volume-slider"
        label="Volume"
        size="default"
        value={volume}
        onChange={(value) => { if (typeof value === "number") setVolume(value); }}
        min={0}
        max={100}
        formatValue={(value) => `${value}%`}
      />
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
