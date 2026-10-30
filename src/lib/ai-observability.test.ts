import { beforeEach, expect, it, vi } from "vitest";
import posthog from "./posthog";
import {
  captureGeminiLiveGeneration,
  createGeminiLiveSessionId,
} from "./ai-observability";

vi.mock("./posthog", () => ({ default: { __loaded: true, capture: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  posthog.__loaded = true;
});

const turn = {
  sessionId: "session-1",
  traceId: "trace-1",
  model: "gemini-live",
  input: "private journal",
  output: "private response",
  latencyMs: 2000,
  timeToFirstTokenMs: 500,
  stopReason: "end_turn" as const,
};

it("captures performance metadata without prompts or responses", () => {
  captureGeminiLiveGeneration(turn);
  expect(posthog.capture).toHaveBeenCalledWith(
    "$ai_generation",
    expect.objectContaining({
      $ai_latency: 2,
      $ai_time_to_first_token: 0.5,
      $ai_model: "gemini-live",
    }),
  );
  const properties = vi.mocked(posthog.capture).mock.calls[0][1];
  expect(properties).not.toHaveProperty("$ai_input");
  expect(properties).not.toHaveProperty("$ai_output_choices");
  expect(JSON.stringify(properties)).not.toContain("private");
});

it("does not capture when analytics is unavailable", () => {
  posthog.__loaded = false;
  captureGeminiLiveGeneration(turn);
  expect(posthog.capture).not.toHaveBeenCalled();
});

it("creates stable session identifiers without invalid characters", () => {
  expect(createGeminiLiveSessionId("voice/123 test")).toBe(
    "gemini-live-voice-123-test",
  );
});
