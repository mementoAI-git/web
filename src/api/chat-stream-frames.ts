/**
 * Apps that send X-Memento-Chat-Features: status get short frames before
 * the reply's words: a record separator, JSON, a newline. A status says what
 * Memento is doing ("Looking through your stories…"); a model frame carries
 * the model label once headers have gone out. Frames only come first.
 */

export const CHAT_FEATURES_HEADER = { "X-Memento-Chat-Features": "links,cards,status" };

const SEPARATOR = "\u001e";

export function createChatFrameReader(on: { status?: (text: string) => void; model?: (label: string) => void }) {
  let buffer = "";
  let framing = true;
  /** Takes a decoded chunk; returns the part that is reply text. */
  return (chunk: string): string => {
    if (!framing) return chunk;
    buffer += chunk;
    while (buffer.startsWith(SEPARATOR)) {
      const end = buffer.indexOf("\n");
      if (end < 0) return "";
      const json = buffer.slice(1, end);
      buffer = buffer.slice(end + 1);
      try {
        const frame = JSON.parse(json) as { status?: unknown; model?: unknown };
        if (typeof frame.status === "string") on.status?.(frame.status);
        if (typeof frame.model === "string") on.model?.(frame.model);
      } catch {
        // A frame that cannot be read is skipped, never shown.
      }
    }
    if (!buffer) return "";
    framing = false;
    const text = buffer;
    buffer = "";
    return text;
  };
}
