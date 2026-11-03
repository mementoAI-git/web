import { describe, expect, it } from "vitest";
import { getMobileVoiceChoices, getMobileVoiceDefinition, MOBILE_VOICE_CATALOG } from "./mobile-voice-catalog";

describe("mobile voice parity", () => {
  it("matches all six mobile identities, names, labels, and artwork", () => {
    expect(MOBILE_VOICE_CATALOG.map(({id, title, subtitle, voiceName}) => [id, title, subtitle, voiceName])).toEqual([
      ["denver", "Denver", "Male v1", "Fenrir"],
      ["sue", "Sue", "Female v2", "Aoede"],
      ["josef", "Josef", "Male v3", "Enceladus"],
      ["hannah", "Hannah", "Female v4", "Kore"],
      ["maya", "Maya", "Female v5", "Leda"],
      ["leo", "Leo", "Male v6", "Puck"],
    ]);
    expect(MOBILE_VOICE_CATALOG.slice(0, 4).every((voice) => voice.artwork.includes(`/mobile/voice-${voice.id}.webp`))).toBe(true);
    expect(MOBILE_VOICE_CATALOG[4].artwork).toBe("linear-gradient(135deg, #F0A7EE, #E8B99A, #E98246)");
    expect(MOBILE_VOICE_CATALOG[5].artwork).toBe("linear-gradient(135deg, #7BDD9F, #1A80F7, #12131A)");
  });
  it("uses provider identity rather than mismatched server labels or array position", () => {
    const choices = getMobileVoiceChoices([
      {voiceName: "Kore", title: "Sue", imageUrl: "old-glass.svg"},
      {voiceName: "Aoede", title: "Hannah", imageUrl: "wrong.svg"},
      {voiceName: "Fenrir", title: "Denver", imageUrl: "old.svg"},
      {voiceName: "agent_123", title: "Memento Agent", imageUrl: "agent.svg"},
    ]);
    expect(choices.map((voice) => voice.title)).toEqual(["Denver", "Sue", "Hannah"]);
    expect(choices.every((voice) => voice.provider === "gemini")).toBe(true);
  });
  it("resolves saved mobile IDs and provider names to the same choice", () => {
    expect(getMobileVoiceDefinition("sue")).toBe(getMobileVoiceDefinition("Aoede"));
    expect(getMobileVoiceDefinition(" Kore ")?.id).toBe("hannah");
    expect(getMobileVoiceChoices([])).toEqual([]);
  });
});
