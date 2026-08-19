import { describe, expect, it } from "vitest";
import { normalizeObservationForDisplay } from "./observation-display";

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
