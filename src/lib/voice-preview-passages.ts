import lines from "@/lib/voice-preview-lines.json";

/** Single lines from Jane Austen's Pride and Prejudice (public domain). */
export const VOICE_PREVIEW_PASSAGES: readonly string[] = lines;

export function pickRandomVoicePreviewPassage(): string {
  const i = Math.floor(Math.random() * VOICE_PREVIEW_PASSAGES.length);
  return VOICE_PREVIEW_PASSAGES[i] ?? VOICE_PREVIEW_PASSAGES[0];
}
