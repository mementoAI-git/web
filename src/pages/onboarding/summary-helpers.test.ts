import { describe, expect, it } from "vitest";

import {
  buildPersonalizedHostStarter,
  deriveTouchedCategoriesFromMiscState,
  getPostOnboardingDestination,
} from "./summary-helpers";

describe("onboard summary helpers", () => {
  it("derives touched categories from misc onboarding answers", () => {
    expect(
      deriveTouchedCategoriesFromMiscState({
        ageBand: "30s_40s",
        lifeSituation: "caregiver",
        homePlace: "Lagos",
        personalityTraits: ["warm_caring"],
        memoryTreasures: ["quiet_mornings"],
        passions: ["music"],
        chronotype: "night",
        sharingIntent: "shared_legacy",
        priorityDimensions: ["beliefs_worldview", "relationships_people"],
      }),
    ).toEqual([
      "identity_self",
      "work_purpose",
      "heritage_roots",
      "memories_experiences",
      "everyday_life",
      "passions_interests",
      "relationships_people",
      "beliefs_worldview",
    ]);
  });

  it("maps post-onboarding actions to destination metadata", () => {
    expect(getPostOnboardingDestination("reflection_prompt")).toEqual({
      path: "/explore",
      label: "Browse prompts",
    });
    expect(getPostOnboardingDestination("dashboard")).toEqual({
      path: "/overview",
      label: "Go to dashboard",
    });
  });

  it("builds a personalized host starter from onboarding context", () => {
    expect(
      buildPersonalizedHostStarter({
        nextAction: "dashboard",
        skippedDeepPersonalization: false,
        touchedCategories: ["identity_self"],
        priorityDimensions: ["relationships_people"],
        motivationType: "memory_preservation",
        nickname: "Jane",
        lifeSituation: "caregiver",
        homePlace: "Lagos",
        personalityTraits: ["warm_caring", "thoughtful_quiet"],
        memoryTreasures: ["family_gatherings"],
        sharingIntent: "shared_legacy",
      }),
    ).toContain("Hi Memento, it's Jane.");
    expect(
      buildPersonalizedHostStarter({
        nextAction: "dashboard",
        skippedDeepPersonalization: false,
        touchedCategories: ["identity_self"],
        priorityDimensions: ["relationships_people"],
        motivationType: "memory_preservation",
        nickname: "Jane",
        lifeSituation: "caregiver",
        homePlace: "Lagos",
        personalityTraits: ["warm_caring", "thoughtful_quiet"],
        memoryTreasures: ["family_gatherings"],
        sharingIntent: "shared_legacy",
      }),
    ).toContain("One place we could start is family gatherings.");
  });
});
