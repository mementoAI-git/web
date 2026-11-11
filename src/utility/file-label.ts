/** Names the recorder gives a clip, with the suffix the server adds on upload. */
const RECORDING_NAME = /^(?:recording|voice-clip)-(\d+)(?:_\d{12})?(?:\.\w+)?$/i;
/**
 * The mobile app's voice notes (voice_note, voice_<time>) and the apps'
 * recorded voice conversations (voice_call_<time>), with the server's suffix.
 */
const VOICE_NAME = /^voice_(call_)?(?:note|(\d+))?(?:_\d{12})?(?:\.\w+)?$/i;

function parseRecordingName(name?: string | null): { call: boolean; time: string | undefined } | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const web = trimmed.match(RECORDING_NAME);
  if (web) return { call: false, time: web[1] };
  const voice = trimmed.match(VOICE_NAME);
  return voice ? { call: Boolean(voice[1]), time: voice[2] } : null;
}

function formatRecordedAt(timestamp: number) {
  const date = new Date(timestamp);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

/** When an in-app recording was made, read from its name. */
export function recordedAtFromName(name?: string | null): number | null {
  const time = parseRecordingName(name)?.time;
  if (!time || time.length < 12) return null;
  const timestamp = Number(time);
  return Number.isNaN(new Date(timestamp).getTime()) ? null : timestamp;
}

/** A recorded voice conversation with Memento, saved as a story by either app. */
export function isVoiceConversationName(name?: string | null): boolean {
  return parseRecordingName(name)?.call ?? false;
}

/** A friendly label for an in-app recording or recorded conversation, or null for any other file. */
export function voiceNoteLabel(name?: string | null): string | null {
  const recording = parseRecordingName(name);
  if (!recording) return null;
  const kind = recording.call ? "Voice conversation" : "Voice note";
  // Older clips were numbered (recording-1.webm) rather than timestamped.
  const timestamp = recordedAtFromName(name);
  return timestamp === null ? kind : `${kind} · ${formatRecordedAt(timestamp)}`;
}

export function displayFileName(name?: string | null): string {
  return voiceNoteLabel(name) ?? name ?? "";
}
