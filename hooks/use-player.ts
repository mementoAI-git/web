import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function usePlayer() {
  const ref = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false)
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    const media = ref.current;
    if (!media || !media.src) {
      toast("Media source is missing or not supported", { className: "!text-danger" })
      return;
    }
    if (!canPlay) return

    if (playing) {
      media.pause();
    } else {
      media.play();
    }
    setPlaying(!playing);
  };


  const forward = (seconds: number = 15) => {
    const media = ref.current;
    if (!media) return;

    const newTime = media.currentTime + seconds;
    media.currentTime = Math.min(newTime, media.duration);
  };

  const backward = (seconds: number = 15) => {
    const media = ref.current;
    if (!media || media.currentTime <= 0) return;

    const newTime = media.currentTime + seconds;
    media.currentTime = Math.max(newTime, 0);
  };

  useEffect(() => {
    const media = ref.current
    if (media) {
      media.onloadstart = () => {
        setCanPlay(false)
      }
      media.onended = () => {
        media.pause();
        media.currentTime = 0;

        setPlaying(false)
        setProgress(0)
      }

      media.ontimeupdate = () => {
        if (!media) return;
        const progressPercent = (media.currentTime / media.duration) * 100;
        setProgress(progressPercent);
      }
      ref.current.oncanplay = () => {
        setCanPlay(true)
      }
    }
    return () => {
      if (media) {
        media.onloadstart = null;
        media.onended = null;
        media.ontimeupdate = null;
        media.oncanplay = null;
      }
    };
  }, [ref])

  return {
    media: ref.current,
    ref,
    togglePlay,
    playing,
    progress,
    backward,
    forward,
    canPlay
  }
}