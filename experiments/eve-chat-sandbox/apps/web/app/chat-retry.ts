import type { ConversationState, UseEveAgentHelpers } from "eve/react";

type SessionLifecycleEvent = Pick<
  UseEveAgentHelpers<ConversationState>["events"][number],
  "type"
>;

/** Detects sessions whose durable stream has reached a terminal outcome.
 * @param events - Lifecycle identities from the current authoritative session stream.
 * @returns Whether the next retry must create a fresh session.
 */
export function isTerminalSession(
  events: readonly SessionLifecycleEvent[]
): boolean {
  return events.some(
    (event) =>
      event.type === "session.failed" || event.type === "session.completed"
  );
}
