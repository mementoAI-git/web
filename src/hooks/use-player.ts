import { useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";

type MediaElement = HTMLAudioElement | HTMLVideoElement;

export default function usePlayer({
  src,
  externalRef,
}: {
  src: string;
  externalRef?: RefObject<MediaElement>;
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

  useEffect(() => {
    const media = ref.current;
    if (!media) return () => undefined;

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    media.addEventListener("play", handlePlay);
    media.addEventListener("pause", handlePause);

    return () => {
      media.removeEventListener("play", handlePlay);
      media.removeEventListener("pause", handlePause);
    };
  }, []);

  const forward = (seconds: number = 15) => {
    const media = ref.current;
    if (!media) return;
    media.currentTime = Math.min(
      media.currentTime + seconds,
      media.duration || 0,
    );
  };

  const backward = (seconds: number = -15) => {
    const media = ref.current;
    if (!media) return;
    media.currentTime = Math.max(media.currentTime + seconds, 0);
  };

  const seek = (seconds: number) => {
    const media = ref.current;
    if (!media) return;
    media.currentTime = Math.max(Math.min(seconds, media.duration || 0), 0);
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

    // const media = ref.current;
    // if (!media) return;

    return () => {
      const media = ref.current;
      if (media) {
        media.pause();
        media.removeAttribute("src");
        media.load();
      }
    };
  }, [src]);

  useEffect(() => {
    const media = ref.current;
    if (!media) {
      return () => undefined;
    }

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
      if (!media || !media.duration) return;
      const progressPercent = (media.currentTime / media.duration) * 100;
      setProgress(progressPercent);
    };

    // media.oncanplay = () => {
    //   setCanPlay(true);
    // };

    media.onloadedmetadata = () => {
      setCanPlay(true);
    };

    return () => {
      media.onloadstart = null;
      media.onended = null;
      media.ontimeupdate = null;
      // media.oncanplay = null;
      media.onloadedmetadata = null;
    };
  }, []);

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
