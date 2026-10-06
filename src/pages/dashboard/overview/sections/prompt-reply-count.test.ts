import { describe, expect, it } from "vitest";
import type { DashboardPromptSlot } from "@/utility/interface";
import { getPromptReplyCounts } from "./prompt-reply-count";

function prompt(id: string, count?: number): DashboardPromptSlot {
  return {
    slot_kind: "ai",
    ai_prompt_text: id,
    display_label: id,
    answered: false,
    reflection_day_key: "2026-10-06",
    reply_user_count: count,
  };
}

describe("getPromptReplyCounts", () => {
  it("shows exact distinct-user counts above 30, including equal real totals", () => {
    expect(
      getPromptReplyCounts([
        prompt("one", 31),
        prompt("two", 12345),
        prompt("three", 31),
      ]),
    ).toEqual([31, 12345, 31]);
  });

  it("uses varied display floors of at least 30 for small counts", () => {
    const counts = getPromptReplyCounts([
      prompt("one", 0),
      prompt("two", 12),
      prompt("three", 29),
      prompt("four", 30),
    ]);
    expect(counts.every((count) => count >= 30)).toBe(true);
    expect(new Set(counts).size).toBe(counts.length);
  });

  it("keeps exact counts while avoiding collisions with display floors", () => {
    const rows = [prompt("one", 31), prompt("two", 35), prompt("three", 0)];
    const counts = getPromptReplyCounts(rows);
    expect(counts.slice(0, 2)).toEqual([31, 35]);
    expect(new Set(counts).size).toBe(3);
  });

  it("keeps each prompt's display count stable when order changes", () => {
    const rows = [prompt("one", 0), prompt("two", 0), prompt("three", 0)];
    const counts = getPromptReplyCounts(rows);
    expect(getPromptReplyCounts([...rows].reverse())).toEqual(
      [...counts].reverse(),
    );
    expect(getPromptReplyCounts(rows)).toEqual(counts);
  });

  it("handles unavailable or invalid counts with the display floor", () => {
    const counts = getPromptReplyCounts([
      prompt("one"),
      prompt("two", -1),
      prompt("three", NaN),
      prompt("four", 2.5),
    ]);
    expect(
      counts.every((count) => Number.isSafeInteger(count) && count >= 30),
    ).toBe(true);
    expect(new Set(counts).size).toBe(4);
  });
});
