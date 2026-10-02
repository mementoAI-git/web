import { useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import denverArtwork from "@/assets/image/voices/denver.jpg";
import hannahArtwork from "@/assets/image/voices/hannah.jpg";
import josefArtwork from "@/assets/image/voices/josef.jpg";
import sueArtwork from "@/assets/image/voices/sue.jpg";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";

export type VoiceProvider = "gemini" | "elevenlabs";

type VoiceApiEntry = {
  id?: string;
  title: string;
  subtitle?: string;
  gender?: string;
  voiceName: string;
  style?: string;
  imageUrl?: string;
};

export type VoiceModeVoice = VoiceApiEntry & {
  id: string;
  provider: VoiceProvider;
  artwork: string;
  metadata: string;
};

const artwork = [denverArtwork, sueArtwork, josefArtwork, hannahArtwork];

function isVoiceEntry(value: unknown): value is VoiceApiEntry {
  const entry = value as Partial<VoiceApiEntry>;
  return Boolean(entry && typeof entry.title === "string" && typeof entry.voiceName === "string");
}

function formatAttribute(value: string | undefined, fallback: string) {
  const text = (value || fallback).trim();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function normalizeVoice(entry: VoiceApiEntry, provider: VoiceProvider, index: number): VoiceModeVoice {
  const gender = formatAttribute(entry.gender, "Natural");
  const style = formatAttribute(entry.style || entry.subtitle, provider === "gemini" ? "Gemini" : "ElevenLabs");

  return {
    ...entry,
    id: entry.id || `${provider}-${entry.voiceName}`,
    provider,
    artwork: entry.imageUrl || artwork[index % artwork.length],
    metadata: `${gender} · ${style}`,
  };
}

export function formatVoiceSessionTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return hours > 0 ? `${hours.toString().padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function useVoiceModeVoices() {
  const { user, setUser } = useStore();
  const { trigger: updateProfile, isMutating } = useFetcher(endpoint.profile, "put");
  const { data: geminiCatalog } = useSWR<{ data?: { voices?: VoiceApiEntry[] } }>(
    `${endpoint.aiVoices}?provider=gemini`,
  );
  const { data: elevenLabsCatalog } = useSWR<{ data?: { voices?: VoiceApiEntry[] } }>(
    `${endpoint.aiVoices}?provider=elevenlabs`,
  );

  const voices = useMemo(() => {
    const gemini = (geminiCatalog?.data?.voices || [])
      .filter(isVoiceEntry)
      .filter((voice) => voice.voiceName !== "Fenrir")
      .map((voice, index) => normalizeVoice(voice, "gemini", index));
    const elevenLabs = (elevenLabsCatalog?.data?.voices || [])
      .filter(isVoiceEntry)
      .map((voice, index) => normalizeVoice(voice, "elevenlabs", index + gemini.length));

    return elevenLabs.length > 0 ? [...elevenLabs.slice(0, 3), ...gemini.slice(0, 3)] : gemini.slice(0, 6);
  }, [elevenLabsCatalog?.data?.voices, geminiCatalog?.data?.voices]);

  const selectedVoice = useMemo(() => {
    return (
      voices.find(
        (voice) =>
          voice.voiceName === user?.chat_voice &&
          voice.provider === (user?.chat_voice_provider || "gemini"),
      ) || voices[0] || null
    );
  }, [user?.chat_voice, user?.chat_voice_provider, voices]);

  const saveVoice = useCallback(
    async (voice: VoiceModeVoice) => {
      if (
        user?.chat_voice === voice.voiceName &&
        (user.chat_voice_provider || "gemini") === voice.provider
      ) {
        return true;
      }

      try {
        await updateProfile({
          chat_voice: voice.voiceName,
          chat_voice_provider: voice.provider,
        });
        if (user) {
          setUser?.({
            ...user,
            chat_voice: voice.voiceName,
            chat_voice_provider: voice.provider,
          });
        }
        void mutate(endpoint.profile);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    [setUser, updateProfile, user],
  );

  return { voices, selectedVoice, saveVoice, isSaving: isMutating };
}
