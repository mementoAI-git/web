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
  // Say "minutes left" outright: "5 of your 90" read as five lots of 90.
  const minutes = Math.floor(secondsLeft / 60);
  const left =
    minutes < 1 ? "less than a minute" : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `You have ${left} of voice mode left this month. Free includes ${FREE_VOICE_MINUTES} minutes a month.`;
}
