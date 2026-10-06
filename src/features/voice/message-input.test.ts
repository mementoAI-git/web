import { afterEach, expect, it, vi } from "vitest";
import { buildVoiceInputParts } from "./message-input";
import { mergeVoiceTimeline } from "./timeline";
afterEach(() => vi.unstubAllGlobals());
it("sends uploaded image bytes and text together", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["image-data"], { type: "image/png" }) }));
  expect(await buildVoiceInputParts({ text: "What is in this photo?", attachments: [{ _id: "f1", name: "photo.png", type: "image/png", size: 10, url: "https://files.example/photo" }] })).toEqual([
    { inlineData: { mimeType: "image/png", data: btoa("image-data") } }, { text: "What is in this photo?" },
  ]);
});
it("does not silently pretend to see an unsupported attachment", async () => {
  await expect(buildVoiceInputParts({ text: "Read this", attachments: [{ _id: "f1", name: "report.pdf", type: "application/pdf", size: 10, url: "/file" }] })).rejects.toThrow(/JPEG, PNG, or WebP/);
});
it("merges session markers and transcripts without duplicating messages reloaded from the API", () => {
  const message = { _id: "m1", text: "Hello", created_at: "2026-10-06T10:00:01Z" };
  const rows = mergeVoiceTimeline([message], [
    { id: "s", kind: "started", memoryId: "thread", created_at: "2026-10-06T10:00:00Z" },
    { id: "v", kind: "message", message, memoryId: "thread", created_at: "2026-10-06T10:00:01Z" },
    { id: "e", kind: "ended", memoryId: "thread", created_at: "2026-10-06T10:00:02Z" },
  ]);
  expect(rows.map(row => row.kind)).toEqual(["started", "message", "ended"]);
});
