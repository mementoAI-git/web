import { describe, expect, it, vi } from "vitest";
import { requestSpokenAudio, spokenReplyChunks, takeSpokenStream } from "./spoken-audio";
import { post } from "@/api/mutations";
vi.mock("@/api/mutations", () => ({ post: vi.fn() }));
describe("spoken audio", () => {
  it("keeps narration chunks bounded and preserves their words", () => {
    const text = "A meaningful sentence. ".repeat(250).trim();
    const chunks = spokenReplyChunks(text);
    expect(chunks[0].length).toBeLessThanOrEqual(200);
    expect(chunks.every(chunk => chunk.length <= 480)).toBe(true);
    expect(chunks.join(" ")).toBe(text);
    expect(spokenReplyChunks("```js\nsecret();\n```\n![photo](url)")).toEqual([]);
  });
  it("releases the first complete sentence before the response finishes", () => {
    expect(takeSpokenStream("The first sentence is ready. The next part", false, true)).toEqual({chunks: ["The first sentence is ready."], remainder: " The next part"});
    expect(takeSpokenStream("An unfinished sentence", false, true).chunks).toEqual([]);
  });
  it("keeps streamed code and incomplete links out of speech", () => {
    const partial = "```js\nsecret(); Another sentence. ";
    expect(takeSpokenStream(partial, false, true).chunks).toEqual([]);
    expect(takeSpokenStream(partial + "```\nA real reply. More", false, true).chunks).toEqual(["A real reply."]);
    expect(takeSpokenStream("[Read this sentence. More", false, true).chunks).toEqual([]);
    expect(takeSpokenStream("[Read this sentence. More](https://example.com). Next", false, true).chunks).toEqual(["Read this sentence. More."]);
  });
  it("flushes the final fragment exactly once and bounds long unpunctuated openings", () => {
    expect(takeSpokenStream("The final fragment", true, false)).toEqual({chunks: ["The final fragment"], remainder: ""});
    const result = takeSpokenStream("word ".repeat(100), false, true);
    expect(result.chunks[0].length).toBeLessThanOrEqual(200);
    expect([...result.chunks, result.remainder.trim()].join(" ")).toBe("word ".repeat(100).trim());
  });
  it("uses the authenticated API and forwards cancellation without selecting a client voice", async () => {
    const data = { audioBase64: "YXVkaW8=", mimeType: "audio/wav", voiceName: "Kore" };
    vi.mocked(post).mockResolvedValue({ success: true, data });
    const signal = new AbortController().signal;
    expect(await requestSpokenAudio("Hello", signal)).toEqual(data);
    expect(post).toHaveBeenCalledWith("/ai/spoken-reply", { text: "Hello" }, expect.objectContaining({ signal }));
  });
});
