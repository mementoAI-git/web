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

type VoiceClip = { line: string; url: string };

export function groupClips(urlsByPath: Record<string, string>): Map<string, VoiceClip[]> {
  const clips = new Map<string, VoiceClip[]>();
  for (const [path, url] of Object.entries(urlsByPath)) {
    const match = path.match(/([^/]+)-(\d+)\.mp3$/);
    if (!match) continue;
    const [, voiceId, line] = match;
    clips.set(voiceId, [...(clips.get(voiceId) ?? []), { line, url }]);
  }
  return clips;
}

const clipsByVoice = groupClips(clipUrls);
const lineByUrl = new Map([...clipsByVoice.values()].flat().map(({ line, url }) => [url, line]));

/**
 * A random line for this voice that differs from `previous`, which may be another voice's
 * clip, so trying voices in turn doesn't repeat a sentence. A voice with nothing else
 * recorded plays what it has.
 */
export function pickVoicePreviewClip(voiceId: string, previous?: string | null): string | null {
  const clips = clipsByVoice.get(voiceId) ?? [];
  const previousLine = previous ? lineByUrl.get(previous) : undefined;
  const fresh = clips.filter(({ line }) => line !== previousLine);
  const choices = fresh.length ? fresh : clips;
  return choices[Math.floor(Math.random() * choices.length)]?.url ?? null;
}

/** Fetches every clip ahead of time, so the first play of each voice starts straight away. */
export function preloadVoicePreviewClips() {
  for (const { url } of [...clipsByVoice.values()].flat()) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
  }
}
