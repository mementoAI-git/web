import { describe, expect, it } from "vitest";
import { pullSharedLinks } from "./chat-link-utils";

describe("pullSharedLinks", () => {
  it("removes bare URLs and tidies the remaining text", () => {
    expect(pullSharedLinks("Visit https://example.com/a, then reply.")).toEqual({
      body: "Visit, then reply.",
      urls: ["https://example.com/a"],
    });
  });

  it("keeps markdown links, code spans and duplicates out of the cards", () => {
    const text = "See [docs](https://example.com/docs) and `https://x.dev` https://a.io https://a.io/";
    expect(pullSharedLinks(text)).toEqual({
      body: "See [docs](https://example.com/docs) and `https://x.dev`",
      urls: ["https://a.io"],
    });
  });

  it("returns text untouched when there are no bare URLs", () => {
    expect(pullSharedLinks("  hello  ")).toEqual({ body: "  hello  ", urls: [] });
  });
});
