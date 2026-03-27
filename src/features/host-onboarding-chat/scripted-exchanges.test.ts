import { describe, it, expect } from "vitest";
import {
  ASSISTANT_PRE_DELAY_MS,
  buildExchange0Acknowledgment,
  buildFirstExchangeAssistantContent,
  DEFAULT_INTRO_REPLY,
  EXCHANGE_0_FOLLOWUP_DELAY_MS,
  TOTAL_EXCHANGES,
  composeOnboardingTurn,
  composeExchange0Followup,
} from "./scripted-exchanges";

describe("scripted-exchanges", () => {
  it("has six exchanges after nickname is collected on /onboard", () => {
    expect(TOTAL_EXCHANGES).toBe(6);
  });

  it("uses 4000ms for follow-up and assistant pre-delay defaults", () => {
    expect(EXCHANGE_0_FOLLOWUP_DELAY_MS).toBe(4000);
    expect(ASSISTANT_PRE_DELAY_MS).toBe(4000);
  });

  it("buildExchange0Acknowledgment reflects the user's intro line", () => {
    expect(buildExchange0Acknowledgment("Alright, I'm ready")).toBe("Ok.");
    expect(buildExchange0Acknowledgment("What happens next?")).toBe(
      "Fair question."
    );
    expect(buildExchange0Acknowledgment("So excited to start!!!")).toBe("Nice.");
    expect(buildExchange0Acknowledgment("I'm not sure about this")).toBe(
      "Fair."
    );
    expect(buildExchange0Acknowledgment("Thanks!")).toBe("Yep.");
  });

  it("buildFirstExchangeAssistantContent joins default ack and follow-up (legacy helper)", () => {
    expect(buildFirstExchangeAssistantContent("Sam")).toMatch(/age bracket/);
    expect(buildFirstExchangeAssistantContent("  ")).toMatch(
      /age bracket|comfortable sharing/
    );
    expect(buildFirstExchangeAssistantContent("Sam")).toContain(
      buildExchange0Acknowledgment(DEFAULT_INTRO_REPLY)
    );
  });

  it("composeExchange0Followup returns intent ex2_age_place and age chips", () => {
    const t = composeExchange0Followup({
      messages: [
        { id: "u", role: "user", content: "ready" },
        { id: "a", role: "assistant", content: "Ok.", meta: { kind: "exchange0_ack" } },
      ],
      exchangeIndex: 0,
      nickname: "Rae",
      variantSeed: 42,
    });
    expect(t.intentId).toBe("ex2_age_place");
    expect(t.assistantText.length).toBeGreaterThan(20);
    expect(t.assistantText).toMatch(/age bracket/);
    expect(t.suggestionChips).toContain("Under 25");
    expect(t.composerLabel).toBe("Age and location (optional)");
  });

  it("composeOnboardingTurn is deterministic with variantSeed", () => {
    const ctx = {
      messages: [
        { id: "u", role: "user", content: "x" },
        { id: "a", role: "assistant", content: "q", meta: { kind: "exchange0_followup" } },
      ],
      exchangeIndex: 1 as const,
      nickname: "Sam",
      variantSeed: 99,
    };
    const a = composeOnboardingTurn(ctx);
    const b = composeOnboardingTurn(ctx);
    expect(a.assistantText).toBe(b.assistantText);
    expect(a.suggestionChips).toEqual(b.suggestionChips);
    expect(a.intentId).toBe("ex3_self_intro");
    expect(a.assistantText).toMatch(/fills your days|spend your time|describe yourself/i);
  });

  it("composeOnboardingTurn exchange 4 uses who-matters intent", () => {
    const t = composeOnboardingTurn({
      messages: [{ id: "u", role: "user", content: "ok" }],
      exchangeIndex: 4,
      nickname: "Jo",
      variantSeed: 3,
    });
    expect(t.intentId).toBe("ex6_who_matters");
    expect(t.assistantText).toMatch(/heart|central|memories/i);
  });
});
