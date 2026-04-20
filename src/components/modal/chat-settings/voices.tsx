"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import denverIcon from "@/assets/image/voices/denver.jpg";
import sueIcon from "@/assets/image/voices/sue.jpg";
import josefIcon from "@/assets/image/voices/josef.jpg";
import hannahIcon from "@/assets/image/voices/hannah.jpg";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { previewGeminiChatVoice } from "@/lib/gemini-voice-preview";
import { cn } from "@/lib/utils";

/**
 * Gemini Live prebuilt `voice_name` values (via our API / Google) — genders match Google’s Chirp 3 HD table.
 * @see https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/configure-language-voice
 * @see https://cloud.google.com/text-to-speech/docs/chirp3-hd
 */
const voices = [
  { title: "Clara", subtitle: "Female · youthful", image: hannahIcon, voiceName: "Leda" },
  { title: "Vince", subtitle: "Male · gravelly", image: josefIcon, voiceName: "Algenib" },
  { title: "Skye", subtitle: "Female · bright", image: sueIcon, voiceName: "Zephyr" },
  { title: "Theo", subtitle: "Male · knowledgeable", image: denverIcon, voiceName: "Sadaltager" },
  { title: "Iris", subtitle: "Female · breezy", image: hannahIcon, voiceName: "Aoede" },
  { title: "Marcus", subtitle: "Male · informative", image: josefIcon, voiceName: "Rasalgethi" },
] as const;

const ALLOWED_VOICE_NAMES = new Set<string>(voices.map((v) => v.voiceName));

/** Legacy `voice_name` values we no longer surface — map to the new default. */
const LEGACY_VOICE_FALLBACK: Record<string, string> = {
  Kore: "Leda",
  Fenrir: "Rasalgethi",
  Orus: "Algenib",
  Puck: "Sadaltager",
  Charon: "Rasalgethi",
  Enceladus: "Sadaltager",
  Achird: "Sadaltager",
  Zubenelgenubi: "Rasalgethi",
};

function resolveSelectedVoice(saved?: string | null): string {
  if (saved && ALLOWED_VOICE_NAMES.has(saved)) return saved;
  if (saved && LEGACY_VOICE_FALLBACK[saved]) return LEGACY_VOICE_FALLBACK[saved];
  return "Algenib";
}

export default function Voices() {
  const { user, setUser } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const { trigger: fetchEphemeralToken } = useFetcher(endpoint.ephemeralToken, "get");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);

  const selectedVoice = useMemo(() => resolveSelectedVoice(user?.chat_voice), [user?.chat_voice]);

  const applyVoice = useCallback(
    async (voiceName: string): Promise<boolean> => {
      if (selectedVoice === voiceName) return true;
      try {
        await trigger({ chat_voice: voiceName });
        if (user) {
          setUser({ ...user, chat_voice: voiceName });
        }
        toast.success(`Voice changed to ${voices.find((v) => v.voiceName === voiceName)?.title}`);
        void mutate(endpoint.profile);
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Failed to update voice settings");
        return false;
      }
    },
    [selectedVoice, trigger, setUser, user],
  );

  const handleVoiceClick = useCallback(
    async (voiceName: string) => {
      if (isMutating) return;
      previewAbortRef.current?.abort();
      const ac = new AbortController();
      previewAbortRef.current = ac;
      setPreviewingVoice(voiceName);
      try {
        if (selectedVoice !== voiceName) {
          const saved = await applyVoice(voiceName);
          if (!saved) return;
        }
        await previewGeminiChatVoice({
          voiceName,
          fetchToken: async () => {
            const res = await fetchEphemeralToken();
            return (res?.data as { token?: string } | undefined)?.token;
          },
          signal: ac.signal,
        });
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        console.error(e);
        toast.error("Could not play voice sample");
      } finally {
        if (previewAbortRef.current === ac) {
          previewAbortRef.current = null;
        }
        setPreviewingVoice((v) => (v === voiceName ? null : v));
      }
    },
    [applyVoice, fetchEphemeralToken, isMutating, selectedVoice],
  );

  return (
    <div className="space-y-3">
      <p className="font-garamond text-xl font-medium text-v3-text-strong">AI Voice</p>
      <p className="font-inter text-xs leading-snug text-v3-text-weaker">
        Voices come from Google Gemini (same as live voice chat). Click a name to select your default; we play a
        short sample right after.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {voices.map(({ title, subtitle, image, voiceName }) => (
          <Button
            key={voiceName}
            type="button"
            variant="outline"
            className={cn(
              "h-auto min-h-[3.75rem] w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left",
              selectedVoice === voiceName
                ? "border-2 border-v3-text-strong bg-v3-fill-weaker text-v3-text-strong shadow-sm"
                : "border-v3-stroke-weak bg-v3-bg text-v3-text-strong hover:bg-v3-fill-weaker/90",
              isMutating && "pointer-events-none opacity-50",
            )}
            aria-busy={previewingVoice === voiceName}
            aria-pressed={selectedVoice === voiceName}
            onClick={() => void handleVoiceClick(voiceName)}
          >
            <img
              src={image}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover ring-1 ring-v3-stroke-weak"
              alt=""
            />
            <span className="grid min-w-0 flex-1 gap-0.5 text-left">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-inter text-sm font-semibold leading-tight">{title}</span>
                {previewingVoice === voiceName ? (
                  <Loader2 className="size-4 shrink-0 animate-spin stroke-[2] text-v3-text-weaker" aria-hidden />
                ) : null}
              </span>
              <span className="truncate font-inter text-xs text-v3-text-weaker">{subtitle}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
