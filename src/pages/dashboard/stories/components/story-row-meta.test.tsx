import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IFile, IMemory } from "@/utility/interface";
import { StoryRowMeta } from "./story-row-meta";
import { formatRecordingLength, recordingDurationLabel } from "./story-recording";

const audio = (overrides: Partial<IFile> = {}): IFile => ({
  _id: "a1",
  name: "voice_call_1762876543210.m4a",
  type: "audio/m4a",
  url: "https://example.com/a.m4a",
  size: 1,
  duration: 527,
  ...overrides,
});
const story = (attachments: IFile[]) =>
  ({ _id: "s1", title: "Conversation with Memento", attachments, created_at: "2026-11-11T10:00:00Z" }) as unknown as IMemory;

describe("StoryRowMeta", () => {
  it("leads recordings with a mic, then the date and the length, as on mobile", () => {
    const { container } = render(<StoryRowMeta memory={story([audio()])} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toBe("Recording, Nov 11, 2026·length 8:47");
  });

  it("shows only the date for stories without audio", () => {
    const { container } = render(<StoryRowMeta memory={story([])} />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).toBe("Nov 11, 2026");
  });

  it("adds up a story's recordings and leaves out unknown lengths", () => {
    expect(recordingDurationLabel(story([audio({ duration: 3 }), audio({ _id: "a2", duration: 95 })]))).toBe("1:38");
    expect(recordingDurationLabel(story([audio({ duration: undefined })]))).toBe("");
    expect(formatRecordingLength(3725)).toBe("1:02:05");
  });
});
