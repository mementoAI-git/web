"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import useSWR from "swr";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { previewGeminiChatVoice } from "@/lib/gemini-voice-preview";
import { previewElevenLabsVoice } from "@/lib/elevenlabs-voice-preview";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { cn } from "@/lib/utils";
type VoiceEntry = {
  id: string;
  title: string;
  subtitle: string;
  gender: string;
  voiceName: string;
  platform?: string;
  client?: string;
  style?: string;
  talkToUrl?: string;
  imageUrl?: string;
};

type VoiceProvider = "gemini" | "elevenlabs";
type ProviderVoiceEntry = VoiceEntry & { provider: VoiceProvider };

function formatVoiceAttribute(value: string | undefined, fallback: string) {
  const text = (value || fallback).trim();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function isVoiceEntry(value: unknown): value is VoiceEntry {
  const v = value as Partial<VoiceEntry>;
  return !!v && typeof v.title === "string" && typeof v.voiceName === "string";
}

/** Legacy `voice_name` values we no longer surface — map to the new default. */
const LEGACY_VOICE_FALLBACK: Record<string, string> = {
  Zephyr: "Aoede",
  Sadaltager: "Fenrir",
  Rasalgethi: "Puck",
  Algenib: "Orus",
  Achird: "Puck",
  Zubenelgenubi: "Puck",
};

export default function Voices() {
  const { user, setUser } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const { trigger: fetchEphemeralToken } = useFetcher(endpoint.ephemeralToken, "get");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const savingRef = useRef(false);
  const previewAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => previewAbortRef.current?.abort(), []);
  const { data: geminiCatalog, error: geminiError, isLoading: geminiLoading, isValidating: geminiValidating, mutate: refreshGemini } = useSWR<{ data?: { voices?: VoiceEntry[]; configured?: boolean } }>(
    `${endpoint.aiVoices}?provider=gemini`,
    { shouldRetryOnError: false },
  );
  const { data: elevenCatalog, error: elevenError, isLoading: elevenLoading, isValidating: elevenValidating, mutate: refreshEleven } = useSWR<{ data?: { voices?: VoiceEntry[]; configured?: boolean } }>(
    `${endpoint.aiVoices}?provider=elevenlabs`,
    { shouldRetryOnError: false },
  );

  const retryGemini = useRequestRecovery("voices-gemini", geminiError, refreshGemini, "Some voices couldn’t load. Please try again.");
  const retryEleven = useRequestRecovery("voices-elevenlabs", elevenError, refreshEleven, "Some voices couldn’t load. Please try again.");
  const catalogLoading = geminiLoading || elevenLoading;
  const catalogError = geminiError || elevenError;
  const retryCatalogs = () => {
    if (geminiError) retryGemini();
    if (elevenError) retryEleven();
  };

  const dynamicVoices = useMemo<ProviderVoiceEntry[]>(() => {
    const geminiVoices = (geminiCatalog?.data?.voices || [])
      .filter(isVoiceEntry)
      .filter((v) => v.voiceName !== "Fenrir")
      .map((v) => ({
        ...v,
        provider: "gemini" as const,
      }));
    const elevenVoices = (elevenCatalog?.data?.voices || []).filter(isVoiceEntry).map((v) => ({
      ...v,
      provider: "elevenlabs" as const,
    }));

    // Keep the UI simple: always present 6 choices in one list.
    if (elevenVoices.length > 0) {
      return [...elevenVoices.slice(0, 3), ...geminiVoices.slice(0, 3)];
    }
    return geminiVoices.slice(0, 6);
  }, [geminiCatalog?.data?.voices, elevenCatalog?.data?.voices]);

  const allowedVoiceNames = useMemo(
    () => new Set<string>(dynamicVoices.map((v) => v.voiceName)),
    [dynamicVoices],
  );

  const selectedVoice = useMemo(() => {
    const saved = user?.chat_voice;
    // Always trust the live catalog first; only apply legacy remap for unknown historic values.
    if (saved && allowedVoiceNames.has(saved)) return saved;
    const resolved = saved && LEGACY_VOICE_FALLBACK[saved] ? LEGACY_VOICE_FALLBACK[saved] : saved;
    if (resolved && allowedVoiceNames.has(resolved)) return resolved;
    const first = dynamicVoices[0]?.voiceName;
    return first || "Fenrir";
  }, [user?.chat_voice, allowedVoiceNames, dynamicVoices]);

  const applyVoice = useCallback(
    async (voiceName: string, provider: VoiceProvider): Promise<boolean> => {
      if (selectedVoice === voiceName && (user?.chat_voice_provider || "gemini") === provider) return true;
      savingRef.current = true;
      try {
        await trigger({ chat_voice: voiceName, chat_voice_provider: provider });
        if (user) {
          setUser({ ...user, chat_voice: voiceName, chat_voice_provider: provider });
        }
        toast.success(
          `Voice changed to ${dynamicVoices.find((v) => v.voiceName === voiceName)?.title} (${provider})`,
        );
        void Promise.resolve(mutate(endpoint.profile)).catch(() => undefined);
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Failed to update voice settings");
        return false;
      } finally {
        savingRef.current = false;
      }
    },
    [selectedVoice, trigger, setUser, user, dynamicVoices],
  );

  const handleVoiceClick = useCallback(
    async (voiceName: string) => {
      if (savingRef.current) return;
      previewAbortRef.current?.abort();
      const ac = new AbortController();
      previewAbortRef.current = ac;
      setPreviewingVoice(voiceName);
      try {
        const selected = dynamicVoices.find((v) => v.voiceName === voiceName);
        const provider = selected?.provider || "gemini";
        // Keep card behavior deterministic: select this voice first, then preview this exact voiceName.
        const saveOk = await applyVoice(voiceName, provider);
        if (!saveOk || ac.signal.aborted) return;

        if (provider === "elevenlabs") {
          if (voiceName.startsWith("agent_")) {
            toast.success("Agent selected as default. Start a voice call to use this agent.");
          } else {
          await previewElevenLabsVoice({
            voiceId: voiceName,
            signal: ac.signal,
          });
          }
        } else {
          await previewGeminiChatVoice({
            voiceName,
            fetchToken: async () => {
              const res = await fetchEphemeralToken();
              return (res?.data as { token?: string } | undefined)?.token;
            },
            signal: ac.signal,
          });
        }
      } catch (e: unknown) {
        if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) {
          return;
        }
        console.error(e);
        toast.error("Could not play voice sample");
      } finally {
        if (previewAbortRef.current === ac) {
          previewAbortRef.current = null;
          setPreviewingVoice(null);
        }
      }
    },
    [applyVoice, fetchEphemeralToken, dynamicVoices],
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">AI Voice (Voice Mode)</h2>
      {catalogLoading ? (
        <p role="status" className="text-sm text-text-neutral-weak">Loading voices…</p>
      ) : null}
      {!catalogLoading && !catalogError && dynamicVoices.length === 0 ? (
        <p className="text-sm text-text-neutral-weak">No voices are available to choose right now.</p>
      ) : null}
      {catalogError ? (
        <Button variant="outline" onClick={retryCatalogs} disabled={Boolean(geminiValidating || elevenValidating)}>
          {geminiValidating || elevenValidating ? "Retrying…" : "Retry loading voices"}
        </Button>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {dynamicVoices.map(({ title, subtitle, imageUrl, voiceName, gender, style }) => (
          <Button
            key={voiceName}
            type="button"
            variant="outline"
            className={cn(
              "relative h-auto min-h-16 w-full justify-start gap-3 rounded-xl px-3 py-3.5 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
              selectedVoice === voiceName
                ? "border-stroke-brand-strong bg-background text-text-neutral-strong"
                : "border-stroke-neutral-weak bg-background text-text-neutral-strong hover:bg-fill-neutral-weaker",
              isMutating && "opacity-85",
            )}
            disabled={isMutating}
            aria-busy={previewingVoice === voiceName}
            aria-pressed={selectedVoice === voiceName}
            onClick={() => void handleVoiceClick(voiceName)}
          >
            <Avatar>
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={`${title} voice avatar`} />
              ) : null}
              <AvatarFallback className="font-geist text-xs font-semibold">
                {title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="grid min-w-0 flex-1 text-left">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-inter text-sm font-semibold leading-tight">{title}</span>
                {previewingVoice === voiceName ? (
                  <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none stroke-[2] text-text-neutral-weaker" aria-hidden />
                ) : null}
              </span>
              <span className="truncate font-geist text-xs leading-4 text-text-neutral-weak">
                {formatVoiceAttribute(gender, "Unknown")} ·{" "}
                {formatVoiceAttribute(style || subtitle, "Natural")}
              </span>
            </span>
            {selectedVoice === voiceName ? (
              <CheckCircle2 className="absolute right-1.5 top-1.5 fill-fill-brand-strong text-text-inverse-strong" aria-hidden />
            ) : null}
          </Button>
        ))}
      </div>
    </div>
  );
}
