import { describe, it, expect } from "vitest";
import {
  ARCHETYPE_OPTIONS,
  DIMENSION_OPTIONS,
  ONBOARDING_DIMENSION_OPTIONS,
  MOTIVATION_OPTIONS,
  EXPRESSION_OPTIONS,
  STEP_LABELS,
  ADVANCE_LABELS,
} from "./types";
import type { EnrichmentCategory, ExpressionMode, HostArchetype, MotivationType } from "./types";

describe("onboarding-groot types", () => {
  it("ARCHETYPE_OPTIONS has 5 entries with value, label, sublabel, icon", () => {
    expect(ARCHETYPE_OPTIONS).toHaveLength(5);
    const expectedValues: HostArchetype[] = [
      "family",
      "life_lived",
      "planning",
      "young",
      "other",
    ];
    ARCHETYPE_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(expectedValues[i]);
      expect(typeof opt.label).toBe("string");
      expect(opt.label.length).toBeGreaterThan(0);
      expect(typeof opt.sublabel).toBe("string");
      expect(typeof opt.icon).toBe("string");
    });
  });

  it("MOTIVATION_OPTIONS has 5 entries", () => {
    expect(MOTIVATION_OPTIONS).toHaveLength(5);
    const expectedValues: MotivationType[] = [
      "emotional_depth",
      "memory_preservation",
      "external",
      "practical",
      "explorer",
    ];
    MOTIVATION_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(expectedValues[i]);
      expect(typeof opt.label).toBe("string");
      expect(typeof opt.sublabel).toBe("string");
      expect(typeof opt.icon).toBe("string");
    });
  });

  it("DIMENSION_OPTIONS lists all 10 EnrichmentCategory values", () => {
    expect(DIMENSION_OPTIONS).toHaveLength(10);
    const expectedValues: EnrichmentCategory[] = [
      "identity_self",
      "relationships_people",
      "work_purpose",
      "memories_experiences",
      "beliefs_worldview",
      "passions_interests",
      "heritage_roots",
      "lessons_wisdom",
      "hopes_legacy",
      "everyday_life",
    ];
    DIMENSION_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(expectedValues[i]);
      expect(typeof opt.label).toBe("string");
      expect(typeof opt.sublabel).toBe("string");
      expect(typeof opt.icon).toBe("string");
    });
  });

  it("ONBOARDING_DIMENSION_OPTIONS omits deferred enrichment categories", () => {
    expect(ONBOARDING_DIMENSION_OPTIONS.length).toBe(8);
    const values = ONBOARDING_DIMENSION_OPTIONS.map((o) => o.value);
    expect(values).not.toContain("lessons_wisdom");
    expect(values).not.toContain("hopes_legacy");
  });

  it("EXPRESSION_OPTIONS has 4 entries", () => {
    expect(EXPRESSION_OPTIONS).toHaveLength(4);
    const expectedValues: ExpressionMode[] = ["voice", "writing", "media", "guided"];
    EXPRESSION_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(expectedValues[i]);
      expect(typeof opt.label).toBe("string");
      expect(typeof opt.sublabel).toBe("string");
      expect(typeof opt.icon).toBe("string");
    });
  });

  it("STEP_LABELS covers steps 1-8", () => {
    expect(STEP_LABELS[1]).toBe("Let's get started");
    expect(STEP_LABELS[2]).toBe("A little about you");
    expect(STEP_LABELS[3]).toBe("What you love");
    expect(STEP_LABELS[4]).toBe("Your life right now");
    expect(STEP_LABELS[5]).toBe("Getting to know you");
    expect(STEP_LABELS[6]).toBe("Almost halfway");
    expect(STEP_LABELS[7]).toBe("Nearly there");
    expect(STEP_LABELS[8]).toBe("You're all set");
  });

  it("ADVANCE_LABELS covers steps 1-8", () => {
    expect(ADVANCE_LABELS[1]).toBe("Continue →");
    expect(ADVANCE_LABELS[7]).toBe("Almost there →");
    expect(ADVANCE_LABELS[8]).toBe("Let's begin →");
  });
});
