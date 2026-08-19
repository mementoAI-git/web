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
