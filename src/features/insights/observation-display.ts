const LEGACY_SUBJECT_PATTERN =
  /^(?:the user|the member|the host)\s+([A-Za-z]+)\b/i;

function toSecondPersonVerb(verb: string): string {
  const lowercase = verb.toLowerCase();
  const irregularVerbs: Record<string, string> = {
    is: "are",
    was: "were",
    has: "have",
    does: "do",
  };

  if (irregularVerbs[lowercase]) return irregularVerbs[lowercase];
  if (lowercase.endsWith("ies") && lowercase.length > 3)
    return `${lowercase.slice(0, -3)}y`;
  if (
    lowercase.endsWith("ses") ||
    lowercase.endsWith("xes") ||
    lowercase.endsWith("zes")
  ) {
    return lowercase.slice(0, -2);
  }
  if (lowercase.endsWith("ches") || lowercase.endsWith("shes"))
    return lowercase.slice(0, -2);
  if (lowercase.endsWith("s") && !lowercase.endsWith("ss"))
    return lowercase.slice(0, -1);

  return lowercase;
}

/**
 * Safely presents older third-person observations in the member's voice.
 *
 * New observations are generated in second person. This narrow normalization
 * only handles the legacy subject at the beginning of a sentence and leaves
 * names and in-sentence references untouched.
 */
export function normalizeObservationForDisplay(observation: string): string {
  return observation.replace(LEGACY_SUBJECT_PATTERN, (_match, verb: string) => {
    return `You ${toSecondPersonVerb(verb)}`;
  });
}

/**
 * Splits a stored observation into a headline and supporting detail. Most
 * records are one sentence, so `detail` is empty unless the text provides it.
 */
export function splitObservation(observation: string): {
  title: string;
  detail: string;
} {
  const text = observation.trim();
  const match = text.match(/^(.+?)[.!?](?:\s+)(\S[\s\S]*)$/);
  if (!match) return { title: text.replace(/[.!]$/, ""), detail: "" };
  return { title: match[1], detail: match[2].trim() };
}

/** Rebuilds the stored wording from a headline and its supporting detail. */
export function joinObservation(title: string, detail: string): string {
  const heading = title.trim();
  const note = detail.trim();
  if (!note) return heading;
  return `${/[.!?]$/.test(heading) ? heading : `${heading}.`} ${note}`;
}
