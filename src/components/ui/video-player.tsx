"use client";

import React, { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

function CustomSlider({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        "relative h-1 w-full cursor-pointer rounded-full bg-white/20",
        className,
      )}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        onChange(Math.min(Math.max(percentage, 0), 100));
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full rounded-full bg-white"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
}

export interface VideoPlayerProps {
  src: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
  className?: string;
  videoClassName?: string;
  controlsClassName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "none" | "metadata" | "auto";
  onError?: React.ReactEventHandler<HTMLVideoElement>;
}

export default function VideoPlayer({
  src,
  videoRef,
  className,
  videoClassName,
  controlsClassName,
  autoPlay = true,
  muted = false,
  loop = false,
  preload = "metadata",
  onError,
}: VideoPlayerProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoRef) {
      videoRef.current = localVideoRef.current;
    }
  }, [videoRef]);

  useEffect(() => {
    setIsPlaying(autoPlay);
    setVolume(muted ? 0 : 1);
    setIsMuted(muted);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [autoPlay, muted, src]);

  const togglePlay = () => {
    const video = localVideoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const handleVolumeChange = (value: number) => {
    const video = localVideoRef.current;
    if (!video) return;

    const newVolume = value / 100;
    video.muted = newVolume === 0;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleTimeUpdate = () => {
    const video = localVideoRef.current;
    if (!video) return;

    const nextDuration = isFinite(video.duration) ? video.duration : 0;
    const nextProgress = nextDuration > 0 ? (video.currentTime / nextDuration) * 100 : 0;
    setProgress(isFinite(nextProgress) ? nextProgress : 0);
    setCurrentTime(video.currentTime);
    setDuration(nextDuration);
  };

  const handleSeek = (value: number) => {
    const video = localVideoRef.current;
    if (!video || !video.duration) return;

    const time = (value / 100) * video.duration;
    if (!isFinite(time)) return;
    video.currentTime = time;
    setProgress(value);
  };

  const toggleMute = () => {
    const video = localVideoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      setVolume(0);
    } else {
      const nextVolume = volume > 0 ? volume : 1;
      video.volume = nextVolume;
      setVolume(nextVolume);
    }
  };

  const applySpeed = (speed: number) => {
    const video = localVideoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  return (
    <motion.div
      className={cn(
        "relative mx-auto w-full overflow-hidden rounded-xl bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => setShowControls(true)}
    >
      <video
        ref={localVideoRef}
        className={cn("w-full", videoClassName)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
        src={src}
        onError={onError}
        onClick={togglePlay}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        preload={preload}
        playsInline
      />

      <AnimatePresence>
        {(showControls || !isPlaying) && (
          <motion.div
            className={cn(
              "absolute right-0 bottom-0 left-0 mx-auto m-2 max-w-xl rounded-2xl bg-[#11111198] p-4 backdrop-blur-md",
              controlsClassName,
            )}
            initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-white">{formatTime(currentTime)}</span>
              <CustomSlider value={progress} onChange={handleSeek} className="flex-1" />
              <span className="text-sm text-white">{formatTime(duration)}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <Button
                    type="button"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-[#111111d1] hover:text-white"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </div>

                <div className="flex items-center gap-x-1">
                  <div>
                    <Button
                      type="button"
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-[#111111d1] hover:text-white"
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : volume > 0.5 ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <Volume1 className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  <div className="w-24">
                    <CustomSlider
                      value={isMuted ? 0 : volume * 100}
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <div key={speed}>
                    <Button
                      type="button"
                      aria-label={`Playback speed ${speed}x`}
                      aria-pressed={playbackSpeed === speed}
                      onClick={(e) => {
                        e.stopPropagation();
                        applySpeed(speed);
                      }}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "min-w-11 px-2 text-white hover:bg-[#111111d1] hover:text-white",
                        playbackSpeed === speed && "bg-[#111111d1]",
                      )}
                    >
                      {speed}x
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
