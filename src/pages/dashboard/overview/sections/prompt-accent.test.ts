import { describe, expect, it } from "vitest";
import { getPromptAccent } from "./prompt-accent";

describe("getPromptAccent", () => {
  it.each([
    [
      "Think of a recent happy memory with your family. What happened and why is it meaningful?",
      "meaningful",
    ],
    [
      "How do you express appreciation to someone you care about?",
      "appreciation",
    ],
    [
      "What values did your family emphasize while you were growing up?",
      "values",
    ],
    ["What makes you feel most at peace?", "peace"],
    ["What adventure would you like to share with us?", "adventure"],
    ["What activity do you enjoy most?", "activity"],
    ["What traditions make your family’s celebrations special?", "traditions"],
  ])("accents a defining word in %s", (text, expected) => {
    const accent = getPromptAccent(text);
    expect(accent).not.toBeNull();
    expect(text.slice(accent!.start, accent!.end)).toBe(expected);
    expect(
      text.slice(0, accent!.start) +
        text.slice(accent!.start, accent!.end) +
        text.slice(accent!.end),
    ).toBe(text);
  });

  it.each(["", "How are you?"])(
    "does not accent generic wording in %s",
    (text) => {
      expect(getPromptAccent(text)).toBeNull();
    },
  );
});
