import { describe, expect, it } from "vitest";
import {
  ActivityMeter,
  buildRecordingSegments,
  RecordingTranscript,
  speechSpansFromActivity,
  USER_TRANSCRIPT_LAG_MS,
} from "./call-recording";
import {
  buildRecordingSaveBody,
  CallRecordingOutbox,
  RECORDING_OUTBOX_MAX_AGE_MS,
  recordingSavePath,
  type RecordingOutboxEntry,
} from "./outbox";

describe("recording segments", () => {
  it("runs each turn until the next one starts, the last until the end", () => {
    const segments = buildRecordingSegments(
      [{ role: "ai", text: "Hello" }, { role: "user", text: "Hi there" }, { role: "ai", text: "How are you?" }],
      new Map([[0, 0], [1, 4_000], [2, 9_500]]),
      15_000,
    );
    expect(segments).toEqual([
      { start: 0, end: 4, text: "Hello", speaker: "ai" },
      { start: 4, end: 9.5, text: "Hi there", speaker: "user" },
      { start: 9.5, end: 15, text: "How are you?", speaker: "ai" },
    ]);
  });

  it("keeps unseen turns after the previous one, never goes backwards, and drops empty turns", () => {
    const segments = buildRecordingSegments(
      [{ role: "ai", text: "One" }, { role: "user", text: "  " }, { role: "user", text: "Two" }, { role: "ai", text: "Three" }],
      new Map([[0, 2_000], [3, 1_000]]),
      30_000,
    );
    expect(segments.map((segment) => [segment.text, segment.start, segment.end])).toEqual([
      ["One", 2, 2],
      ["Two", 2, 2],
      ["Three", 2, 30],
    ]);
  });

  it("clamps times to the recording", () => {
    const [segment] = buildRecordingSegments([{ role: "ai", text: "Late" }], new Map([[0, 99_000]]), 10_000);
    expect(segment).toMatchObject({ start: 10, end: 10 });
  });
});

describe("speech spans", () => {
  it("merges short pauses, drops blips, and converts 100 ms windows to seconds", () => {
    expect(speechSpansFromActivity(undefined)).toEqual([]);
    expect(speechSpansFromActivity("1100111000000001000011")).toEqual([{ start: 0, end: 0.7 }, { start: 2, end: 2.2 }]);
  });
});

describe("activity meter", () => {
  it("counts recorded time and marks each 100 ms window loud or quiet", () => {
    const meter = new ActivityMeter(1_000);
    meter.push(new Float32Array(100).fill(0.2));
    meter.push(new Float32Array(150).fill(0.001));
    expect(meter.activity).toBe("10");
    expect(meter.elapsedMs).toBe(250);
    // The window in progress counts once it is full, across pushes.
    meter.push(new Float32Array(50).fill(0.5));
    expect(meter.activity).toBe("101");
  });
});

describe("recording transcript", () => {
  it("times each turn by its first fragment, moving the host's back for transcription lag", () => {
    let now = 0;
    const transcript = new RecordingTranscript(() => now);
    now = 1_000;
    transcript.heard("ai", "Hello");
    now = 2_000;
    transcript.heard("ai", " there");
    transcript.endTurn();
    now = 6_000;
    transcript.heard("user", "Hi");
    now = 7_000;
    transcript.heard("ai", "Nice to hear you");
    transcript.endTurn();
    transcript.heard("user", "<noise>");

    expect(transcript.segments(10_000)).toEqual([
      { start: 1, end: (6_000 - USER_TRANSCRIPT_LAG_MS) / 1000, text: "Hello there", speaker: "ai" },
      { start: (6_000 - USER_TRANSCRIPT_LAG_MS) / 1000, end: 7, text: "Hi", speaker: "user" },
      { start: 7, end: 10, text: "Nice to hear you", speaker: "ai" },
    ]);
  });

  it("has no segments when nothing was said", () => {
    const transcript = new RecordingTranscript(() => 0);
    transcript.heard("user", undefined);
    expect(transcript.segments(5_000)).toEqual([]);
  });
});

function memoryStorage() {
  const data = new Map<string, RecordingOutboxEntry>();
  return {
    list: async () => [...data.values()],
    put: async (entry: RecordingOutboxEntry) => { data.set(entry.sessionId, entry); },
    remove: async (sessionId: string) => { data.delete(sessionId); },
  };
}

const entry = {
  sessionId: "s1",
  audio: new Blob(["a"], { type: "audio/mp4" }),
  fileName: "voice_call_1.m4a",
  durationSeconds: 61.6,
  segments: [{ start: 0, end: 1, text: "Hi", speaker: "ai" as const }],
};

describe("call recording outbox", () => {
  it("uploads once, saves, then removes the entry", async () => {
    const outbox = new CallRecordingOutbox(memoryStorage());
    await outbox.add(entry);
    const calls: string[] = [];
    const sent = await outbox.drain({
      upload: async () => { calls.push("upload"); return "f1"; },
      save: async (saved) => { calls.push(`save:${saved.fileId}`); },
    });
    expect(sent).toBe(1);
    expect(calls).toEqual(["upload", "save:f1"]);
    expect(await outbox.entries()).toEqual([]);
  });

  it("keeps the file id after a failed save, so the retry does not upload again", async () => {
    const outbox = new CallRecordingOutbox(memoryStorage());
    await outbox.add(entry);
    let uploads = 0;
    await outbox.drain({ upload: async () => { uploads += 1; return "f1"; }, save: async () => { throw new Error("offline"); } });
    expect((await outbox.entries())[0].fileId).toBe("f1");
    const sent = await outbox.drain({ upload: async () => { uploads += 1; return "f2"; }, save: async () => {} });
    expect(sent).toBe(1);
    expect(uploads).toBe(1);
  });

  it("drops recordings that are too old", async () => {
    let now = 0;
    const outbox = new CallRecordingOutbox(memoryStorage(), () => now);
    await outbox.add(entry);
    now = RECORDING_OUTBOX_MAX_AGE_MS + 1;
    let uploads = 0;
    await outbox.drain({ upload: async () => { uploads += 1; return "f"; }, save: async () => {} });
    expect(uploads).toBe(0);
    expect(await outbox.entries()).toEqual([]);
  });

  it("builds the save request", () => {
    expect(recordingSavePath("a b")).toBe("/ai/voice/calls/a%20b/recording");
    expect(buildRecordingSaveBody({ ...entry, fileId: "f1" })).toEqual({ file_id: "f1", duration_seconds: 62, segments: entry.segments });
    expect(buildRecordingSaveBody({ ...entry, speech: [{ start: 0, end: 1 }], fileId: "f1" }).speech).toEqual([{ start: 0, end: 1 }]);
  });
});
