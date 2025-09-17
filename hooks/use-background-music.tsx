"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useStore } from "./use-store";
import { toast } from "sonner";

// Audio files mapping
const audioFiles = [
  { title: "Moonlight", key: "moonlight", file: "/audio/moonlight.mp3" },
  { title: "Sea Waves", key: "seawaves", file: "/audio/seawaves.mp3" },
  { title: "Arkansas", key: "arkansas", file: "/audio/arkansas.mp3" },
  { title: "A love for life", key: "love", file: "/audio/love.mp3" }
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

const BackgroundMusicContext = createContext<BackgroundMusicContextType | null>(null);

export function BackgroundMusicProvider({ children }: PropsWithChildren) {
  const { user } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;

      // Add event listeners
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e)
      });
    }
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Auto-play when user has bg_music set (only on initial load)
  useEffect(() => {
    if (user?.bg_music && audioRef.current && !currentTrack) {
      const audioFile = audioFiles.find(audio => audio.key === user.bg_music);
      if (audioFile) {
        setCurrentTrack(user.bg_music);
        audioRef.current.src = audioFile.file;
        audioRef.current.load();
        // Auto-play when user has background music enabled
        audioRef.current.play().catch(() => {
          // Handle autoplay restrictions silently
          console.log("Autoplay blocked by browser - user can manually start music");
        });
      }
    } else if (!user?.bg_music && currentTrack) {
      // Stop music if user doesn't have bg_music set
      stopTrack();
    }
  }, [user?.bg_music]);

  const playTrack = useCallback((key: string) => {
    if (!audioRef.current) return;

    const audioFile = audioFiles.find(audio => audio.key === key);
    if (!audioFile) {
      toast.error("Audio file not found");
      return;
    }

    setCurrentTrack(key);
    audioRef.current.src = audioFile.file;
    audioRef.current.load();
    audioRef.current.play().catch((error) => {
      console.error('Play error:', error);
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
        console.error('Resume error:', error);
        toast.error("Failed to resume audio");
      });
    }
  }, []);

  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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
    audioFiles
  };

  return (
    <BackgroundMusicContext.Provider value={value}>
      {children}
    </BackgroundMusicContext.Provider>
  );
}

export const useBackgroundMusic = () => {
  const context = useContext(BackgroundMusicContext);
  if (!context) {
    throw new Error('useBackgroundMusic must be used within a BackgroundMusicProvider');
  }
  return context;
}; 