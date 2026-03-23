/**
 * Text used when replying to a message (composer strip + prompt prefix).
 * Supports image-only user messages.
 */
export function replyQuoteBodyFromMessage(
  text: string | undefined,
  attachments?: { url: string; name: string }[] | null,
): string | null {
  const t = (text ?? "").trim();
  if (t) return t;
  if (!attachments?.length) return null;
  if (attachments.length === 1) {
    const name = attachments[0]?.name?.trim();
    return name ? `Attachment: ${name}` : "Attachment";
  }
  return `${attachments.length} attachments`;
}
