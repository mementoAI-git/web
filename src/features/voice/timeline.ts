import type { IMessage } from "@/utility/interface";
import type { VoiceTimelineEntry } from "./types";

type MessageRow = { kind: "message"; message: Partial<IMessage>; id: string; created_at: string };
type DividerRow = { kind: "started" | "ended"; id: string; created_at: string };
type Row = MessageRow | DividerRow;

/** Tolerates the gap between this device's clock and the server's message times. */
const CLOCK_SKEW_MS = 60_000;

const time = (value: string) => Date.parse(value) || 0;

/**
 * Finds calls in saved messages, so their dividers survive a reload. Calls that
 * began after `liveSince` already have dividers from this page's live timeline.
 */
function savedCallBounds(rows: Row[], liveSince: number | null) {
  const calls = new Map<string, { first: number; last: number }>();
  let openRun: string | null = null;
  rows.forEach((row, index) => {
    if (row.kind !== "message") return;
    // These belong to this page's live calls. Counting them would end an earlier
    // saved call after the newest message, while the current call is still running.
    if (liveSince !== null && time(row.created_at) >= liveSince - CLOCK_SKEW_MS) return;
    const { voice_session_id: sessionId, is_voice: isVoice } = row.message;
    // Older voice messages have no call id, so an unbroken run counts as one call.
    if (!sessionId && isVoice) openRun ??= `run-${row.id}`;
    else openRun = null;
    const key = sessionId ?? openRun;
    if (!key) return;
    const call = calls.get(key);
    if (call) call.last = index;
    else calls.set(key, { first: index, last: index });
  });
  return calls;
}

export function mergeVoiceTimeline(messages: Partial<IMessage>[], entries: VoiceTimelineEntry[]): Row[] {
  const ids = new Set(messages.map(message => message._id).filter(Boolean));
  const rows: Row[] = messages.map((message, index) => ({ kind: "message", message, id: message._id ?? `message-${index}`, created_at: message.created_at ?? "" }));
  const liveStarts: number[] = [];
  for (const entry of entries) {
    if (entry.kind === "message") {
      if (ids.has(entry.message._id)) continue;
      ids.add(entry.message._id);
      rows.push({ kind: "message", message: entry.message, id: entry.id, created_at: entry.created_at });
    } else {
      rows.push(entry);
      if (entry.kind === "started") liveStarts.push(time(entry.created_at));
    }
  }
  rows.sort((a, b) => time(a.created_at) - time(b.created_at));

  const calls = [...savedCallBounds(rows, liveStarts.length ? Math.min(...liveStarts) : null)];
  return rows.flatMap((row, index) => {
    const started: DividerRow[] = [];
    const ended: DividerRow[] = [];
    for (const [key, { first, last }] of calls) {
      if (first === index) started.push({ kind: "started", id: `saved-${key}-started`, created_at: row.created_at });
      if (last === index) ended.push({ kind: "ended", id: `saved-${key}-ended`, created_at: row.created_at });
    }
    return [...started, row, ...ended];
  });
}
