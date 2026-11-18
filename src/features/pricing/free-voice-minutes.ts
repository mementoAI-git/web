import type { SubscriptionSummary } from "./types";

/** Free members' monthly voice allowance, in minutes. */
export const FREE_VOICE_MINUTES = 90;

/**
 * Seconds of voice mode a free member has left this month, or null when the
 * API did not say (an older API); the server still refuses once they are used.
 */
export function freeVoiceSecondsLeft(summary: SubscriptionSummary | null): number | null {
  const left = summary?.usage?.voice_seconds_left;
  return typeof left === "number" ? Math.max(0, left) : null;
}

export function describeFreeVoiceMinutes(secondsLeft: number | null): string {
  if (secondsLeft === null) {
    return `Free includes ${FREE_VOICE_MINUTES} minutes of voice mode each month.`;
  }
  const minutes = Math.max(1, Math.floor(secondsLeft / 60));
  return `You have ${minutes} of your ${FREE_VOICE_MINUTES} free minutes left this month.`;
}
