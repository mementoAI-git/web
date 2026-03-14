import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { AudioRecorderModal } from "./recorder-modal";

const noop = () => {};

describe("AudioRecorderModal", () => {
  it("renders waveform with 24 bars when idle", () => {
    renderWithProviders(
      <AudioRecorderModal data={{ onFinish: noop, recordingNumber: 1 }} />,
    );
    const waveformRow = document.querySelector(
      ".flex.items-center.gap-0\\.5.h-20",
    );
    expect(waveformRow).toBeInTheDocument();
    // 24 bar/dot elements + 1 progress line
    expect(waveformRow?.children.length).toBeGreaterThanOrEqual(24);
  });

  it("renders Start recording (mic) button when idle", () => {
    renderWithProviders(
      <AudioRecorderModal data={{ onFinish: noop }} />,
    );
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("hides Undo and Send when idle (only shows when paused or stopped)", () => {
    renderWithProviders(
      <AudioRecorderModal data={{ onFinish: noop }} />,
    );
    expect(screen.queryByRole("button", { name: /undo \/ re-record/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send/i })).not.toBeInTheDocument();
  });
});
