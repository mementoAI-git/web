/**
 * Keeping a voice call going when its connection to Gemini ends: Gemini
 * rotates each Live connection (it warns first with goAway), and networks
 * drop. With the resume handle Gemini keeps sending, a new connection carries
 * on the same conversation. Mirrors mobile's features/chat/voice-connection.ts.
 */

/** Longest Gemini may take to accept a call's first connection. */
export const VOICE_SETUP_TIMEOUT_MS = 20_000;
/** A replacement connection gets less, so one stuck attempt leaves time for another. */
export const VOICE_RESUME_SETUP_TIMEOUT_MS = 10_000;
/** Total time to keep trying before the call ends; enough to ride out a network switch. */
export const VOICE_RECONNECT_BUDGET_MS = 20_000;
export const VOICE_RECONNECT_DELAYS_MS = [0, 500, 1_500, 3_000, 5_000];

export type ReconnectReason = "go-away" | "connection-lost" | "network-change";
export type ReconnectResult = "reconnected" | "in-progress" | "unavailable" | "ended" | "failed";

/**
 * Wait before reconnect attempt `attempt`, or null to give up. The number of
 * attempts alone doesn't bound recovery; the time already spent does.
 */
export function nextReconnectDelay(attempt: number, elapsedMs: number): number | null {
  if (attempt >= VOICE_RECONNECT_DELAYS_MS.length) return null;
  const delay = VOICE_RECONNECT_DELAYS_MS[attempt];
  return elapsedMs + delay >= VOICE_RECONNECT_BUDGET_MS ? null : delay;
}

/** The handle Gemini sends for carrying the call over to a new connection, when it can. */
export function resumeHandleFrom(update: { resumable?: boolean; newHandle?: string } | undefined): string | undefined {
  return update?.resumable && typeof update.newHandle === "string" && update.newHandle ? update.newHandle : undefined;
}
