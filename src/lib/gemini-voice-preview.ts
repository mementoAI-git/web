import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import { GEMINI_CONFIG } from "@/hooks/use-live-api/config";
import {
  createPlaybackState,
  scheduleGeminiLivePcmChunk,
  stopAllGeminiLivePlayback,
  waitGeminiLivePlaybackTail,
} from "@/hooks/use-live-api/playback";
import { pickRandomVoicePreviewPassage } from "@/lib/voice-preview-passages";

const VOICE_PREVIEW_SYSTEM_INSTRUCTION = `You are reading a short passage from classic literature aloud for a voice demonstration. Read naturally: varied pacing, light emotional colour where the text invites it, as if you are reading from a well-loved book—not robotic, not like a commercial. Do not greet anyone, do not mention apps, settings, or "samples", and do not add lines that are not in the user's text. Speak only the words the user sends.`;

const PREVIEW_SESSION_TIMEOUT_MS = 20_000;

function getAudioContextCtor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export type PreviewGeminiChatVoiceParams = {
  voiceName: string;
  fetchToken: () => Promise<string | null | undefined>;
  /** Cancels an in-flight preview (e.g. user picked another voice). */
  signal?: AbortSignal;
};

/**
 * Opens a short Gemini Live session with the same native-audio model and voice as voice mode,
 * sends one text turn, plays returned PCM through Web Audio, then tears down.
 */
export async function previewGeminiChatVoice(params: PreviewGeminiChatVoiceParams): Promise<void> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) {
    throw new Error("Web Audio API is not available");
  }

  const token = (await params.fetchToken())?.trim();
  if (!token) {
    throw new Error("Missing voice preview token");
  }

  const audioContext = new Ctor({ sampleRate: 24_000 });
  const gain = audioContext.createGain();
  gain.gain.value = 1;
  gain.connect(audioContext.destination);
  const state = createPlaybackState(audioContext);

  let session: Session | null = null;
  let cleaned = false;

  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    stopAllGeminiLivePlayback(state);
    try {
      session?.close();
    } catch {
      /* noop */
    }
    session = null;
    try {
      gain.disconnect();
    } catch {
      /* noop */
    }
    await audioContext.close().catch(() => {});
  };

  let resolveTurn!: () => void;
  const turnCompletePromise = new Promise<void>((resolve) => {
    resolveTurn = resolve;
  });

  let timeoutId = 0;

  let rejectAbort!: (e: Error) => void;
  const abortPromise = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });

  const onExternalAbort = () => {
    try {
      session?.close();
    } catch {
      /* noop */
    }
    stopAllGeminiLivePlayback(state);
    rejectAbort(new DOMException("Aborted", "AbortError"));
  };

  const client = new GoogleGenAI({
    apiKey: token,
    httpOptions: { apiVersion: "v1alpha" },
  });

  try {
    if (params.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    if (params.signal) {
      params.signal.addEventListener("abort", onExternalAbort);
    }

    await audioContext.resume();

    const sessionPromise = client.live.connect({
      model: GEMINI_CONFIG.MODEL,
      callbacks: {
        onmessage: async (message: LiveServerMessage) => {
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              const data = part.inlineData?.data;
              if (data) {
                try {
                  await scheduleGeminiLivePcmChunk(data, audioContext, gain, state);
                } catch (e) {
                  console.error("Voice preview chunk failed:", e);
                }
              }
            }
          }
          if (message.serverContent?.turnComplete) {
            resolveTurn();
          }
        },
        onerror: () => {
          resolveTurn();
        },
        onclose: () => {
          resolveTurn();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: VOICE_PREVIEW_SYSTEM_INSTRUCTION,
        speechConfig: {
          languageCode: "en-US",
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: params.voiceName,
            },
          },
        },
        outputAudioTranscription: {
          languageCode: "en-US",
        },
      },
    });

    session = await sessionPromise;

    if (params.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const previewPassage = pickRandomVoicePreviewPassage();
    session.sendClientContent({
      turns: [{ role: "user", parts: [{ text: previewPassage }] }],
      turnComplete: true,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("Voice preview timed out")),
        PREVIEW_SESSION_TIMEOUT_MS,
      );
    });

    const racers: Promise<unknown>[] = [turnCompletePromise, timeoutPromise];
    if (params.signal) {
      racers.push(abortPromise);
    }
    await Promise.race(racers);

    await waitGeminiLivePlaybackTail(audioContext, state);
  } catch (e) {
    throw e;
  } finally {
    if (params.signal) {
      params.signal.removeEventListener("abort", onExternalAbort);
    }
    window.clearTimeout(timeoutId);
    await cleanup();
  }
}
