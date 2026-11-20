import { postJsonQuiet } from "@/api/fetcher";
import endpoint from "@/api/endpoint";

/**
 * Voice minutes (mobile: src/features/chat/voice-usage.ts). The API counts a
 * call from the moment it connects, using its own clock, so a token fetched
 * ahead of time costs nothing. The page checks in when the call connects,
 * about once a minute, and when it ends, and reports its long silences so a
 * call left open isn't charged for the quiet.
 */

/** How often a live call checks in, so a call that closes abruptly loses at most this much. */
export const VOICE_USAGE_CHECK_IN_MS = 60_000;

/** Silence up to this long counts as part of the conversation; only what follows is free. */
export const VOICE_QUIET_GRACE_MS = 60_000;

/**
 * Measures a call's long silences: the stretches with no speech from either
 * side, less the first minute of each. Only ever grows.
 */
export class VoiceQuietClock {
  private lastActivity: number;
  private banked = 0;

  constructor(startedAt: number = Date.now()) {
    this.lastActivity = startedAt;
  }

  /** Someone spoke (the member or Memento). */
  activity(at: number = Date.now()): void {
    if (at <= this.lastActivity) return;
    this.banked += Math.max(0, at - this.lastActivity - VOICE_QUIET_GRACE_MS);
    this.lastActivity = at;
  }

  /** Seconds of long silence so far, including a silence still going on. */
  quietSeconds(at: number = Date.now()): number {
    const current = Math.max(0, at - this.lastActivity - VOICE_QUIET_GRACE_MS);
    return Math.floor((this.banked + current) / 1000);
  }
}

/** The call's ticket from a voice token response, sent with every check-in. */
export function callTicketFrom(token: unknown): string | null {
  const ticket = (token && typeof token === "object" ? token : {}) as { call_ticket?: unknown };
  return typeof ticket.call_ticket === "string" && ticket.call_ticket ? ticket.call_ticket : null;
}

function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Tells the API the call is connected. Quiet on failure: the next check-in records the time. */
export async function sendVoiceUsageCheckIn(callTicket: string, quietSeconds: number): Promise<void> {
  const timezone = deviceTimeZone();
  await postJsonQuiet(endpoint.voiceUsage, {
    call_ticket: callTicket,
    connected: true,
    quiet_seconds: Math.max(0, Math.floor(quietSeconds)),
    ...(timezone ? { timezone } : {}),
  });
}
