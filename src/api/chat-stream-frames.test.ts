import { describe, expect, it } from "vitest";
import { createChatFrameReader } from "./chat-stream-frames";

describe("chat stream frames", () => {
  it("reads status and model frames before the reply, however it is split", () => {
    const stream = '\u001e{"status":"Looking through your stories…"}\n\u001e{"model":"groq:x"}\nYou wrote about Lagos.';
    for (const size of [1, 3, 7, 200]) {
      const statuses: string[] = [];
      const models: string[] = [];
      const read = createChatFrameReader({ status: (s) => statuses.push(s), model: (m) => models.push(m) });
      let reply = "";
      for (let i = 0; i < stream.length; i += size) reply += read(stream.slice(i, i + size));
      expect(reply).toBe("You wrote about Lagos.");
      expect(statuses).toEqual(["Looking through your stories…"]);
      expect(models).toEqual(["groq:x"]);
    }
  });

  it("passes a plain reply straight through", () => {
    const read = createChatFrameReader({});
    expect(read("Hello")).toBe("Hello");
    expect(read(" there")).toBe(" there");
  });

  it("skips a broken frame without showing it", () => {
    const read = createChatFrameReader({});
    expect(read("\u001e{not json\nHi")).toBe("Hi");
  });
});
