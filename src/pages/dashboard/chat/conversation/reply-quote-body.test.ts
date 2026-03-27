import { describe, expect, it } from "vitest";
import { replyQuoteBodyFromMessage } from "./reply-quote-body";

describe("replyQuoteBodyFromMessage", () => {
  it("prefers trimmed message text", () => {
    expect(replyQuoteBodyFromMessage("  hi  ", [])).toBe("hi");
  });

  it("uses attachment label when text is empty", () => {
    expect(
      replyQuoteBodyFromMessage("", [{ url: "u", name: "photo.jpg" }]),
    ).toBe("Attachment: photo.jpg");
  });

  it("uses count for multiple attachments", () => {
    expect(
      replyQuoteBodyFromMessage("", [
        { url: "a", name: "a" },
        { url: "b", name: "b" },
      ]),
    ).toBe("2 attachments");
  });

  it("returns null when empty", () => {
    expect(replyQuoteBodyFromMessage("", null)).toBeNull();
    expect(replyQuoteBodyFromMessage("   ", undefined)).toBeNull();
  });
});
