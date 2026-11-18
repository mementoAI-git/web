export const REPORT_EMAIL = "support@mymemento.io";

/** Builds the mailto link a reader uses to report a story to the Memento team. */
export function reportStoryHref(storyId: string, pageUrl: string) {
  const subject = `Report story ${storyId}`;
  const body = [
    `Story: ${pageUrl}`,
    "",
    "Please describe what’s wrong with this story:",
    "",
  ].join("\n");
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
