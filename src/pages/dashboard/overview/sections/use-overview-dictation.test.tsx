import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useOverviewDictation } from "./use-overview-dictation";
import { fileUploadFetcher, transcribeAudio } from "@/api/fetcher";
vi.mock("@/api/fetcher", () => ({
  fileUploadFetcher: vi.fn(),
  transcribeAudio: vi.fn(),
}));
const stopTrack = vi.fn();
class Recorder {
  static isTypeSupported = () => true;
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: (() => void) | null;
  onerror?: () => void;
  static latest: Recorder;
  constructor() {
    Recorder.latest = this;
  }
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
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
    },
  });
  vi.mocked(fileUploadFetcher).mockResolvedValue({
    success: true,
    data: { _id: "audio-id" },
    message: "",
  });
  vi.mocked(transcribeAudio).mockResolvedValue({
    full_text: "A warm memory.",
  });
});
afterEach(() => vi.unstubAllGlobals());
it("records, pauses, resumes, releases the microphone and returns a transcript", async () => {
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  expect(result.current.phase).toBe("recording");
  act(() => result.current.togglePause());
  expect(result.current.phase).toBe("paused");
  act(() => result.current.togglePause());
  expect(result.current.phase).toBe("recording");
  act(() => result.current.stop());
  await waitFor(() => expect(append).toHaveBeenCalledWith("A warm memory."));
  expect(stopTrack).toHaveBeenCalled();
  expect(transcribeAudio).toHaveBeenCalledWith(expect.any(File), expect.any(AbortSignal));
  expect(fileUploadFetcher).not.toHaveBeenCalled();
  expect(result.current.phase).toBe("idle");
});
it("retains recorded audio for retry without using file storage", async () => {
  vi.mocked(transcribeAudio).mockRejectedValueOnce(
    new Error("Transcription service unavailable"),
  );
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  act(() => result.current.stop());
  await waitFor(() => expect(result.current.canRetry).toBe(true));
  expect(append).not.toHaveBeenCalled();
  await act(() => result.current.retry());
  expect(append).toHaveBeenCalledOnce();
  expect(fileUploadFetcher).not.toHaveBeenCalled();
  expect(transcribeAudio).toHaveBeenCalledTimes(2);
});
it("cancels without uploading or modifying text", async () => {
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  act(() => result.current.cancel());
  expect(stopTrack).toHaveBeenCalled();
  expect(fileUploadFetcher).not.toHaveBeenCalled();
  expect(append).not.toHaveBeenCalled();
});
it("releases a late permission grant after unmount", async () => {
  let grant!: (value: unknown) => void;
  vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(
    () =>
      new Promise((resolve) => {
        grant = resolve;
      }),
  );
  const { result, unmount } = renderHook(() => useOverviewDictation(vi.fn()));
  let start!: Promise<void>;
  act(() => {
    start = result.current.start();
  });
  unmount();
  await act(async () => {
    grant({ getTracks: () => [{ stop: stopTrack }] });
    await start;
  });
  expect(stopTrack).toHaveBeenCalled();
  expect(fileUploadFetcher).not.toHaveBeenCalled();
});
it("explains microphone denial and does not upload", async () => {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
    new DOMException("denied", "NotAllowedError"),
  );
  const { result } = renderHook(() => useOverviewDictation(vi.fn()));
  await act(() => result.current.start());
  expect(result.current.error).toMatch(/Allow microphone access/);
  expect(result.current.phase).toBe("idle");
  expect(fileUploadFetcher).not.toHaveBeenCalled();
});

class Speech {
  static latest: Speech;
  static available = vi.fn().mockResolvedValue("available");
  processLocally = false;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult?: (event: {
    results: { isFinal: boolean; 0: { transcript: string } }[];
  }) => void;
  onerror?: (event: { error: string }) => void;
  onend?: () => void;
  constructor() {
    Speech.latest = this;
  }
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();
  emit(text: string, isFinal = true) {
    this.onresult?.({ results: [{ isFinal, 0: { transcript: text } }] });
  }
}
it("uses installed on-device dictation and returns live text without an API request", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  Speech.available.mockResolvedValue("available");
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  expect(Speech.latest.processLocally).toBe(true);
  Speech.latest.emit("A warm", false);
  Speech.latest.emit("A warm memory.");
  act(() => result.current.stop());
  await waitFor(() => expect(append).toHaveBeenCalledWith("A warm memory."));
  expect(append).toHaveBeenCalledOnce();
  expect(transcribeAudio).not.toHaveBeenCalled();
  expect(result.current.phase).toBe("idle");
});
it("keeps every speech segment through pauses and recognition restarts", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  Speech.latest.emit("First memory.");
  act(() => result.current.togglePause());
  act(() => result.current.togglePause());
  Speech.latest.emit("Second memory.");
  Speech.latest.onend?.();
  Speech.latest.emit("Third memory.");
  act(() => result.current.stop());
  await waitFor(() =>
    expect(append).toHaveBeenCalledWith(
      "First memory. Second memory. Third memory.",
    ),
  );
  expect(transcribeAudio).not.toHaveBeenCalled();
});
it("falls back to the full audio if browser recognition fails after partial speech", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  Speech.latest.emit("Partial speech");
  Speech.latest.onerror?.({ error: "network" });
  act(() => result.current.stop());
  await waitFor(() => expect(append).toHaveBeenCalledWith("A warm memory."));
  expect(append).toHaveBeenCalledOnce();
  expect(transcribeAudio).toHaveBeenCalledOnce();
});
it("uses browser recognition without waiting for a language pack download", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  Speech.available.mockResolvedValueOnce("downloadable");
  const { result } = renderHook(() => useOverviewDictation(vi.fn()));
  await act(() => result.current.start());
  expect(Speech.latest.processLocally).toBe(false);
  expect(result.current.phase).toBe("recording");
  act(() => result.current.cancel());
});
it("aborts recognition on cancel and ignores late results", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  const speech = Speech.latest;
  act(() => result.current.cancel());
  speech.emit("Cancelled text");
  expect(speech.abort).toHaveBeenCalled();
  expect(append).not.toHaveBeenCalled();
  expect(transcribeAudio).not.toHaveBeenCalled();
});
it("falls back without hanging when recognition does not finish", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  vi.useFakeTimers();
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  try {
    await act(() => result.current.start());
    Speech.latest.emit("Unfinished fragment", false);
    Speech.latest.stop.mockImplementation(() => {});
    act(() => result.current.stop());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(701);
    });
    expect(transcribeAudio).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalledWith("A warm memory.");
  } finally {
    vi.useRealTimers();
  }
});
it("does not release a new recording or append stale text after cancelling finalization", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  await act(() => result.current.start());
  const first = Speech.latest;
  first.emit("Cancelled memory");
  first.stop.mockImplementation(() => {});
  act(() => result.current.stop());
  act(() => result.current.cancel());
  await act(() => result.current.start());
  expect(stopTrack).toHaveBeenCalledOnce();
  expect(result.current.phase).toBe("recording");
  Speech.latest.emit("New memory.");
  act(() => result.current.stop());
  await waitFor(() => expect(append).toHaveBeenCalledWith("New memory."));
  expect(append).toHaveBeenCalledOnce();
  expect(transcribeAudio).not.toHaveBeenCalled();
});

it("times out stalled transcription, retains audio for retry and ignores the late response", async () => {
  vi.useFakeTimers();
  let resolve!: (value: { full_text: string }) => void;
  vi.mocked(transcribeAudio).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const append = vi.fn();
  const { result } = renderHook(() => useOverviewDictation(append));
  try {
    await act(() => result.current.start());
    await act(async () => { result.current.stop(); });
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(result.current.canRetry).toBe(true);
    expect(result.current.phase).toBe("idle");
    expect(result.current.error).toMatch(/taking too long/);
    await act(async () => { resolve({ full_text: "Late result" }); });
    expect(append).not.toHaveBeenCalled();
    await act(() => result.current.retry());
    expect(append).toHaveBeenCalledOnce();
  } finally { vi.useRealTimers(); }
});
