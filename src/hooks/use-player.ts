import { useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";

type MediaElement = HTMLAudioElement | HTMLVideoElement;

export default function usePlayer({
  src,
  externalRef,
  duration: externalDuration = 0,
}: {
  src: string;
  externalRef?: RefObject<MediaElement>;
  duration?: number;
}) {
  const internalRef = useRef<MediaElement | null>(null);
  const ref = externalRef || internalRef;
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    const media = ref.current;
    if (!media || !media.src) {
      toast("Media source is missing or not supported", {
        className: "!text-danger",
      });
      return;
    }
    if (!canPlay) return;

    if (playing) {
      media.pause();
    } else {
      media.play();
    }
    // setPlaying((prev) => !prev);
  };



  const forward = (seconds: number = 15) => {
    const media = ref.current;
    if (!media) return;
    const dur = isFinite(media.duration) ? media.duration : externalDuration;
    media.currentTime = Math.min(media.currentTime + seconds, dur || 0);
  };

  const backward = (seconds: number = -15) => {
    const media = ref.current;
    if (!media) return;
    media.currentTime = Math.max(media.currentTime + seconds, 0);
  };

  const seek = (seconds: number) => {
    const media = ref.current;
    if (!media) return;
    const dur = isFinite(media.duration) ? media.duration : externalDuration;
    media.currentTime = Math.max(Math.min(seconds, dur || 0), 0);
  };

  const setVolumeLevel = (newVolume: number) => {
    const media = ref.current;
    if (!media) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    media.volume = clampedVolume;
    setVolume(clampedVolume);

    if (clampedVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const media = ref.current;
    if (!media) return;

    if (isMuted) {
      media.volume = volume;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  useEffect(() => {
    setPlaying(false);
    setCanPlay(false);
    setProgress(0);

    const media = ref.current;
    if (!media) return () => undefined;

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);

    media.onloadstart = () => {
      setCanPlay(false);
    };

    media.onended = () => {
      media.pause();
      media.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    };

    media.ontimeupdate = () => {
      // Use the real browser duration when available; fall back to the
      // externally supplied duration for WebM blobs that report Infinity.
      const dur = (media.duration && isFinite(media.duration))
        ? media.duration
        : externalDuration;
      if (!dur) return;
      const progressPercent = (media.currentTime / dur) * 100;
      setProgress(progressPercent);
    };

    media.oncanplay = () => {
      setCanPlay(true);
    };

    // Always enable play on metadata load; Infinity duration is still playable.
    media.onloadedmetadata = () => {
      setCanPlay(true);
    };

    // Race-condition guard: the browser may have already fired loadedmetadata or
    // canplay BEFORE this effect ran (React effects run after paint, not synchronously).
    // readyState >= 1 (HAVE_METADATA) means the event already fired — catch it here.
    if (media.readyState >= 1) {
      setCanPlay(true);
    }

    return () => {
      media.pause();
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
      media.onloadstart = null;
      media.onended = null;
      media.ontimeupdate = null;
      media.oncanplay = null;
      media.onloadedmetadata = null;
    };
  }, [src]);

  return {
    media: ref.current,
    ref,
    togglePlay,
    playing,
    progress,
    backward,
    forward,
    seek,
    canPlay,
    volume,
    isMuted,
    setVolumeLevel,
    toggleMute,
  };
}
