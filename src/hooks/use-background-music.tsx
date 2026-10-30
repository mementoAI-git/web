"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { IResponse } from "@/api/interface";
import { useStore } from "./use-store";
import { toast } from "sonner";

interface BackgroundTrack {
  title: string;
  key: string;
  file: string;
}

/** Used until the API catalog loads, or when the API predates it. */
const bundledAudioFiles: BackgroundTrack[] = [
  { title: "Moonlight", key: "moonlight", file: "/audio/moonlight.mp3" },
  { title: "Sea Waves", key: "seawaves", file: "/audio/seawaves.mp3" },
  { title: "Arkansas", key: "arkansas", file: "/audio/arkansas.mp3" },
  { title: "A love for life", key: "love", file: "/audio/love.mp3" },
];

type CatalogTrack = { key?: unknown; title?: unknown; url?: unknown };

function catalogTracks(response?: IResponse<CatalogTrack[]>): BackgroundTrack[] | null {
  if (!Array.isArray(response?.data)) return null;
  const tracks = response.data.flatMap(({ key, title, url }) =>
    typeof key === "string" && typeof title === "string" && typeof url === "string"
      ? [{ key, title, file: url }]
      : [],
  );
  return tracks.length ? tracks : null;
}

interface BackgroundMusicContextType {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrack: string | null;
  volume: number;
  setVolume: (volume: number) => void;
  playTrack: (key: string) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  audioFiles: BackgroundTrack[];
}

const BackgroundMusicContext =
  createContext<BackgroundMusicContextType | null>(null);

export function BackgroundMusicProvider({ children }: PropsWithChildren) {
  const { user } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const account = useRef(user?._id);
  const attempt = useRef(0);
  const failed = useRef(false);
  const playbackRequested = useRef(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const { data: catalog } = useSWR<IResponse<CatalogTrack[]>>(
    user?._id ? endpoint.backgroundMusic : null,
    { revalidateOnFocus: false },
  );
  const audioFiles = useMemo(() => catalogTracks(catalog) ?? bundledAudioFiles, [catalog]);

  const failPlayback = useCallback(() => {
    // Loading a saved preference or clearing the source is not a playback attempt.
    if (!playbackRequested.current) return;
    playbackRequested.current = false;
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsBuffering(false);
    if (failed.current) return;
    failed.current = true;
    toast.error("Couldn’t play this track. Try playing it again or choose another track.");
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.loop = true;
    audio.volume = 0.5;
    const playing = () => { setIsPlaying(true); setIsBuffering(false); };
    const waiting = () => { setIsPlaying(false); setIsBuffering(true); };
    const paused = () => { setIsPlaying(false); setIsBuffering(false); };
    audio.addEventListener("playing", playing);
    audio.addEventListener("waiting", waiting);
    audio.addEventListener("pause", paused);
    audio.addEventListener("ended", paused);
    audio.addEventListener("error", failPlayback);
    return () => {
      // Invalidate pending play promises when this audio instance is disposed.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      attempt.current++;
      audio.removeEventListener("playing", playing);
      audio.removeEventListener("waiting", waiting);
      audio.removeEventListener("pause", paused);
      audio.removeEventListener("ended", paused);
      audio.removeEventListener("error", failPlayback);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [failPlayback]);

  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++attempt.current;
    playbackRequested.current = true;
    failed.current = false;
    setIsBuffering(true);
    setIsPlaying(false);
    audio.play().catch(() => { if (request === attempt.current) failPlayback(); });
  }, [failPlayback]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const changedAccount = account.current !== user?._id;
    account.current = user?._id;
    if (changedAccount) stopTrack();
    if (user?.bg_music && audioRef.current && (!currentTrack || changedAccount)) {
      const audioFile = audioFiles.find((audio) => audio.key === user.bg_music);
      if (audioFile) {
        setCurrentTrack(user.bg_music);
        audioRef.current.src = audioFile.file;
        audioRef.current.load();
      }
    } else if (!user?.bg_music && currentTrack) {
      stopTrack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.bg_music]);

  // When the API catalog arrives, point an idle restored track at its server URL.
  useEffect(() => {
    const audio = audioRef.current;
    const file = audioFiles.find((track) => track.key === currentTrack)?.file;
    if (!audio || !file || !audio.paused || playbackRequested.current) return;
    if (audio.src === file || audio.src.endsWith(file)) return;
    audio.src = file;
    audio.load();
  }, [audioFiles, currentTrack]);

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
    startPlayback();
  }, [audioFiles, startPlayback]);

  const pauseTrack = useCallback(() => {
    attempt.current++;
    playbackRequested.current = false;
    setIsBuffering(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resumeTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      if (audioRef.current.error) audioRef.current.load();
      startPlayback();
    }
  }, [startPlayback]);

  const stopTrack = useCallback(() => {
    attempt.current++;
    playbackRequested.current = false;
    setIsBuffering(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, []);

  const value: BackgroundMusicContextType = {
    isPlaying,
    isBuffering,
    currentTrack,
    volume,
    setVolume: (value) => setVolume(Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 50),
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
