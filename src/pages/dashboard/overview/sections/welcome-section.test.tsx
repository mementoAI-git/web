import { describe, it, expect } from "vitest";
import { getGreetingPunctuation } from "./welcome-section";

describe("getGreetingPunctuation", () => {
  it("returns '?' for question-style greetings", () => {
    expect(getGreetingPunctuation("Can't sleep,")).toBe("?");
    expect(getGreetingPunctuation("Burning the midnight oil,")).toBe("?");
    expect(getGreetingPunctuation("Keeping a late night,")).toBe("?");
    expect(getGreetingPunctuation("Late night session,")).toBe("?");
    expect(getGreetingPunctuation("Still going,")).toBe("?");
  });

  it("returns '.' for statement-style greetings", () => {
    expect(getGreetingPunctuation("Good morning,")).toBe(".");
    expect(getGreetingPunctuation("Rise and shine,")).toBe(".");
    expect(getGreetingPunctuation("Good evening,")).toBe(".");
    expect(getGreetingPunctuation("Night owl mode,")).toBe(".");
  });
});
