import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecordingCard } from "./recording-card";
import { formatRecordingClock } from "./recording-clock";

describe("RecordingCard", () => {
  it("shows the recording length as hours, minutes and seconds", () => {
    expect(formatRecordingClock(16)).toBe("00:00:16");
    expect(formatRecordingClock(1944)).toBe("00:32:24");
    expect(formatRecordingClock(undefined)).toBe("00:00:00");
  });

  it("renders the designed waveform and time chip", () => {
    const { container } = render(<RecordingCard duration={16} />);
    expect(screen.getByText("00:00:16")).toBeTruthy();
    expect(container.querySelectorAll("rect")).toHaveLength(11);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });
});
