"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { previewGeminiChatVoice } from "@/lib/gemini-voice-preview";
import { previewElevenLabsVoice } from "@/lib/elevenlabs-voice-preview";
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
  const [previewDebug, setPreviewDebug] = useState<
    Record<string, { firstAudioMs?: number; status?: "ok" | "error" | "timeout" }>
  >({});
  const previewAbortRef = useRef<AbortController | null>(null);
  const { data: geminiCatalog } = useSWR<{ data?: { voices?: VoiceEntry[]; configured?: boolean } }>(
    `${endpoint.aiVoices}?provider=gemini`,
  );
  const { data: elevenCatalog } = useSWR<{ data?: { voices?: VoiceEntry[]; configured?: boolean } }>(
    `${endpoint.aiVoices}?provider=elevenlabs`,
  );

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
      try {
        await trigger({ chat_voice: voiceName, chat_voice_provider: provider });
        if (user) {
          setUser({ ...user, chat_voice: voiceName, chat_voice_provider: provider });
        }
        toast.success(
          `Voice changed to ${dynamicVoices.find((v) => v.voiceName === voiceName)?.title} (${provider})`,
        );
        void mutate(endpoint.profile);
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Failed to update voice settings");
        return false;
      }
    },
    [selectedVoice, trigger, setUser, user, dynamicVoices],
  );

  const handleVoiceClick = useCallback(
    async (voiceName: string) => {
      previewAbortRef.current?.abort();
      const ac = new AbortController();
      previewAbortRef.current = ac;
      setPreviewingVoice(voiceName);
      try {
        const selected = dynamicVoices.find((v) => v.voiceName === voiceName);
        const provider = selected?.provider || "gemini";
        // Keep card behavior deterministic: select this voice first, then preview this exact voiceName.
        const saveOk = await applyVoice(voiceName, provider);
        if (!saveOk) return;

        await mutate(endpoint.profile);

        if (provider === "elevenlabs") {
          if (voiceName.startsWith("agent_")) {
            toast.success("Agent selected as default. Start a voice call to use this agent.");
          } else {
          await previewElevenLabsVoice({
            voiceId: voiceName,
            signal: ac.signal,
            onFirstAudio: (latencyMs) => {
              if (!import.meta.env.DEV) return;
              setPreviewDebug((prev) => ({
                ...prev,
                [voiceName]: { ...(prev[voiceName] || {}), firstAudioMs: latencyMs }
              }));
            },
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
            onFirstAudio: (latencyMs) => {
              if (!import.meta.env.DEV) return;
              setPreviewDebug((prev) => ({
                ...prev,
                [voiceName]: { ...(prev[voiceName] || {}), firstAudioMs: latencyMs }
              }));
            },
          });
        }
        if (import.meta.env.DEV) {
          setPreviewDebug((prev) => ({
            ...prev,
            [voiceName]: { ...(prev[voiceName] || {}), status: "ok" }
          }));
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        console.error(e);
        if (import.meta.env.DEV) {
          const msg = (e as Error)?.message || "";
          setPreviewDebug((prev) => ({
            ...prev,
            [voiceName]: {
              ...(prev[voiceName] || {}),
              status: /timed out/i.test(msg) ? "timeout" : "error"
            }
          }));
        }
        toast.error("Could not play voice sample");
      } finally {
        if (previewAbortRef.current === ac) {
          previewAbortRef.current = null;
        }
        setPreviewingVoice((v) => (v === voiceName ? null : v));
      }
    },
    [applyVoice, fetchEphemeralToken, dynamicVoices],
  );

  return (
    <div className="space-y-3">
      <p className="font-garamond text-xl font-medium text-v3-text-strong">AI Voice</p>
      <p className="font-inter text-xs leading-snug text-v3-text-weaker">
        Choose a voice. We preview it instantly and save it as your default.
      </p>
      {dynamicVoices.length === 0 ? (
        <p className="rounded-lg border border-v3-stroke-weak bg-v3-fill-weak px-3 py-2 text-xs text-v3-text-weaker">
          Voice catalog is unavailable right now. Please try again in a few seconds.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {dynamicVoices.map(({ title, subtitle, imageUrl, voiceName, gender, platform, client, style }) => (
          <Button
            key={voiceName}
            type="button"
            variant="outline"
            className={cn(
              "h-auto min-h-[3.75rem] w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left",
              selectedVoice === voiceName
                ? "border-2 border-v3-text-strong bg-v3-fill-weaker text-v3-text-strong shadow-sm"
                : "border-v3-stroke-weak bg-v3-bg text-v3-text-strong hover:bg-v3-fill-weaker/90",
              isMutating && "opacity-85",
            )}
            aria-busy={previewingVoice === voiceName}
            aria-pressed={selectedVoice === voiceName}
            onClick={() => void handleVoiceClick(voiceName)}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full object-cover ring-1 ring-v3-stroke-weak"
                alt={`${title} voice avatar`}
              />
            ) : (
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-v3-fill-weak text-xs font-semibold text-v3-text-weaker ring-1 ring-v3-stroke-weak">
                {title.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="grid min-w-0 flex-1 gap-0.5 text-left">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-inter text-sm font-semibold leading-tight">{title}</span>
                {previewingVoice === voiceName ? (
                  <Loader2 className="size-4 shrink-0 animate-spin stroke-[2] text-v3-text-weaker" aria-hidden />
                ) : null}
              </span>
              <span className="truncate font-inter text-xs text-v3-text-weaker">
                {(platform || "Unknown platform")}
                {client ? ` · ${client}` : ""}
              </span>
              <span className="truncate font-inter text-xs text-v3-text-weaker/90">
                {(gender || "unknown").toLowerCase()} · {(style || subtitle || "natural").toLowerCase()}
              </span>
              {import.meta.env.DEV ? (
                <span className="truncate font-inter text-[10px] text-v3-text-weaker/80">
                  {voiceName}
                  {previewDebug[voiceName]?.firstAudioMs != null
                    ? ` · ${previewDebug[voiceName]?.firstAudioMs}ms`
                    : ""}
                  {previewDebug[voiceName]?.status ? ` · ${previewDebug[voiceName]?.status}` : ""}
                </span>
              ) : null}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
