import { decode, decodeAudioData } from "./utils";

/** Gemini Live native audio output uses mono PCM at 24 kHz in this app. */
export const GEMINI_LIVE_OUTPUT_SAMPLE_RATE = 24_000;
export const GEMINI_LIVE_OUTPUT_CHANNELS = 1;

export type GeminiLivePlaybackState = {
  nextStartTime: number;
  sources: Set<AudioBufferSourceNode>;
};

export function createPlaybackState(audioContext: AudioContext): GeminiLivePlaybackState {
  return {
    nextStartTime: audioContext.currentTime,
    sources: new Set(),
  };
}

/**
 * Decode a base64 PCM chunk from Gemini Live and schedule it on the Web Audio graph.
 */
export async function scheduleGeminiLivePcmChunk(
  base64Pcm: string,
  outputAudioContext: AudioContext,
  destination: AudioNode,
  state: GeminiLivePlaybackState,
): Promise<void> {
  state.nextStartTime = Math.max(state.nextStartTime, outputAudioContext.currentTime);
  const audioBuffer = await decodeAudioData(
    decode(base64Pcm),
    outputAudioContext,
    GEMINI_LIVE_OUTPUT_SAMPLE_RATE,
    GEMINI_LIVE_OUTPUT_CHANNELS,
  );
  const source = outputAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(destination);
  source.addEventListener("ended", () => {
    state.sources.delete(source);
  });
  source.start(state.nextStartTime);
  state.nextStartTime += audioBuffer.duration;
  state.sources.add(source);
}

/** Stop all scheduled / playing chunks and reset the timeline cursor (matches live interrupt behavior). */
export function stopAllGeminiLivePlayback(state: GeminiLivePlaybackState): void {
  for (const source of state.sources) {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
    state.sources.delete(source);
  }
  state.nextStartTime = 0;
}

/** Wait until queued buffers should have finished playing. */
export function waitGeminiLivePlaybackTail(
  audioContext: AudioContext,
  state: GeminiLivePlaybackState,
  paddingMs = 200,
): Promise<void> {
  const deltaSec = Math.max(0, state.nextStartTime - audioContext.currentTime);
  const ms = deltaSec * 1000 + paddingMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
