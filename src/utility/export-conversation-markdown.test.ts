import { describe, expect, it, vi } from "vitest";
import {
  buildConversationMarkdown,
  downloadMarkdownFile,
  sanitizeConversationFilename,
} from "./export-conversation-markdown";

describe("sanitizeConversationFilename", () => {
  it("slugifies and strips unsafe characters", () => {
    expect(sanitizeConversationFilename("Hello / World!!!")).toBe("Hello-World");
    expect(sanitizeConversationFilename("   ")).toBe("conversation");
  });
});

describe("buildConversationMarkdown", () => {
  it("builds headings for user and assistant with optional timestamps", () => {
    const md = buildConversationMarkdown(
      "My chat",
      [
        { role: "user", text: "Hi", created_at: "2024-01-10T15:00:00.000Z" },
        { role: "ai", text: "Hello.", created_at: "2024-01-10T15:01:00.000Z" },
      ],
    );
    expect(md).toMatch(/^# My chat\n\n_Exported /);
    expect(md).toContain("## You");
    expect(md).toContain("## Memento");
    expect(md).toContain("Hi");
    expect(md).toContain("Hello.");
  });

  it("appends streaming assistant section when provided", () => {
    const md = buildConversationMarkdown("T", [], {
      streamingAssistantText: "still typing…",
    });
    expect(md).toContain("## Memento (in progress)");
    expect(md).toContain("still typing…");
  });
});

describe("downloadMarkdownFile", () => {
  it("creates an object URL and triggers download", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const link = {
      href: "",
      download: "",
      rel: "",
      click,
      remove,
    } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(link);
    const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => link);

    downloadMarkdownFile("test-export", "# hi\n");

    expect(createSpy).toHaveBeenCalled();
    expect(link.download).toBe("test-export.md");
    expect(appendSpy).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock");

    createElement.mockRestore();
    appendSpy.mockRestore();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
