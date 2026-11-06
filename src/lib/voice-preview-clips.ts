/**
 * Prerecorded voice samples, named `<voice id>-<line index>.mp3`, where the index
 * points into voice-preview-lines.json. A new clip is picked up automatically;
 * `scripts/generate-voice-previews.mjs` creates the missing ones.
 */
const clipUrls = import.meta.glob<string>("../assets/audio/voice-previews/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
});

/** Groups clips by voice, keeping only lines every voice has so they all get the same choice. */
export function groupEvenClips(urlsByPath: Record<string, string>): Map<string, string[]> {
  const lines = new Map<string, Map<string, string>>();
  for (const [path, url] of Object.entries(urlsByPath)) {
    const match = path.match(/([^/]+)-(\d+)\.mp3$/);
    if (!match) continue;
    const [, voiceId, line] = match;
    lines.set(voiceId, (lines.get(voiceId) ?? new Map<string, string>()).set(line, url));
  }
  const voices = [...lines.values()];
  return new Map(
    [...lines].map(([voiceId, clips]) => [
      voiceId,
      [...clips].filter(([line]) => voices.every((voice) => voice.has(line))).map(([, url]) => url),
    ]),
  );
}

const clipsByVoice = groupEvenClips(clipUrls);

/** A random line for this voice, avoiding `previous` when there is another to play. */
export function pickVoicePreviewClip(voiceId: string, previous?: string | null): string | null {
  const clips = clipsByVoice.get(voiceId) ?? [];
  const choices = clips.length > 1 ? clips.filter((clip) => clip !== previous) : clips;
  return choices[Math.floor(Math.random() * choices.length)] ?? null;
}
