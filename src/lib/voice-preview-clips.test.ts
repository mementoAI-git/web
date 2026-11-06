import { describe, expect, it } from "vitest";
import { MOBILE_VOICE_CATALOG } from "@/features/voice/mobile-voice-catalog";
import { groupEvenClips, pickVoicePreviewClip } from "./voice-preview-clips";

describe("pickVoicePreviewClip", () => {
  it.each(MOBILE_VOICE_CATALOG.map((voice) => voice.id))("has a sample for %s", (id) => {
    expect(pickVoicePreviewClip(id)).toContain(`${id}-`);
  });

  it("gives every voice the same number of lines", () => {
    const counts = MOBILE_VOICE_CATALOG.map((voice) => {
      const seen = new Set(Array.from({ length: 200 }, () => pickVoicePreviewClip(voice.id)));
      return seen.size;
    });
    expect(new Set(counts).size).toBe(1);
  });

  it("only offers lines that all voices have recorded", () => {
    const grouped = groupEvenClips({
      "x/denver-0.mp3": "d0",
      "x/denver-1.mp3": "d1",
      "x/denver-2.mp3": "d2",
      "x/sue-0.mp3": "s0",
      "x/sue-2.mp3": "s2",
    });
    expect(grouped.get("denver")).toEqual(["d0", "d2"]);
    expect(grouped.get("sue")).toEqual(["s0", "s2"]);
  });

  it("has nothing to play for a voice without samples", () => {
    expect(pickVoicePreviewClip("unknown")).toBeNull();
  });
});
