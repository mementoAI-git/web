const DEFAULT_MAX_REPLY_BODY = 4000;
const DEFAULT_SNIPPET = 220;

/** Truncate for UI previews (ellipsis when trimmed). */
export function snippetReplyText(text: string, max = DEFAULT_SNIPPET): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export type ChatReplyQuote = {
  role: string;
  text: string;
};

/**
 * Prefixes the user's message so the model sees explicit reply context.
 * Backend receives a single `text` field; this keeps compatibility.
 */
export function buildPromptWithReplyQuote(
  userText: string,
  replyTo: ChatReplyQuote | null | undefined,
  maxQuotedLength = DEFAULT_MAX_REPLY_BODY,
): string {
  const body = userText.trim();
  if (!replyTo?.text?.trim()) return body;

  const label =
    replyTo.role === "user" ? "the user's earlier message" : "Memento's earlier reply";
  let quoted = replyTo.text.trim();
  if (quoted.length > maxQuotedLength) {
    quoted = `${quoted.slice(0, maxQuotedLength).trimEnd()}…`;
  }

  return (
    `[The user is replying to ${label}:\n` +
    `---\n${quoted}\n---]\n\n` +
    body
  );
}
