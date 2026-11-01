import endpoint from "@/api/endpoint";
import { post } from "@/api/mutations";

export interface SpokenAudio { audioBase64: string; mimeType: "audio/wav"; voiceName: string }

export async function requestSpokenAudio(text: string, signal: AbortSignal): Promise<SpokenAudio> {
  const response = await post<SpokenAudio>(endpoint.spokenReply, { text }, { signal, timeout: 50_000 });
  if (response.success === false || !response.data?.audioBase64 || response.data.mimeType !== "audio/wav") {
    throw new Error("Spoken audio is unavailable.");
  }
  return response.data;
}

/** Keep synthesis requests short, especially the first audible clip. */
export function spokenReplyChunks(text: string, firstClipLimit = 200): string[] {
  const plain = text.replace(/```[\s\S]*?(?:```|$)/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/gm, "")
    .replace(/[*`~]/g, "").trim();
  const chunks: string[] = [];
  let remaining = plain;
  while (remaining) {
    const limit = chunks.length ? 480 : firstClipLimit;
    if (remaining.length <= limit) { chunks.push(remaining); break; }
    const sample = remaining.slice(0, limit);
    const sentence = Math.max(sample.lastIndexOf(". "), sample.lastIndexOf("! "), sample.lastIndexOf("? "), sample.lastIndexOf("\n"));
    const space = sample.lastIndexOf(" ");
    const end = sentence > 40 ? sentence + 1 : space > 0 ? space : limit;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  return chunks;
}

/** Consume stable raw-text boundaries so streaming Markdown cannot shift offsets. */
export function takeSpokenStream(text: string, final: boolean, first: boolean) {
  const chunks: string[] = [];
  let start = 0;
  let fenced = false;
  let inline = false;
  let brackets = 0;
  let parentheses = 0;
  let lastSpace = -1;
  for (let index = 0; index < text.length; index++) {
    if (text.startsWith("```", index)) { fenced = !fenced; index += 2; continue; }
    if (fenced) continue;
    const char = text[index];
    if (char === "`") inline = !inline;
    if (inline) continue;
    if (char === "[") brackets++;
    if (char === "]") brackets = Math.max(0, brackets - 1);
    if (char === "(" && text[index - 1] === "]") parentheses++;
    if (char === ")") parentheses = Math.max(0, parentheses - 1);
    if (brackets || parentheses) continue;
    if (/\s/.test(char)) lastSpace = index;
    const limit = first && !chunks.length ? 200 : 480;
    const minimum = first && !chunks.length ? 0 : 120;
    const sentence = /[.!?]/.test(char) && /\s/.test(text[index + 1] || "") && index - start >= minimum;
    const bounded = index - start >= limit && lastSpace > start;
    if (!sentence && !bounded) continue;
    const end = sentence ? index + 1 : lastSpace;
    chunks.push(...spokenReplyChunks(text.slice(start, end), first && !chunks.length ? 200 : 480));
    start = end;
  }
  if (final) { chunks.push(...spokenReplyChunks(text.slice(start), first && !chunks.length ? 200 : 480)); start = text.length; }
  return {chunks, remainder: text.slice(start)};
}
