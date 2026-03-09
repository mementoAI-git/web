import { describe, it, expect } from "vitest";
import { getPostTypeLabel } from "@/utility/memory";
import type { IMemory } from "@/utility/interface";

const createMemory = (type: string): IMemory =>
  ({
    _id: "1",
    title: "Test",
    body: "",
    user: "u",
    attachments: [],
    tags: [],
    type,
    status: "active",
    level: 0,
    refrence: "",
    last_opened: "",
    created_at: "",
    updated_at: "",
  }) as IMemory;

describe("getPostTypeLabel", () => {
  it("returns Story when called with no args", () => {
    expect(getPostTypeLabel()).toBe("Story");
  });

  it("returns label from source when source only", () => {
    expect(getPostTypeLabel(undefined, "story")).toBe("Story");
    expect(getPostTypeLabel(undefined, "conversation")).toBe("Chat conversation");
    expect(getPostTypeLabel(undefined, "prompt")).toBe("Daily prompt");
  });

  it("returns label from memory.type when memory only", () => {
    expect(getPostTypeLabel(createMemory("story"))).toBe("Story");
    expect(getPostTypeLabel(createMemory("conversation"))).toBe(
      "Chat conversation",
    );
    expect(getPostTypeLabel(createMemory("chat"))).toBe("Chat conversation");
    expect(getPostTypeLabel(createMemory("prompt"))).toBe("Daily prompt");
  });

  it("lowercases memory.type before lookup", () => {
    expect(getPostTypeLabel(createMemory("Conversation"))).toBe(
      "Chat conversation",
    );
    expect(getPostTypeLabel(createMemory("PROMPT"))).toBe("Daily prompt");
  });

  it("source takes priority over memory.type when both provided", () => {
    expect(getPostTypeLabel(createMemory("prompt"), "story")).toBe("Story");
    expect(getPostTypeLabel(createMemory("story"), "prompt")).toBe("Daily prompt");
  });

  it("returns Story for unknown type", () => {
    expect(getPostTypeLabel(createMemory("unknown"))).toBe("Story");
  });
});
