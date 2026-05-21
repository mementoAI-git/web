import { describe, it, expect } from "vitest";
import {
  migrateLegacyPriorityDimension,
  migrateLegacyPriorityList,
  ONBOARDING_ENRICHMENT_CATEGORY_OPTIONS,
  ENRICHMENT_CATEGORY_OPTIONS,
  DEFERRED_ENRICHMENT_CATEGORIES,
  formatCurrentPriorityAsFocusSentence,
} from "./enrichment-categories";

describe("enrichment-categories", () => {
  it("maps legacy onboarding keys to canonical categories", () => {
    expect(migrateLegacyPriorityDimension("people_relationships")).toBe(
      "relationships_people",
    );
    expect(migrateLegacyPriorityDimension("memories_stories")).toBe(
      "memories_experiences",
    );
    expect(migrateLegacyPriorityDimension("beliefs_values")).toBe("beliefs_worldview");
    expect(migrateLegacyPriorityDimension("wishes_letters")).toBe("hopes_legacy");
    expect(migrateLegacyPriorityDimension("hardships_resilience")).toBe("lessons_wisdom");
    expect(migrateLegacyPriorityDimension("humour_personality")).toBe("identity_self");
  });

  it("passes through canonical keys unchanged", () => {
    expect(migrateLegacyPriorityDimension("relationships_people")).toBe(
      "relationships_people",
    );
  });

  it("returns null for unknown tokens", () => {
    expect(migrateLegacyPriorityDimension("something_else")).toBeNull();
    expect(migrateLegacyPriorityDimension("nope")).toBeNull();
  });

  it("migrateLegacyPriorityList splits commas and dedupes", () => {
    expect(
      migrateLegacyPriorityList(["memories_stories, people_relationships"]),
    ).toEqual(["memories_experiences", "relationships_people"]);
    expect(
      migrateLegacyPriorityList(["relationships_people", "relationships_people"]),
    ).toEqual(["relationships_people"]);
  });

  it("formatCurrentPriorityAsFocusSentence reads as a first-person sentence", () => {
    expect(formatCurrentPriorityAsFocusSentence("Self growth, building a family")).toBe(
      "Right now I'm most focused on Self growth and building a family.",
    );
    expect(
      formatCurrentPriorityAsFocusSentence(["memories_stories", "people_relationships"]),
    ).toBe(
      "Right now I'm most focused on Memories & Experiences and Relationships & People.",
    );
    expect(
      formatCurrentPriorityAsFocusSentence("identity_self, work_purpose, everyday_life"),
    ).toBe(
      "Right now I'm most focused on Identity & Self, Work & Purpose, and Everyday Life.",
    );
  });

  it("onboarding options exclude deferred categories", () => {
    const values = ONBOARDING_ENRICHMENT_CATEGORY_OPTIONS.map((o) => o.value);
    for (const d of DEFERRED_ENRICHMENT_CATEGORIES) {
      expect(values).not.toContain(d);
    }
    expect(ONBOARDING_ENRICHMENT_CATEGORY_OPTIONS.length).toBe(
      ENRICHMENT_CATEGORY_OPTIONS.length - DEFERRED_ENRICHMENT_CATEGORIES.length,
    );
  });
});
