import { describe, expect, it, vi } from "vitest";
import { requestSpokenAudio, spokenReplyChunks } from "./spoken-audio";
import { post } from "@/api/mutations";
vi.mock("@/api/mutations", () => ({ post: vi.fn() }));
describe("spoken audio", () => {
  it("keeps narration chunks bounded and preserves their words", () => {
    const text = "A meaningful sentence. ".repeat(250).trim();
    const chunks = spokenReplyChunks(text);
    expect(chunks.every(chunk => chunk.length <= 1200)).toBe(true);
    expect(chunks.join(" ")).toBe(text);
    expect(spokenReplyChunks("```js\nsecret();\n```\n![photo](url)")).toEqual([]);
  });
  it("uses the authenticated API and forwards cancellation without selecting a client voice", async () => {
    const data = { audioBase64: "YXVkaW8=", mimeType: "audio/wav", voiceName: "Kore" };
    vi.mocked(post).mockResolvedValue({ success: true, data });
    const signal = new AbortController().signal;
    expect(await requestSpokenAudio("Hello", signal)).toEqual(data);
    expect(post).toHaveBeenCalledWith("/ai/spoken-reply", { text: "Hello" }, expect.objectContaining({ signal }));
  });
});
