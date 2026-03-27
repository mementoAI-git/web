import { describe, it, expect } from "vitest";
import {
  pickChipSubset,
  composeOnboardingTurn,
  composeExchange0Followup,
} from "./compose-onboarding-turn";

describe("compose-onboarding-turn", () => {
  it("pickChipSubset returns between min and max when pool is large", () => {
    const pool = Array.from({ length: 20 }, (_, i) => `chip-${i}`);
    for (let seed = 0; seed < 15; seed++) {
      const out = pickChipSubset(pool, seed, 5, 8);
      expect(out.length).toBeGreaterThanOrEqual(5);
      expect(out.length).toBeLessThanOrEqual(8);
      expect(new Set(out).size).toBe(out.length);
    }
  });

  it("pickChipSubset returns full pool when pool smaller than min", () => {
    const pool = ["a", "b", "c"];
    expect(pickChipSubset(pool, 1, 5, 8)).toEqual(["a", "b", "c"]);
  });

  it("composeExchange0Followup always includes full age chip row", () => {
    const t = composeExchange0Followup({
      messages: [],
      exchangeIndex: 0,
      nickname: "x",
      variantSeed: 777,
    });
    expect(t.suggestionChips).toContain("Under 25");
    expect(t.suggestionChips).toContain("70+");
    expect(t.suggestionChips.length).toBeGreaterThanOrEqual(6);
  });

  it("composeOnboardingTurn for exchange 5 returns confirm intent", () => {
    const t = composeOnboardingTurn({
      messages: [{ id: "1", role: "user", content: "ok" }],
      exchangeIndex: 5,
      nickname: "n",
      variantSeed: 2,
    });
    expect(t.intentId).toBe("ex7_confirm");
    expect(t.assistantText).toMatch(/snapshot|recap/i);
    expect(t.suggestionChips.length).toBeGreaterThanOrEqual(3);
  });
});
