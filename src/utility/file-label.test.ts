import { describe, expect, it } from "vitest";
import { displayFileName, voiceNoteLabel } from "./file-label";

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

  it.each(["song.mp3", "recording-final.webm", "my recording-123.webm", "", null, undefined])(
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
