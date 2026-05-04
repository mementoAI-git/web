import { describe, expect, it } from "vitest";
import { pickRandomVoicePreviewPassage, VOICE_PREVIEW_PASSAGES } from "./voice-preview-passages";

describe("voice-preview-passages", () => {
  it("returns a passage from the curated list", () => {
    const passage = pickRandomVoicePreviewPassage();
    expect([...VOICE_PREVIEW_PASSAGES]).toContain(passage);
    expect(passage.length).toBeGreaterThan(20);
  });
});
