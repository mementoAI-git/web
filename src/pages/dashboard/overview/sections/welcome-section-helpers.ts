/** Greetings that are implied questions; use "?" after the name instead of "." */
const QUESTION_GREETINGS = new Set([
  "Back at it,",
  "Can't sleep,",
  "Burning the midnight oil,",
  "Keeping a late night,",
  "Late night session,",
  "Still going,",
]);

export function getGreetingPunctuation(greeting: string): "." | "?" {
  return QUESTION_GREETINGS.has(greeting) ? "?" : ".";
}

/** Bright control 6:00–16:59 local; moonface from 17:00 (evening) through 5:59. */
export function shouldUseBrightWelcomeIcon(at: Date = new Date()): boolean {
  const hour = at.getHours();
  return hour >= 6 && hour < 17;
}
