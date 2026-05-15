import { describe, expect, it } from "vitest";

import {
  mapOnboardingDetailsToMiscState,
  mapOnboardingDetailsToState,
  type OnboardingDetailsResponse,
} from "./onboarding";

describe("onboarding API mappers", () => {
  it("maps misc onboarding details into misc revisit state", () => {
    const data: OnboardingDetailsResponse = {
      onboarding_status: "completed",
      user: {
        first_name: "Jane",
        last_name: "Doe",
        nickname: "Jane",
        full_name: "Jane Doe",
        age_range: "30s_40s",
        location: "Lagos",
        chronotype: "night",
        sharing_intent: "shared_legacy",
        onboarding_step_reached: 12,
        skipped_deep_personalization: false,
      },
      persona: {
        join_reasons: ["family_relationships", "custom passion"],
        audience: ["children"],
        current_priority: ["people_relationships", "memories_stories"],
        communication_style: [],
        prefered_communication_style: "voice",
        motivation: "memory_preservation",
        motivation_detail: "I want this in my own words",
        life_situation: "caregiver",
        life_situation_detail: "Helping my dad every day",
        personality_traits: ["warm_caring", "strong_dependable"],
        memory_treasures: ["quiet_mornings", "family_gatherings"],
      },
    };

    expect(mapOnboardingDetailsToMiscState(data)).toMatchObject({
      step: 12,
      motivationChip: "memory_preservation",
      motivationDetail: "I want this in my own words",
      ageBand: "30s_40s",
      lifeSituation: "caregiver",
      lifeSituationDetail: "Helping my dad every day",
      homePlace: "Lagos",
      personalityTraits: ["warm_caring", "strong_dependable"],
      memoryTreasures: ["quiet_mornings", "family_gatherings"],
      passions: ["family_relationships"],
      passionsDetail: "custom passion",
      chronotype: "night",
      sharingIntent: "shared_legacy",
      priorityDimensions: ["relationships_people", "memories_experiences"],
      skippedDeepPersonalization: false,
    });
  });

  it("keeps existing Groot revisit mapping intact", () => {
    const data: OnboardingDetailsResponse = {
      onboarding_status: "completed",
      user: {
        first_name: "Jane",
        last_name: "Doe",
        nickname: "Jane",
        full_name: "Jane Doe",
        age_range: "30s_40s",
        location: "London",
      },
      persona: {
        join_reasons: ["family_history_heritage", "custom passion"],
        audience: ["children", "partner_spouse"],
        current_priority: ["people_relationships", "memories_stories"],
        communication_style: [],
        prefered_communication_style: "voice",
      },
    };

    expect(mapOnboardingDetailsToState(data)).toMatchObject({
      fullName: "Jane Doe",
      displayName: "Jane",
      ageBand: "30s_40s",
      whereFrom: "London",
      mementoFor: ["children", "partner_spouse"],
      passions: ["family_history_heritage"],
      passionsFreetext: "custom passion",
      priorityDimensions: ["relationships_people", "memories_experiences"],
      expressionMode: ["voice"],
      isRevisitMode: true,
    });
  });
});
