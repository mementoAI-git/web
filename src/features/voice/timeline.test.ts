import { describe, expect, it } from "vitest";
import { mergeVoiceTimeline } from "./timeline";

const message = (id: string, minute: number, extra = {}) => ({ _id: id, role: "user", text: id, created_at: `2026-11-06T10:${String(minute).padStart(2, "0")}:00.000Z`, ...extra });
const shape = (rows: ReturnType<typeof mergeVoiceTimeline>) => rows.map(row => row.kind === "message" ? row.message._id : row.kind);

describe("mergeVoiceTimeline", () => {
  it("restores dividers around a saved call", () => {
    const rows = mergeVoiceTimeline([
      message("typed", 0),
      message("said", 1, { is_voice: true, voice_session_id: "call" }),
      message("heard", 2, { voice_session_id: "call" }),
      message("after", 3),
    ], []);
    expect(shape(rows)).toEqual(["typed", "started", "said", "heard", "ended", "after"]);
  });

  it("keeps separate calls apart, including older ones without a call id", () => {
    const rows = mergeVoiceTimeline([
      message("old-1", 0, { is_voice: true }),
      message("old-2", 1, { is_voice: true }),
      message("typed", 2),
      message("new", 3, { voice_session_id: "call" }),
    ], []);
    expect(shape(rows)).toEqual(["started", "old-1", "old-2", "ended", "typed", "started", "new", "ended"]);
  });

  it("does not repeat dividers for a call the live timeline already shows", () => {
    const live = (kind: "started" | "ended", minute: number) => ({ kind, id: kind, memoryId: "m", created_at: `2026-11-06T10:${String(minute).padStart(2, "0")}:00.000Z` });
    const rows = mergeVoiceTimeline([
      message("earlier", 0, { voice_session_id: "old" }),
      message("said", 11, { voice_session_id: "call" }),
    ], [live("started", 10), live("ended", 12)]);
    expect(shape(rows)).toEqual(["started", "earlier", "ended", "started", "said", "ended"]);
  });
});
