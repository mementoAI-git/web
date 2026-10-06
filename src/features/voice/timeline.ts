import type { IMessage } from "@/utility/interface";
import type { VoiceTimelineEntry } from "./types";

type Row = { kind: "message"; message: Partial<IMessage>; id: string; created_at: string } | Exclude<VoiceTimelineEntry, { kind: "message" }>;
export function mergeVoiceTimeline(messages: Partial<IMessage>[], entries: VoiceTimelineEntry[]): Row[] {
  const ids = new Set(messages.map(message => message._id).filter(Boolean));
  const rows: Row[] = messages.map((message, index) => ({ kind: "message", message, id: message._id ?? `message-${index}`, created_at: message.created_at ?? "" }));
  for (const entry of entries) {
    if (entry.kind === "message") {
      if (ids.has(entry.message._id)) continue;
      ids.add(entry.message._id);
      rows.push({ kind: "message", message: entry.message, id: entry.id, created_at: entry.created_at });
    } else rows.push(entry);
  }
  return rows.sort((a, b) => (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0));
}
