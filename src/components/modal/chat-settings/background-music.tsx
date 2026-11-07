import { reportFetcherError } from "@/api/report-fetcher-error";
import { Button } from "@/components/ui/button";
import { VolumeControl } from "./volume-control";
import { chatSettingsCard } from "./chat-settings-card";
import "./volume-slider.css";
import { useCallback, useRef } from "react";
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
  const { isPlaying, isBuffering, currentTrack, volume, setVolume, playTrack, pauseTrack, resumeTrack, stopTrack, audioFiles } =
    useBackgroundMusic();

  const savingRef = useRef(false);
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
      if (savingRef.current) return;
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

      savingRef.current = true;
      try {
        const result = await trigger({ bg_music: selectedAudio.key });
        if (!result?.success) throw new Error(result?.message || "Couldn’t update background music.");
        mergeBgMusic(selectedAudio.key);
        toast.success("Background music updated");
        playTrack(selectedAudio.key);
        void Promise.resolve(mutate(endpoint.profile)).catch(() => undefined);
      } catch (error) {
        reportFetcherError(error, "Failed to update background music");
      } finally {
        savingRef.current = false;
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
      if (savingRef.current || (!enabled && !isEnabled)) return;
      savingRef.current = true;
      try {
        if (enabled) {
          const trackToEnable = user?.bg_music || audioFiles[0]?.key;
          if (!trackToEnable) return;
          const result = await trigger({ bg_music: trackToEnable });
          if (!result?.success) throw new Error(result?.message || "Couldn’t update background music.");
          mergeBgMusic(trackToEnable);
          toast.success("Background music enabled");
          playTrack(trackToEnable);
          void Promise.resolve(mutate(endpoint.profile)).catch(() => undefined);
        } else {
          const result = await trigger({ bg_music: null });
          if (!result?.success) throw new Error(result?.message || "Couldn’t update background music.");
          mergeBgMusic(null);
          toast.success("Background music disabled");
          stopTrack();
          void Promise.resolve(mutate(endpoint.profile)).catch(() => undefined);
        }
      } catch (error) {
        reportFetcherError(error, "Failed to update background music settings");
      } finally {
        savingRef.current = false;
      }
    },
    [audioFiles, isEnabled, mergeBgMusic, playTrack, stopTrack, trigger, user?.bg_music],
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
      <section aria-label="Music player" className="sky-card music-player-panel flex h-fit shrink-0 flex-col gap-3 rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-fill-neutral-strong text-text-inverse-strong">
            <Disc3
              className="music-player-disc size-12"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
              strokeWidth={1}
              aria-hidden
            />
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
              <Button type="button" variant="outline" size="icon-sm" aria-label={isPlaying || isBuffering ? "Stop music" : "Play music"} disabled={isMutating || !selectedTrack} onClick={() => {
                if (isPlaying || isBuffering) stopTrack();
                else if (currentTrack) resumeTrack();
                else void handleTrackSelect(selectedIndex);
              }}>
                {isPlaying || isBuffering ? <Square aria-hidden /> : <Play aria-hidden />}
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Next track" disabled={isMutating || audioFiles.length < 2} onClick={() => skipTrack(1)}>
                <SkipForward aria-hidden />
              </Button>
            </div>
          </div>
        </div>
        {isBuffering && <p role="status" className="text-xs text-text-neutral-weak">Loading music…</p>}
        <VolumeControl value={volume} onChange={setVolume} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">
        Background Ambience
      </h2>
      <div data-testid="ambience-card" className={cn("flex flex-col gap-3", chatSettingsCard)}>
        {audioFiles.length === 0 ? <p className="text-sm text-text-neutral-weak">No background tracks are available.</p> : null}
        <VolumeControl value={volume} onChange={setVolume} />
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            className={cn(
              "relative flex items-center gap-3 rounded-xl border py-1.5 pl-3 pr-10 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
              !isEnabled ? "border-stroke-neutral-weak bg-fill-neutral-weak" : "border-stroke-neutral-weak bg-background",
              isMutating ? "cursor-not-allowed" : "cursor-pointer",
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
              <span className="font-inter text-xs text-text-neutral-weaker">No tune</span>
            </span>
            {!isEnabled ? (
              <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-brand-strong" aria-hidden />
            ) : null}
          </button>
          {audioFiles.map((audio, index) => (
            <button
              type="button"
              key={audio.key}
              className={cn(
                "relative flex max-w-full items-center gap-3 rounded-xl border py-1.5 pl-3 pr-10 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
                currentTrackIndex === index && isEnabled
                  ? "border-stroke-neutral-weak bg-fill-neutral-weak text-text-neutral-strong"
                  : "border-stroke-neutral-weak bg-background text-text-neutral-strong hover:bg-fill-neutral-weaker",
                isMutating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              )}
              onClick={() => !isMutating && handleTrackSelect(index)}
              disabled={isMutating}
            >
              <img src={musicImage} width={32} height={32} alt="" className="size-8 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="block truncate font-inter text-sm font-medium text-text-neutral-strong">{audio.title}</span>
                <span className="font-inter text-xs text-text-neutral-weaker">Tune {index + 1}</span>
              </div>
              {currentTrackIndex === index && isPlaying && isEnabled && (
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute size-full animate-ping motion-reduce:animate-none rounded-full bg-fill-brand-strong" />
                  <span className="relative inline-flex size-2 rounded-full bg-fill-brand-strong" />
                </span>
              )}
              {currentTrackIndex === index && isEnabled ? (
                <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-brand-strong" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
