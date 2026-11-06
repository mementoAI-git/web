import { describe, expect, it } from "vitest";
import {
  joinObservation,
  normalizeObservationForDisplay,
  splitObservation,
} from "./observation-display";

describe("normalizeObservationForDisplay", () => {
  it.each([
    ["The user values quiet Sundays.", "You value quiet Sundays."],
    [
      "the member enjoys handwritten letters.",
      "You enjoy handwritten letters.",
    ],
    ["The host keeps family recipes.", "You keep family recipes."],
  ])("converts legacy leading subjects to second person", (input, expected) => {
    expect(normalizeObservationForDisplay(input)).toBe(expected);
  });

  it("leaves a named sentence unchanged", () => {
    expect(normalizeObservationForDisplay("Maya values quiet Sundays.")).toBe(
      "Maya values quiet Sundays.",
    );
  });

  it("does not rewrite legacy wording away from the leading subject", () => {
    expect(
      normalizeObservationForDisplay(
        "Maya said the user values quiet Sundays.",
      ),
    ).toBe("Maya said the user values quiet Sundays.");
  });
});

describe("splitObservation", () => {
  it("separates a headline from its supporting sentences", () => {
    expect(
      splitObservation("You value independent thinking. Autonomy shows up often."),
    ).toEqual({
      title: "You value independent thinking",
      detail: "Autonomy shows up often.",
    });
  });

  it("keeps a single sentence as the headline", () => {
    expect(splitObservation("You prefer quiet mornings.")).toEqual({
      title: "You prefer quiet mornings",
      detail: "",
    });
  });
});

describe("joinObservation", () => {
  it.each([
    ["You think for yourself", "It shows.", "You think for yourself. It shows."],
    ["Why did you move?", "For work.", "Why did you move? For work."],
    ["  You prefer tea  ", "   ", "You prefer tea"],
  ])("joins %j and %j", (title, detail, expected) => {
    expect(joinObservation(title, detail)).toBe(expected);
  });

  it("reverses splitObservation", () => {
    const text = "You value independence. It shows in your choices.";
    const { title, detail } = splitObservation(text);
    expect(joinObservation(title, detail)).toBe(text);
  });
});
