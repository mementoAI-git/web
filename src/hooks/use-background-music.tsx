"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { useStore } from "./use-store";
import { toast } from "sonner";

const audioFiles = [
  { title: "Moonlight", key: "moonlight", file: "/audio/moonlight.mp3" },
  { title: "Sea Waves", key: "seawaves", file: "/audio/seawaves.mp3" },
  { title: "Arkansas", key: "arkansas", file: "/audio/arkansas.mp3" },
  { title: "A love for life", key: "love", file: "/audio/love.mp3" },
];

interface BackgroundMusicContextType {
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
  setVolume: (volume: number) => void;
  playTrack: (key: string) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  audioFiles: typeof audioFiles;
}

const BackgroundMusicContext =
  createContext<BackgroundMusicContextType | null>(null);

export function BackgroundMusicProvider({ children }: PropsWithChildren) {
  const { user } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;

      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("error", () => {
        if (import.meta.env.DEV) {
          console.debug("Background audio failed to load or decode (expected if file missing or autoplay blocked).");
        }
      });
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (user?.bg_music && audioRef.current && !currentTrack) {
      const audioFile = audioFiles.find((audio) => audio.key === user.bg_music);
      if (audioFile) {
        setCurrentTrack(user.bg_music);
        audioRef.current.src = audioFile.file;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          console.log(
            "Autoplay blocked by browser - user can manually start music",
          );
        });
      }
    } else if (!user?.bg_music && currentTrack) {
      stopTrack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.bg_music]);

  const playTrack = useCallback((key: string) => {
    if (!audioRef.current) return;

    const audioFile = audioFiles.find((audio) => audio.key === key);
    if (!audioFile) {
      toast.error("Audio file not found");
      return;
    }

    setCurrentTrack(key);
    audioRef.current.src = audioFile.file;
    audioRef.current.load();
    audioRef.current.play().catch((error) => {
      console.error("Play error:", error);
      toast.error("Failed to play audio");
    });
  }, []);

  const pauseTrack = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resumeTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch((error) => {
        console.error("Resume error:", error);
        toast.error("Failed to resume audio");
      });
    }
  }, []);

  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const value: BackgroundMusicContextType = {
    isPlaying,
    currentTrack,
    volume,
    setVolume,
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    audioFiles,
  };

  return (
    <BackgroundMusicContext.Provider value={value}>
      {children}
    </BackgroundMusicContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBackgroundMusic = () => {
  const context = useContext(BackgroundMusicContext);
  if (!context) {
    throw new Error(
      "useBackgroundMusic must be used within a BackgroundMusicProvider",
    );
  }
  return context;
};

