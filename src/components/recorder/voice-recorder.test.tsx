import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { AudioAttachmentRecorder, DictationRecorder } from "./voice-recorder";
import { transcribeAudio } from "@/api/fetcher";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/api/fetcher", () => ({ transcribeAudio: vi.fn() }));

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

class Recorder {
  static isTypeSupported = () => true;
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: (() => void) | null;
  start() {
    this.state = "recording";
  }
  pause() {
    this.state = "paused";
  }
  resume() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio"]) });
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("MediaRecorder", Recorder);
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
});
afterEach(() => vi.unstubAllGlobals());

function setup() {
  const onFinish = vi.fn();
  const onClose = vi.fn();
  render(<AudioAttachmentRecorder onFinish={onFinish} onClose={onClose} />);
  return { onFinish, onClose };
}

it("starts on mount and returns the file when stopped", async () => {
  const { onFinish, onClose } = setup();
  await screen.findByText("Recording…");
  await userEvent.click(screen.getByRole("button", { name: "Stop recording" }));
  await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  expect(onFinish.mock.calls[0][0]).toBeInstanceOf(File);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(stopTrack).toHaveBeenCalled();
});


it("discards the recording when cancelled", async () => {
  const { onFinish, onClose } = setup();
  await screen.findByText("Recording…");
  await userEvent.click(screen.getByRole("button", { name: "Cancel recording" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onFinish).not.toHaveBeenCalled();
  expect(stopTrack).toHaveBeenCalled();
});

it("keeps Escape from reaching the surrounding dialog", async () => {
  const dialogEscape = vi.fn();
  document.addEventListener("keydown", dialogEscape, { capture: true });
  const { onFinish, onClose } = setup();
  await screen.findByText("Recording…");
  await userEvent.keyboard("{Escape}");
  document.removeEventListener("keydown", dialogEscape, { capture: true });
  expect(dialogEscape).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onFinish).not.toHaveBeenCalled();
});

it("reports a denied microphone and closes", async () => {
  getUserMedia.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
  const { onClose } = setup();
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith("Allow microphone access to record.");
});

it("sits on its own, with no pause control, like the mobile panel", async () => {
  setup();
  await screen.findByText("Recording…");
  expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel recording" })).toBeEnabled();
});

describe("DictationRecorder", () => {
  function setupDictation() {
    const onTranscript = vi.fn();
    const onClose = vi.fn();
    render(<DictationRecorder onTranscript={onTranscript} onClose={onClose} />);
    return { onTranscript, onClose };
  }

  it("hands back the text and closes, without keeping the audio", async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({ full_text: "Hello there." } as never);
    const { onTranscript, onClose } = setupDictation();
    await screen.findByText("Recording…");
    await userEvent.click(screen.getByRole("button", { name: "Stop recording and transcribe" }));
    await waitFor(() => expect(onTranscript).toHaveBeenCalledWith("Hello there."));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open with the recording when transcription fails, then retries", async () => {
    vi.mocked(transcribeAudio).mockRejectedValueOnce(new Error("Transcription is temporarily busy."));
    const { onTranscript, onClose } = setupDictation();
    await screen.findByText("Recording…");
    await userEvent.click(screen.getByRole("button", { name: "Stop recording and transcribe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("temporarily busy");
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    vi.mocked(transcribeAudio).mockResolvedValue({ full_text: "Second try." } as never);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(onTranscript).toHaveBeenCalledWith("Second try."));
  });

  it("discards the recording on request", async () => {
    vi.mocked(transcribeAudio).mockRejectedValueOnce(new Error("Busy."));
    const { onTranscript, onClose } = setupDictation();
    await screen.findByText("Recording…");
    await userEvent.click(screen.getByRole("button", { name: "Stop recording and transcribe" }));
    await userEvent.click(await screen.findByRole("button", { name: "Discard" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onTranscript).not.toHaveBeenCalled();
  });
});
