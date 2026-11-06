import { describe, it, expect } from "vitest";
import {
  getStep4Headline,
  getStep5Body,
  getPrimaryCTA,
} from "./adaptive";
import type { ExpressionMode } from "./types";

describe("getStep4Headline", () => {
  it("returns emotional_depth headline", () => {
    expect(getStep4Headline("emotional_depth")).toBe(
      "How do you most naturally open up?"
    );
  });

  it("returns external headline", () => {
    expect(getStep4Headline("external")).toBe(
      "How do you most naturally open up?"
    );
  });

  it("returns memory_preservation headline", () => {
    expect(getStep4Headline("memory_preservation")).toBe(
      "How would you most like to add to your Memento?"
    );
  });

  it("returns practical headline", () => {
    expect(getStep4Headline("practical")).toBe(
      "How would you most like to add to your Memento?"
    );
  });

  it("returns explorer headline", () => {
    expect(getStep4Headline("explorer")).toBe("What feels most like you?");
  });

  it("returns default for null", () => {
    expect(getStep4Headline(null)).toBe("What feels most like you?");
  });
});

describe("getStep5Body", () => {
  it("returns partial personalization copy", () => {
    expect(
      getStep5Body("explorer", { partialPersonalization: true }),
    ).toMatch(/solid start/i);
  });

  it("returns self_understanding body", () => {
    expect(getStep5Body("self_understanding")).toMatch(/discover yourself/i);
  });

  it("returns personal_space body", () => {
    expect(getStep5Body("personal_space")).toMatch(/Make yourself at home/i);
  });
  it("returns emotional_depth body", () => {
    expect(getStep5Body("emotional_depth")).toBe(
      "Start with something that matters to you — even a small memory is the beginning of something lasting."
    );
  });

  it("returns memory_preservation body", () => {
    expect(getStep5Body("memory_preservation")).toBe(
      "Your memories are safe here. Let's capture the first one right now."
    );
  });

  it("returns external body", () => {
    expect(getStep5Body("external")).toBe(
      "Whoever asked you to do this — they'll be glad you did. Let's make a start."
    );
  });

  it("returns practical body", () => {
    expect(getStep5Body("practical")).toBe(
      "Everything in its place. Let's set up your first piece of your Memento."
    );
  });

  it("returns explorer body", () => {
    expect(getStep5Body("explorer")).toBe(
      "No pressure — take a look around and start wherever feels right."
    );
  });

  it("returns default for null", () => {
    expect(getStep5Body(null)).toBe(
      "No pressure — take a look around and start wherever feels right."
    );
  });
});

describe("getPrimaryCTA", () => {
  it("no longer suggests a time capsule for practical motivation", () => {
    const result = getPrimaryCTA("practical", ["voice", "writing"]);
    expect(result.action).toBe("voice_recorder");
  });

  it("returns dashboard for explorer motivation", () => {
    const result = getPrimaryCTA("explorer", ["voice", "media"]);
    expect(result.action).toBe("dashboard");
    expect(result.label).toBe("Go to dashboard");
  });

  it("returns file_upload for memory_preservation + media", () => {
    const result = getPrimaryCTA("memory_preservation", ["media"]);
    expect(result.action).toBe("file_upload");
    expect(result.label).toBe("Upload something precious");
  });

  it("returns voice_recorder when voice is preferred over writing", () => {
    const result = getPrimaryCTA("emotional_depth", ["voice", "writing"]);
    expect(result.action).toBe("voice_recorder");
    expect(result.label).toBe("Record your first memory");
  });

  it("returns voice_recorder for voice only", () => {
    const result = getPrimaryCTA("emotional_depth", ["voice"]);
    expect(result.action).toBe("voice_recorder");
  });

  it("returns reflection_prompt for guided", () => {
    const result = getPrimaryCTA("emotional_depth", ["guided"]);
    expect(result.action).toBe("reflection_prompt");
    expect(result.label).toBe("Answer your first prompt");
  });

  it("returns reflection_prompt for writing", () => {
    const result = getPrimaryCTA("emotional_depth", ["writing"]);
    expect(result.action).toBe("reflection_prompt");
  });

  it("returns reflection_prompt for guided + writing (no voice)", () => {
    const result = getPrimaryCTA("memory_preservation", ["guided", "writing"]);
    expect(result.action).toBe("reflection_prompt");
  });

  it("returns file_upload for media only (non-memory_preservation)", () => {
    const result = getPrimaryCTA("emotional_depth", ["media"]);
    expect(result.action).toBe("file_upload");
    expect(result.label).toBe("Upload something precious");
  });

  it("goes to the dashboard for practical + empty modes (misc / no expression)", () => {
    const result = getPrimaryCTA("practical", [] as ExpressionMode[]);
    expect(result.action).toBe("dashboard");
  });

  it("returns voice_recorder for emotional_depth + empty modes (misc / no expression)", () => {
    const result = getPrimaryCTA("emotional_depth", [] as ExpressionMode[]);
    expect(result.action).toBe("voice_recorder");
    expect(result.label).toBe("Record your first memory");
  });

  it("returns Open your space for self_understanding + empty modes", () => {
    const result = getPrimaryCTA("self_understanding", [] as ExpressionMode[]);
    expect(result.action).toBe("dashboard");
    expect(result.label).toBe("Open your space");
  });

  it("returns dashboard for null motivation", () => {
    const result = getPrimaryCTA(null, ["media"]);
    expect(result.action).toBe("dashboard");
  });
});
