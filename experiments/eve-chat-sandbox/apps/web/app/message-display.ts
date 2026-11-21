import type { EveMessagePart } from "eve/react";

/** Detects visible output while keeping reasoning and step markers hidden.
 * @param parts - The message parts received from the agent.
 * @returns Whether the message has content to display to the person.
 */
export function hasVisibleMessageContent(parts: readonly EveMessagePart[]) {
  return parts.some((part) => {
    if (part.type === "reasoning" || part.type === "step-start") {
      return false;
    }
    return part.type !== "text" || part.text.length > 0;
  });
}
