import posthog from "@/lib/posthog";
vi.mock("@/lib/posthog", () => ({ default: { __loaded: true, capture: vi.fn() } }));
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  questionStep,
  resetOnboardingTracking,
  trackOnboardingSkipped,
  trackOnboardingStep,
} from "./onboarding-analytics";

const capture = vi.mocked(posthog.capture);

beforeEach(() => {
  resetOnboardingTracking();
  capture.mockClear();
});

describe("onboarding analytics", () => {
  it("records each step once with its position in the flow", () => {
    trackOnboardingStep("welcome");
    trackOnboardingStep("welcome");
    trackOnboardingStep("reasons");
    expect(capture.mock.calls).toEqual([
      ["onboarding_step_viewed", { step: "welcome", step_number: 1 }],
      ["onboarding_step_viewed", { step: "reasons", step_number: 3 }],
    ]);
  });

  it("records a step again after going back to it", () => {
    trackOnboardingStep("reasons");
    trackOnboardingStep("about");
    trackOnboardingStep("reasons");
    expect(capture).toHaveBeenCalledTimes(3);
  });

  it("records where a skip happened", () => {
    trackOnboardingStep("about");
    trackOnboardingSkipped();
    expect(capture).toHaveBeenLastCalledWith("onboarding_skipped", {
      from_step: "about",
      step_number: 4,
    });
  });

  it("starts fresh after a skip, so returning records the first step again", () => {
    trackOnboardingStep("welcome");
    trackOnboardingSkipped();
    trackOnboardingStep("welcome");
    expect(capture).toHaveBeenLastCalledWith("onboarding_step_viewed", {
      step: "welcome",
      step_number: 1,
    });
  });

  it("maps the three question screens", () => {
    expect([1, 2, 3].map(questionStep)).toEqual(["reasons", "about", "life_areas"]);
  });
});
