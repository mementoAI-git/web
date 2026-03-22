import { describe, it, expect } from "vitest";
import { buildSettingsAboutMeParagraphs } from "./build-settings-about-me";
import { createMockUser } from "@/test/fixtures";

describe("buildSettingsAboutMeParagraphs", () => {
  it("returns null when there are no onboarding signals", () => {
    expect(buildSettingsAboutMeParagraphs(null)).toBeNull();
    expect(
      buildSettingsAboutMeParagraphs(
        createMockUser({
          context: {
            self_description: "",
            current_priority: "",
            join_reasons: [],
          },
          preferences: {},
        }),
      ),
    ).toBeNull();
  });

  it("returns at most three first-person paragraphs with mapped onboarding labels", () => {
    const paragraphs = buildSettingsAboutMeParagraphs(
      createMockUser({
        context: {
          self_description: "reading_learning, music",
          current_priority: "memories_stories, people_relationships",
          join_reasons: ["emotional_depth"],
          goals_and_aspirations: ["Be present for family"],
        },
        preferences: {
          communication_style: "casual",
          conversation_tone: "calm",
          response_length: "medium",
          topics_of_interest: ["family", "travel"],
        },
      }),
    );
    expect(paragraphs).toBeTruthy();
    expect(paragraphs!.length).toBeGreaterThanOrEqual(1);
    expect(paragraphs!.length).toBeLessThanOrEqual(3);
    const joined = paragraphs!.join(" ");
    expect(joined).toMatch(/^I['’]m|^I tend|^When I went|^The parts/);
    expect(joined).toMatch(/reading & learning/i);
    expect(joined).toMatch(/stories & adventures/i);
    expect(joined).toMatch(/truly know me/i);
  });
});
