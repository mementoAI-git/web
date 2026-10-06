import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOnboardingDraft,
  onboardingDraftKey,
  readOnboardingDraft,
} from "./use-onboarding-draft";

describe("onboarding draft", () => {
  beforeEach(() => sessionStorage.clear());
  it("handles corrupt drafts and separates drafts by account", () => {
    sessionStorage.setItem(onboardingDraftKey("one"), "bad JSON");
    expect(readOnboardingDraft("one")).toEqual({
      step: 1,
      reasons: [],
      about: "",
      areas: [],
    });
    sessionStorage.setItem(
      onboardingDraftKey("one"),
      JSON.stringify({
        step: 3,
        reasons: ["explorer"],
        about: "Hello",
        areas: ["identity_self", "passions_interests"],
      }),
    );
    expect(readOnboardingDraft("two").about).toBe("");
    expect(readOnboardingDraft("one").about).toBe("Hello");
    clearOnboardingDraft("one");
    expect(readOnboardingDraft("one").areas).toEqual([]);
  });
  it("rejects stale keys, deduplicates selections and bounds saved text and areas", () => {
    sessionStorage.setItem(
      onboardingDraftKey("one"),
      JSON.stringify({
        step: 99,
        reasons: ["unknown", "explorer", "explorer"],
        about: "a".repeat(600),
        areas: [
          "identity_self",
          "identity_self",
          "passions_interests",
          "lessons_wisdom",
          "heritage_roots",
          "unknown",
        ],
      }),
    );
    const draft = readOnboardingDraft("one");
    expect(draft.step).toBe(1);
    expect(draft.about).toHaveLength(500);
    expect(draft.reasons).toEqual(["explorer"]);
    expect(draft.areas).toEqual([
      "identity_self",
      "passions_interests",
      "lessons_wisdom",
    ]);
  });
});
