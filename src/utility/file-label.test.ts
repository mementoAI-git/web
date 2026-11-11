import { describe, expect, it } from "vitest";
import { displayFileName, isVoiceConversationName, recordedAtFromName, voiceNoteLabel } from "./file-label";

describe("voiceNoteLabel", () => {
  const timestamp = new Date(new Date().getFullYear(), 10, 6, 14, 32).getTime();

  it.each([
    `recording-${timestamp}.webm`,
    `recording-${timestamp}_261106143012.webm`,
    `voice-clip-${timestamp}.mp4`,
    `RECORDING-${timestamp}.WEBM`,
  ])("labels %s with when it was recorded", (name) => {
    const label = voiceNoteLabel(name);
    expect(label).toMatch(/^Voice note · /);
    expect(label).toMatch(/Nov|11/);
    expect(label).not.toContain(String(timestamp));
  });

  it("includes the year for an older recording", () => {
    const older = new Date(2021, 0, 2, 9, 5).getTime();
    expect(voiceNoteLabel(`recording-${older}.webm`)).toContain("2021");
  });

  it("gives older numbered clips a plain label", () => {
    expect(voiceNoteLabel("recording-1.webm")).toBe("Voice note");
    expect(voiceNoteLabel("recording-12_261106143012.webm")).toBe("Voice note");
  });

  it.each([
    `voice_${timestamp}.m4a`,
    `voice_${timestamp}_261106143012.m4a`,
  ])("labels the mobile app's voice note %s", (name) => {
    expect(voiceNoteLabel(name)).toMatch(/^Voice note · (Nov|11)/);
    expect(recordedAtFromName(name)).toBe(timestamp);
  });

  it("labels recorded voice conversations from either app", () => {
    expect(voiceNoteLabel(`voice_call_${timestamp}.m4a`)).toMatch(/^Voice conversation · /);
    expect(voiceNoteLabel(`voice_call_${timestamp}_261106143012.webm`)).toMatch(/^Voice conversation · /);
    expect(isVoiceConversationName(`voice_call_${timestamp}.m4a`)).toBe(true);
    expect(isVoiceConversationName(`voice_${timestamp}.m4a`)).toBe(false);
    expect(voiceNoteLabel("voice_note.m4a")).toBe("Voice note");
  });

  it.each(["voice_memo_final.m4a", "voice-over.mp3", "song.mp3", "recording-final.webm", "my recording-123.webm", "", null, undefined])(
    "leaves %s alone",
    (name) => expect(voiceNoteLabel(name)).toBeNull(),
  );
});

describe("displayFileName", () => {
  it("keeps the name of an ordinary file", () => {
    expect(displayFileName("holiday.mp3")).toBe("holiday.mp3");
  });
  it("is empty for a missing name", () => {
    expect(displayFileName(undefined)).toBe("");
  });
});
