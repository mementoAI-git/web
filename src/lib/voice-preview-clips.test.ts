import { describe, expect, it } from "vitest";
import { MOBILE_VOICE_CATALOG } from "@/features/voice/mobile-voice-catalog";
import { groupClips, pickVoicePreviewClip } from "./voice-preview-clips";

describe("pickVoicePreviewClip", () => {
  it.each(MOBILE_VOICE_CATALOG.map((voice) => voice.id))("has a sample for %s", (id) => {
    expect(pickVoicePreviewClip(id)).toContain(`${id}-`);
  });

  it("groups every line a voice has recorded, even if others have fewer", () => {
    const grouped = groupClips({
      "x/denver-0.mp3": "d0",
      "x/denver-1.mp3": "d1",
      "x/sue-0.mp3": "s0",
    });
    expect(grouped.get("denver")).toEqual([{ line: "0", url: "d0" }, { line: "1", url: "d1" }]);
    expect(grouped.get("sue")).toEqual([{ line: "0", url: "s0" }]);
  });

  it("doesn't repeat the line just spoken when moving to another voice", () => {
    const lineOf = (url: string | null) => url?.match(/-(\d+)\.mp3/)?.[1];
    for (let i = 0; i < 200; i += 1) {
      const maya = pickVoicePreviewClip("maya");
      expect(lineOf(pickVoicePreviewClip("denver", maya))).not.toBe(lineOf(maya));
    }
  });

  it("doesn't repeat itself when the same voice is picked again", () => {
    for (let i = 0; i < 50; i += 1) {
      const clip = pickVoicePreviewClip("sue");
      expect(pickVoicePreviewClip("sue", clip)).not.toBe(clip);
    }
  });

  it("still plays a voice whose only recording is the line just spoken", () => {
    const leo = pickVoicePreviewClip("leo");
    expect(pickVoicePreviewClip("leo", leo)).toBe(leo);
  });

  it("has nothing to play for a voice without samples", () => {
    expect(pickVoicePreviewClip("unknown")).toBeNull();
  });
});
