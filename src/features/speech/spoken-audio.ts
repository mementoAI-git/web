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

/** Keep narration short enough to start promptly, preferring sentence boundaries. */
export function spokenReplyChunks(text: string): string[] {
  const plain = text.replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/gm, "")
    .replace(/[*`~]/g, "").trim();
  const chunks: string[] = [];
  let remaining = plain;
  while (remaining.length > 1200) {
    const sample = remaining.slice(0, 1200);
    const sentence = Math.max(sample.lastIndexOf(". "), sample.lastIndexOf("! "), sample.lastIndexOf("? "), sample.lastIndexOf("\n"));
    const space = sample.lastIndexOf(" ");
    const end = sentence > 400 ? sentence + 1 : space > 0 ? space : 1200;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}
