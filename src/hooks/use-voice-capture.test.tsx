import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { meterHeight, useVoiceCapture } from "./use-voice-capture";
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result, unmount } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: vi.fn() }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: vi.fn() }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: vi.fn() }));
  await act(() => result.current.start());
  expect(Speech.latest.processLocally).toBe(false);
  expect(result.current.phase).toBe("recording");
  act(() => result.current.cancel());
});
it("aborts recognition on cancel and ignores late results", async () => {
  vi.stubGlobal("SpeechRecognition", Speech);
  const append = vi.fn();
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
  try {
    await act(() => result.current.start());
    Speech.latest.emit("Unfinished fragment", false);
    Speech.latest.stop.mockImplementation(() => {});
    act(() => result.current.stop());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1501);
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
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
it("hands back the audio file with its duration in audio mode, without transcribing", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const onAudio = vi.fn();
  const { result } = renderHook(() => useVoiceCapture({ mode: "audio", onAudio }));
  await act(() => result.current.start());
  await act(() => vi.advanceTimersByTimeAsync(2000));
  act(() => result.current.togglePause());
  await act(() => vi.advanceTimersByTimeAsync(3000));
  act(() => result.current.togglePause());
  act(() => result.current.stop());
  vi.useRealTimers();
  await waitFor(() => expect(onAudio).toHaveBeenCalledTimes(1));
  const [file, duration] = onAudio.mock.calls[0] as [File, number];
  expect(file.name).toMatch(/^recording-\d+\.webm$/);
  expect(file.type).toBe("audio/webm");
  expect(duration).toBe(2);
  expect(transcribeAudio).not.toHaveBeenCalled();
  expect(stopTrack).toHaveBeenCalled();
  expect(result.current.phase).toBe("idle");
});
it("does not start live speech recognition in audio mode", async () => {
  const Recognition = vi.fn();
  vi.stubGlobal("SpeechRecognition", Recognition);
  const { result } = renderHook(() =>
    useVoiceCapture({ mode: "audio", onAudio: vi.fn() }),
  );
  await act(() => result.current.start());
  expect(Recognition).not.toHaveBeenCalled();
  act(() => result.current.cancel());
});
it("moves the meter for ordinary speech levels instead of flattening them", () => {
  expect(meterHeight(0)).toBe(5);
  expect(meterHeight(0.0005)).toBe(5);
  // Typical speech has an RMS of roughly 0.01–0.1.
  expect(meterHeight(0.01)).toBeGreaterThan(10);
  expect(meterHeight(0.1)).toBeGreaterThan(meterHeight(0.01) + 8);
  expect(meterHeight(1)).toBe(32);
});
it("records in a format that plays everywhere when the browser offers it", async () => {
  const requested: (MediaRecorderOptions | undefined)[] = [];
  vi.stubGlobal(
    "MediaRecorder",
    Object.assign(
      class extends Recorder {
        constructor(_stream: unknown, options?: MediaRecorderOptions) {
          super();
          requested.push(options);
        }
      },
      { isTypeSupported: (type: string) => /^audio\/(mp4|webm)/.test(type) },
    ),
  );
  const { result } = renderHook(() => useVoiceCapture({ mode: "audio", onAudio: vi.fn() }));
  await act(() => result.current.start());
  expect(requested[0]?.mimeType).toBe("audio/mp4;codecs=mp4a.40.2");
  act(() => result.current.cancel());
});
it("creates the audio context during the tap, before waiting on the microphone", async () => {
  const order: string[] = [];
  const realGetUserMedia = navigator.mediaDevices.getUserMedia;
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      constructor() {
        order.push("context");
      }
      resume = () => Promise.resolve();
      close = () => Promise.resolve();
      createAnalyser = () => ({ fftSize: 0, getFloatTimeDomainData: vi.fn() });
      createMediaStreamSource = () => ({ connect: vi.fn(), disconnect: vi.fn() });
    },
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: (constraints: MediaStreamConstraints) => {
        order.push("microphone");
        return realGetUserMedia(constraints);
      },
    },
  });
  const { result } = renderHook(() => useVoiceCapture({ mode: "audio", onAudio: vi.fn() }));
  await act(() => result.current.start());
  expect(order).toEqual(["context", "microphone"]);
  act(() => result.current.cancel());
});
it("falls back to the next format when one fails right after starting", async () => {
  const created: { format?: string; recorder: Recorder & { onerror?: () => void } }[] = [];
  vi.stubGlobal(
    "MediaRecorder",
    Object.assign(
      class extends Recorder {
        constructor(_stream: unknown, options?: MediaRecorderOptions) {
          super();
          created.push({ format: options?.mimeType, recorder: this });
        }
      },
      { isTypeSupported: (type: string) => /^audio\/(mp4|webm)/.test(type) },
    ),
  );
  const onAudio = vi.fn();
  const { result } = renderHook(() => useVoiceCapture({ mode: "audio", onAudio }));
  await act(() => result.current.start());
  const first = created.length - 1;
  act(() => created[first].recorder.onerror?.());
  expect(created.length).toBe(first + 2);
  expect(created[first + 1].format).not.toBe(created[first].format);
  expect(result.current.error).toBe("");
  expect(result.current.phase).toBe("recording");
  act(() => result.current.stop());
  await waitFor(() => expect(onAudio).toHaveBeenCalledTimes(1));
});
it("keeps what was captured when recording fails later on", async () => {
  const created: (Recorder & { onerror?: () => void })[] = [];
  vi.stubGlobal(
    "MediaRecorder",
    Object.assign(
      class extends Recorder {
        constructor() {
          super();
          created.push(this);
        }
      },
      { isTypeSupported: () => false },
    ),
  );
  const onAudio = vi.fn();
  const { result } = renderHook(() => useVoiceCapture({ mode: "audio", onAudio }));
  await act(() => result.current.start());
  const [recorder] = created;
  act(() => recorder.ondataavailable?.({ data: new Blob(["audio"]) }));
  act(() => recorder.onerror?.());
  await waitFor(() => expect(onAudio).toHaveBeenCalledTimes(1));
  expect(result.current.error).toBe("Recording stopped early. We kept what was captured.");
});
it("reports a dead microphone instead of pretending to record", async () => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: stopTrack }],
        getAudioTracks: () => [{ readyState: "ended" }],
      }),
    },
  });
  const { result } = renderHook(() => useVoiceCapture({ mode: "audio", onAudio: vi.fn() }));
  await act(() => result.current.start());
  expect(result.current.phase).toBe("idle");
  expect(result.current.error).toMatch(/isn’t sending any audio/);
  expect(stopTrack).toHaveBeenCalled();
});
it("uses what the browser heard when server transcription fails", async () => {
  class FailingRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult: ((event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    static latest: FailingRecognition;
    constructor() {
      FailingRecognition.latest = this;
    }
    start() {}
    abort() {}
    stop() {
      // The recognizer breaks at the end, so its own result can't be trusted as complete.
      this.onerror?.({ error: "network" });
      this.onend?.();
    }
  }
  vi.stubGlobal("SpeechRecognition", FailingRecognition);
  vi.mocked(transcribeAudio).mockRejectedValueOnce(new Error("Transcription is temporarily busy."));
  const append = vi.fn();
  const { result } = renderHook(() => useVoiceCapture({ mode: "text", onTranscript: append }));
  await act(() => result.current.start());
  act(() =>
    FailingRecognition.latest.onresult?.({
      results: [{ isFinal: true, 0: { transcript: "What I said" } }],
    }),
  );
  act(() => result.current.stop());
  await waitFor(() => expect(append).toHaveBeenCalledWith("What I said"));
  expect(transcribeAudio).toHaveBeenCalled();
  expect(result.current.error).toBe("");
});
