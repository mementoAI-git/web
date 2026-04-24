/**
 * Short public-domain excerpts for voice previews — natural read-aloud, not app copy.
 */
export const VOICE_PREVIEW_PASSAGES: readonly string[] = [
  `The morning air was cool and clear. Somewhere nearby, a bird started singing.`,
  `She paused at the doorway, took a breath, and smiled before stepping in.`,
  `Rain tapped softly on the window while the room settled into silence.`,
  `He looked up, surprised, then laughed like he had just remembered an old joke.`,
  `A small light flickered in the distance, steady and warm against the dark.`,
  `For a moment, everything slowed down, and the world felt beautifully simple.`,
];

export function pickRandomVoicePreviewPassage(): string {
  const i = Math.floor(Math.random() * VOICE_PREVIEW_PASSAGES.length);
  return VOICE_PREVIEW_PASSAGES[i] ?? VOICE_PREVIEW_PASSAGES[0];
}
