import endpoint from "@/api/endpoint";
import { getMementoClientHeaders } from "@/api/client-metadata";
import { authService } from "@/utility/auth-service";

export type PreviewElevenLabsVoiceParams = {
  voiceId: string;
  text?: string;
  signal?: AbortSignal;
  onFirstAudio?: (latencyMs: number) => void;
};

const PREVIEW_TIMEOUT_MS = 20_000;
const PREVIEW_PLAYBACK_CAP_MS = 6_000;

export async function previewElevenLabsVoice(params: PreviewElevenLabsVoiceParams): Promise<void> {
  const auth = authService.getAuthData();
  if (!auth?.access_token) {
    throw new Error("Missing auth token for ElevenLabs preview");
  }

  const startedAt = Date.now();
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint.aiVoicePreview}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getMementoClientHeaders(),
      Authorization: `Bearer ${auth.access_token}`,
    },
    body: JSON.stringify({
      provider: "elevenlabs",
      voice_id: params.voiceId,
      text: params.text,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error("ElevenLabs preview request failed");
  }

  const json = (await response.json()) as {
    data?: { audioBase64?: string; mimeType?: string; configured?: boolean };
  };
  if (json?.data?.configured === false) {
    throw new Error("ElevenLabs is not configured");
  }
  const audioBase64 = json?.data?.audioBase64;
  const mimeType = json?.data?.mimeType || "audio/mpeg";
  if (!audioBase64) throw new Error("Missing ElevenLabs preview audio");

  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  let resolved = false;
  const cleanup = () => {
    audio.pause();
    audio.src = "";
  };
  const finish = () => {
    if (resolved) return;
    resolved = true;
    cleanup();
  };

  const timeoutId = window.setTimeout(() => {
    finish();
  }, PREVIEW_TIMEOUT_MS);
  const capId = window.setTimeout(() => {
    finish();
  }, PREVIEW_PLAYBACK_CAP_MS);

  if (params.signal) {
    const onAbort = () => {
      finish();
    };
    params.signal.addEventListener("abort", onAbort, { once: true });
  }

  params.onFirstAudio?.(Date.now() - startedAt);
  await audio.play();
  await new Promise<void>((resolve) => {
    audio.onended = () => {
      finish();
      resolve();
    };
    audio.onerror = () => {
      finish();
      resolve();
    };
    window.setTimeout(() => {
      finish();
      resolve();
    }, PREVIEW_PLAYBACK_CAP_MS);
  });
  window.clearTimeout(timeoutId);
  window.clearTimeout(capId);
}
