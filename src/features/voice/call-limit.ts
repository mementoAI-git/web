/**
 * The time limit on a voice call (mobile:
 * src/features/chat/voice-call-limit.ts). The API sets it, from the optional
 * per-call limit (VOICE_MAX_CALL_MINUTES) or, on the free plan, the voice
 * minutes left this month, and sends it with each token: a signed ticket for
 * when the call started, and how many seconds are left. The page gives a
 * spoken heads-up shortly before the end, then asks Memento to say goodbye.
 */
export type VoiceCallTime = {
  /** Sent back with every reconnect so the server keeps counting from the start. */
  ticket: string;
  /** Seconds left when the token was issued. */
  secondsLeft: number;
  /** What ends the call: its own time limit, or the free plan's monthly voice minutes running out. */
  reason: "call" | "free_monthly";
};

/** How long before the end Memento mentions that time is nearly up. */
export const CALL_LIMIT_WARNING_MS = 2 * 60_000;

export const CALL_ENDING_SOON_PROMPT =
  "About two minutes are left in this call. When there is a natural pause, let them know gently, in one short sentence, and offer to pick up again in a new call. Then carry on.";

export const CALL_TIME_UP_PROMPT =
  "The time for this call is up. Say a short, warm goodbye in one sentence now, and say they can start a new call any time.";

export const CALL_TIME_UP_MESSAGE = "This call reached its time limit. Start a new call to keep talking.";

export const FREE_MINUTES_ENDING_SOON_PROMPT =
  "About two minutes of their free voice minutes for this month are left. When there is a natural pause, let them know gently, in one short sentence. Then carry on.";

export const FREE_MINUTES_UP_PROMPT =
  "Their free voice minutes for this month are used up. Say a short, warm goodbye in one sentence now, and mention they can upgrade to Pro to keep talking.";

export const FREE_MINUTES_UP_MESSAGE = "You’ve used this month’s 90 free voice minutes. Upgrade to Pro to keep talking.";

/** What to say near and at the end of a call, for whichever limit ends it. */
export function callLimitWording(reason: VoiceCallTime["reason"]) {
  return reason === "free_monthly"
    ? { endingSoon: FREE_MINUTES_ENDING_SOON_PROMPT, timeUp: FREE_MINUTES_UP_PROMPT, message: FREE_MINUTES_UP_MESSAGE }
    : { endingSoon: CALL_ENDING_SOON_PROMPT, timeUp: CALL_TIME_UP_PROMPT, message: CALL_TIME_UP_MESSAGE };
}

export function parseVoiceCallTime(response: unknown): VoiceCallTime | undefined {
  const data = (response && typeof response === "object" ? response : {}) as Record<string, unknown>;
  const ticket = data.call_ticket;
  const secondsLeft = data.call_seconds_left;
  if (typeof ticket !== "string" || !ticket || typeof secondsLeft !== "number" || !(secondsLeft > 0)) {
    return undefined;
  }
  return { ticket, secondsLeft, reason: data.call_limit_reason === "free_monthly" ? "free_monthly" : "call" };
}

/** When, from now, to give the heads-up (if there is time for one) and to end. */
export function callLimitSchedule(secondsLeft: number): { warnInMs: number | null; endInMs: number } {
  const endInMs = Math.max(0, Math.round(secondsLeft * 1000));
  const warnInMs = endInMs - CALL_LIMIT_WARNING_MS;
  return { warnInMs: warnInMs > 0 ? warnInMs : null, endInMs };
}

type ApiFailure = {
  httpStatus?: number;
  status?: number;
  details?: { reason?: string; feature?: string };
  data?: { reason?: string; feature?: string };
} | null;

/** The server refused to reconnect because the call's time is up. */
export function isCallTimeUp(error: unknown): boolean {
  const failure = error as ApiFailure;
  const reason = failure?.details?.reason ?? failure?.data?.reason;
  return (failure?.httpStatus ?? failure?.status) === 403 && reason === "voice_call_limit";
}

/** The server refused to reconnect because the free plan's voice minutes for the month are used up. */
export function isFreeVoiceMinutesUp(error: unknown): boolean {
  const failure = error as ApiFailure;
  const feature = failure?.details?.feature ?? failure?.data?.feature;
  return (failure?.httpStatus ?? failure?.status) === 402 && feature === "voice_mode";
}
