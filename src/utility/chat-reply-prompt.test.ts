import { describe, expect, it } from "vitest";
import {
  buildPromptWithReplyQuote,
  snippetReplyText,
} from "./chat-reply-prompt";

describe("snippetReplyText", () => {
  it("returns short text unchanged", () => {
    expect(snippetReplyText("hi", 10)).toBe("hi");
  });

  it("truncates long text with ellipsis", () => {
    expect(snippetReplyText("1234567890", 5)).toBe("1234…");
  });
});

describe("buildPromptWithReplyQuote", () => {
  it("returns user text only when no reply", () => {
    expect(buildPromptWithReplyQuote("Hello", null)).toBe("Hello");
    expect(buildPromptWithReplyQuote("Hello", undefined)).toBe("Hello");
  });

  it("prefixes reply context for assistant messages", () => {
    const out = buildPromptWithReplyQuote("Thanks", {
      role: "ai",
      text: "Here is help.",
    });
    expect(out).toContain("replying to Memento's earlier reply");
    expect(out).toContain("Here is help.");
    expect(out).toContain("Thanks");
  });

  it("uses user label when replying to a user message", () => {
    const out = buildPromptWithReplyQuote("Yep", {
      role: "user",
      text: "Earlier",
    });
    expect(out).toContain("user's earlier message");
  });
});
