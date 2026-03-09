import type { IMemory } from "./interface";

export type PostTypeSource = "story" | "conversation" | "prompt";

const POST_TYPE_LABELS: Record<string, string> = {
  story: "Story",
  conversation: "Chat conversation",
  chat: "Chat conversation",
  prompt: "Daily prompt",
};

export function getPostTypeLabel(memory?: IMemory, source?: PostTypeSource): string {
  const type = source ?? memory?.type?.toLowerCase();
  return (type && POST_TYPE_LABELS[type]) ?? "Story";
}
