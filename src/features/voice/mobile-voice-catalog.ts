import denver from "@/assets/image/voices/mobile/voice-denver.webp";
import sue from "@/assets/image/voices/mobile/voice-sue.webp";
import josef from "@/assets/image/voices/mobile/voice-josef.webp";
import hannah from "@/assets/image/voices/mobile/voice-hannah.webp";

/** Mirrors mobile/src/features/chat/voice-catalog.ts and VoiceArtwork.tsx.
 * Match by provider voice identity: the API's Sue/Hannah display names differ.
 * Maya and Leo intentionally use the same gradient placeholders as mobile.
 */
export const MOBILE_VOICE_CATALOG = [
  { id: "denver", title: "Denver", subtitle: "Male v1", voiceName: "Fenrir", artwork: denver },
  { id: "sue", title: "Sue", subtitle: "Female v2", voiceName: "Aoede", artwork: sue },
  { id: "josef", title: "Josef", subtitle: "Male v3", voiceName: "Enceladus", artwork: josef },
  { id: "hannah", title: "Hannah", subtitle: "Female v4", voiceName: "Kore", artwork: hannah },
  { id: "maya", title: "Maya", subtitle: "Female v5", voiceName: "Leda", artwork: "linear-gradient(135deg, #F0A7EE, #E8B99A, #E98246)" },
  { id: "leo", title: "Leo", subtitle: "Male v6", voiceName: "Puck", artwork: "linear-gradient(135deg, #7BDD9F, #1A80F7, #12131A)" },
] as const;

export function getMobileVoiceDefinition(value?: string | null) {
  const key = value?.trim().toLowerCase();
  return MOBILE_VOICE_CATALOG.find((voice) => voice.id === key || voice.voiceName.toLowerCase() === key);
}

export function getMobileVoiceChoices<T extends { voiceName: string }>(entries: T[]) {
  return MOBILE_VOICE_CATALOG.flatMap((voice) => {
    const entry = entries.find((item) => item.voiceName.toLowerCase() === voice.voiceName.toLowerCase());
    return entry ? [{ ...entry, ...voice, provider: "gemini" as const }] : [];
  });
}
