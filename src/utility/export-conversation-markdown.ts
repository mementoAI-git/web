import dayjs from "dayjs";

/** Safe single-segment filename (no path); falls back to `conversation`. */
export function sanitizeConversationFilename(name: string, max = 72): string {
  const s = name
    .trim()
    .replace(/[/\\?%*:|"<>!.,;+=[\]{}#^`~]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max);
  return s || "conversation";
}

export function buildConversationMarkdown(
  title: string,
  messages: Array<{ role?: string; text?: string; created_at?: string }>,
  options?: { streamingAssistantText?: string },
): string {
  const safeTitle = (title || "Conversation").replace(/\n/g, " ").trim() || "Conversation";
  const exportedLine = `_Exported ${dayjs().format("MMMM D, YYYY [at] h:mm A")}_`;
  let out = `# ${safeTitle}\n\n${exportedLine}\n\n`;

  for (const m of messages) {
    const isUser = m.role === "user";
    const roleLabel = isUser ? "You" : "Memento";
    const timeSuffix =
      m.created_at && dayjs(m.created_at).isValid()
        ? ` · ${dayjs(m.created_at).format("MMM D, YYYY h:mm A")}`
        : "";
    const body = (m.text ?? "").trim();
    out += `## ${roleLabel}${timeSuffix}\n\n${body}\n\n`;
  }

  const streaming = options?.streamingAssistantText?.trim();
  if (streaming) {
    out += `## Memento (in progress)\n\n${streaming}\n\n`;
  }

  return out.replace(/\n+$/, "\n");
}

export function downloadMarkdownFile(basename: string, markdown: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${basename}.md`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
