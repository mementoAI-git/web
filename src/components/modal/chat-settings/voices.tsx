"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import useSWR from "swr";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoiceAvatar } from "@/components/voice-avatar";
import { getMobileVoiceChoices, getMobileVoiceDefinition } from "@/features/voice/mobile-voice-catalog";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { previewGeminiChatVoice, type VoicePreviewToken } from "@/lib/gemini-voice-preview";
import { previewElevenLabsVoice } from "@/lib/elevenlabs-voice-preview";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useVoicePreviewClip } from "@/components/Chatinput/use-voice-preview-clip";
import { preloadVoicePreviewClips } from "@/lib/voice-preview-clips";
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
type ProviderVoiceEntry = VoiceEntry & { provider: VoiceProvider; artwork: string };

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

function VoiceDetails({ voice, previewing }: {
  voice: { artwork: string; title: string; subtitle: string };
  previewing: boolean;
}) {
  return (
    <>
      <VoiceAvatar artwork={voice.artwork} title={voice.title} />
      <span className="grid min-w-0 flex-1 text-left">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-inter text-sm font-semibold leading-tight text-text-neutral-strong">{voice.title}</span>
          {previewing ? (
            <Loader2 className="size-4 shrink-0 animate-spin stroke-[2] text-text-neutral-weaker motion-reduce:animate-none" aria-hidden />
          ) : null}
        </span>
        <span className="truncate font-geist text-xs leading-4 text-text-neutral-weaker">{voice.subtitle}</span>
      </span>
    </>
  );
}

export default function Voices() {
  const { user, setUser } = useStore();
  const { trigger } = useFetcher(endpoint.profile, "put");
  const { trigger: fetchEphemeralToken } = useFetcher(endpoint.ephemeralToken, "get");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  /** Shown as selected straight away, ahead of its save finishing. */
  const [chosenVoice, setChosenVoice] = useState<string | null>(null);
  const { play: playClip, failed: clipFailed } = useVoicePreviewClip();
  const savingRef = useRef(false);
  const previewAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => previewAbortRef.current?.abort(), []);
  const { data: geminiCatalog, error: geminiError, isLoading: geminiLoading, isValidating: geminiValidating, mutate: refreshGemini } = useSWR<{ data?: { voices?: VoiceEntry[]; configured?: boolean } }>(
    `${endpoint.aiVoices}?provider=gemini`,
    { shouldRetryOnError: false },
  );
  const retryGemini = useRequestRecovery("voices-gemini", geminiError, refreshGemini, "Some voices couldn’t load. Please try again.");
  const catalogLoading = geminiLoading;
  const catalogError = geminiError;
  const retryCatalogs = () => { if (geminiError) retryGemini(); };
  const dynamicVoices = useMemo<ProviderVoiceEntry[]>(() =>
    getMobileVoiceChoices((geminiCatalog?.data?.voices || []).filter(isVoiceEntry)),
    [geminiCatalog?.data?.voices],
  );

  const allowedVoiceNames = useMemo(
    () => new Set<string>(dynamicVoices.map((v) => v.voiceName)),
    [dynamicVoices],
  );

  const selectedVoice = useMemo(() => {
    if (chosenVoice) return chosenVoice;
    const saved = getMobileVoiceDefinition(user?.chat_voice)?.voiceName || user?.chat_voice;
    // Always trust the live catalog first; only apply legacy remap for unknown historic values.
    if (saved && allowedVoiceNames.has(saved)) return saved;
    const resolved = saved && LEGACY_VOICE_FALLBACK[saved] ? LEGACY_VOICE_FALLBACK[saved] : saved;
    if (resolved && allowedVoiceNames.has(resolved)) return resolved;
    const first = dynamicVoices[0]?.voiceName;
    return first || "Fenrir";
  }, [chosenVoice, user?.chat_voice, allowedVoiceNames, dynamicVoices]);

  const userRef = useRef(user);
  userRef.current = user;
  const nextSaveRef = useRef<{ voiceName: string; provider: VoiceProvider } | null>(null);

  // Trying voices quickly saves only the latest one, once the save in progress is done.
  const saveVoice = useCallback(
    async (voiceName: string, provider: VoiceProvider) => {
      const saved = getMobileVoiceDefinition(userRef.current?.chat_voice)?.voiceName || userRef.current?.chat_voice;
      nextSaveRef.current = { voiceName, provider };
      if (savingRef.current) return;
      if (saved === voiceName && (userRef.current?.chat_voice_provider || "gemini") === provider) {
        nextSaveRef.current = null;
        setChosenVoice(null);
        return;
      }
      savingRef.current = true;
      try {
        while (nextSaveRef.current) {
          const next = nextSaveRef.current;
          nextSaveRef.current = null;
          await trigger({ chat_voice: next.voiceName, chat_voice_provider: next.provider });
          if (userRef.current) {
            setUser({ ...userRef.current, chat_voice: next.voiceName, chat_voice_provider: next.provider });
          }
        }
        void Promise.resolve(mutate(endpoint.profile)).catch(() => undefined);
      } catch (error) {
        console.error(error);
        nextSaveRef.current = null;
        toast.error("Failed to update voice settings");
      } finally {
        savingRef.current = false;
        setChosenVoice(null);
      }
    },
    [trigger, setUser],
  );

  /** For a voice with no bundled clip, which has to be generated live and takes a few seconds. */
  const playLiveSample = useCallback(
    async (voiceName: string, provider: VoiceProvider) => {
      const ac = new AbortController();
      previewAbortRef.current = ac;
      setPreviewingVoice(voiceName);
      try {
        if (provider === "elevenlabs") {
          if (voiceName.startsWith("agent_")) {
            toast.success("Agent selected as default. Start a voice call to use this agent.");
          } else {
            await previewElevenLabsVoice({ voiceId: voiceName, signal: ac.signal });
          }
        } else {
          await previewGeminiChatVoice({
            voiceName,
            fetchToken: async () => {
              const res = await fetchEphemeralToken();
              return res?.data as VoicePreviewToken | undefined;
            },
            signal: ac.signal,
          });
        }
      } catch (e: unknown) {
        if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
        console.error(e);
        toast.error("Could not play voice sample");
      } finally {
        if (previewAbortRef.current === ac) {
          previewAbortRef.current = null;
          setPreviewingVoice(null);
        }
      }
    },
    [fetchEphemeralToken],
  );

  const handleVoiceClick = useCallback(
    (voiceName: string) => {
      const voice = dynamicVoices.find((v) => v.voiceName === voiceName);
      const provider = voice?.provider || "gemini";
      setChosenVoice(voiceName);
      previewAbortRef.current?.abort();
      // Starts within the click, and doesn't wait for the save.
      if (!voice || !playClip(voice.id)) void playLiveSample(voiceName, provider);
      void saveVoice(voiceName, provider);
    },
    [dynamicVoices, playClip, playLiveSample, saveVoice],
  );

  useEffect(() => {
    if (clipFailed) toast.error("Could not play voice sample");
  }, [clipFailed]);

  const current = dynamicVoices.find((voice) => voice.voiceName === selectedVoice) ?? dynamicVoices[0];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-geist text-sm font-medium leading-5 text-text-neutral-strong">Select voice</h3>
      {catalogLoading ? (
        <p role="status" className="text-sm text-text-neutral-weak">Loading voices…</p>
      ) : null}
      {!catalogLoading && !catalogError && dynamicVoices.length === 0 ? (
        <p className="text-sm text-text-neutral-weak">No voices are available to choose right now.</p>
      ) : null}
      {catalogError ? (
        <Button variant="outline" onClick={retryCatalogs} disabled={Boolean(geminiValidating)}>
          {geminiValidating ? "Retrying…" : "Retry loading voices"}
        </Button>
      ) : null}
      {current ? (
        // A menu rather than a select, because picking the current voice replays its sample.
        <DropdownMenu modal={false} onOpenChange={(open) => { if (open) preloadVoicePreviewClips(); }}>
          <DropdownMenuTrigger
            aria-busy={Boolean(previewingVoice)}
            aria-label={`Select voice: ${current.title}, ${current.subtitle}`}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-stroke-neutral-weak bg-background py-1.5 pl-3 pr-3 text-left text-text-neutral-strong outline-none transition-colors hover:bg-fill-neutral-weaker focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-fill-neutral-weaker motion-reduce:transition-none"
          >
            <VoiceDetails voice={current} previewing={previewingVoice === current.voiceName} />
            <ChevronDown className="size-4 shrink-0 text-icon-neutral-weak" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent aria-label="Voices" className="z-[230] font-rounded [--font-geist:var(--font-rounded)] [--font-inter:var(--font-rounded)]">
            {dynamicVoices.map((voice) => (
              <DropdownMenuItem
                key={voice.voiceName}
                role="menuitemradio"
                aria-checked={selectedVoice === voice.voiceName}
                className="cursor-pointer gap-3 py-1.5 focus:bg-fill-neutral-weaker focus:text-text-neutral-strong"
                onSelect={(event) => {
                  // Stays open, so every voice can be tried in turn.
                  event.preventDefault();
                  handleVoiceClick(voice.voiceName);
                }}
              >
                <VoiceDetails voice={voice} previewing={previewingVoice === voice.voiceName} />
                {selectedVoice === voice.voiceName ? (
                  <CheckCircle2 className="size-4 shrink-0 text-text-brand-strong" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
