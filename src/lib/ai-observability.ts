import posthog from "@/lib/posthog";

type GeminiLiveGeneration = {
  sessionId: string;
  traceId: string;
  model: string;
  latencyMs: number;
  timeToFirstTokenMs?: number | null;
  stopReason: "end_turn" | "interrupted";
};

const AI_IDENTIFIER_PATTERN = /[^A-Za-z0-9\-_~.@()!'|:]/g;

export function createGeminiLiveSessionId(scope: string): string {
  return `gemini-live-${scope}`.replace(AI_IDENTIFIER_PATTERN, "-");
}

/**
 * Gemini Live uses a WebSocket API that is not covered by the provider wrapper,
 * so completed turns are emitted as documented manual AI Observability events.
 */
export function captureGeminiLiveGeneration({
  sessionId,
  traceId,
  model,
  latencyMs,
  timeToFirstTokenMs,
  stopReason,
}: GeminiLiveGeneration): void {
  if (!posthog.__loaded) return;

  posthog.capture("$ai_generation", {
    $ai_trace_id: traceId,
    $ai_session_id: sessionId,
    $ai_span_id: crypto.randomUUID(),
    $ai_span_name: "gemini_live_response",
    $ai_model: model,
    $ai_provider: "gemini",
    // Never send personal voice transcripts or model responses to analytics.
    $ai_latency: latencyMs / 1000,
    $ai_stream: true,
    $ai_stop_reason: stopReason,
    ...(timeToFirstTokenMs == null
      ? {}
      : { $ai_time_to_first_token: timeToFirstTokenMs / 1000 }),
  });
}
