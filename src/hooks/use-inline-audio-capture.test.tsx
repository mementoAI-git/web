import { act, renderHook } from "@testing-library/react";
import { useInlineAudioCapture } from "./use-inline-audio-capture";
vi.mock("@/hooks/use-recorder", () => ({ default: () => ({ recording: false, timer: 0, url: null, start: vi.fn(), stop: vi.fn(), reset: vi.fn() }) }));
vi.mock("@/hooks/use-audio-levels", () => ({ useAudioLevels: () => [] }));
it("stops a permission grant arriving after unmount and prevents duplicate prompts", async () => {
  let resolve!: (stream: MediaStream) => void;
  const getUserMedia = vi.fn(() => new Promise<MediaStream>((done) => { resolve = done; }));
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  const stop = vi.fn();
  const { result, unmount } = renderHook(() => useInlineAudioCapture({ onRecordingReady: vi.fn() }));
  act(() => { result.current.toggleRecording(); result.current.toggleRecording(); });
  expect(getUserMedia).toHaveBeenCalledOnce();
  unmount();
  await act(async () => { resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream); });
  expect(stop).toHaveBeenCalledOnce();
});
it("returns a recoverable recording error if the browser lacks microphone support", () => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  const { result } = renderHook(() => useInlineAudioCapture({ onRecordingReady: vi.fn() }));
  act(() => result.current.toggleRecording());
  expect(result.current.error).toMatch(/isn’t available/);
  expect(result.current.busy).toBe(false);
});
