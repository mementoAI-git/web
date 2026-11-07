/** Names the recorder gives a clip, with the suffix the server adds on upload. */
const RECORDING_NAME = /^(?:recording|voice-clip)-(\d+)(?:_\d{12})?(?:\.\w+)?$/i;

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
  const match = name?.trim().match(RECORDING_NAME);
  if (!match || match[1].length < 12) return null;
  const timestamp = Number(match[1]);
  return Number.isNaN(new Date(timestamp).getTime()) ? null : timestamp;
}

/** A friendly label for an in-app recording, or null for any other file. */
export function voiceNoteLabel(name?: string | null): string | null {
  if (!name?.trim().match(RECORDING_NAME)) return null;
  // Older clips were numbered (recording-1.webm) rather than timestamped.
  const timestamp = recordedAtFromName(name);
  return timestamp === null
    ? "Voice note"
    : `Voice note · ${formatRecordedAt(timestamp)}`;
}

export function displayFileName(name?: string | null): string {
  return voiceNoteLabel(name) ?? name ?? "";
}
