import { describe, expect, it } from "vitest";
import { reasonOptions, savedReasonValues } from "./flow-options";

describe("saved onboarding reasons", () => {
  it("keeps known reasons in option order and drops unknown values", () => {
    expect(
      savedReasonValues(["explorer", "nope", 3, "self_understanding", "explorer"]),
    ).toEqual(["self_understanding", "explorer"]);
  });

  it("reads the IDs older mobile builds saved", () => {
    expect(
      savedReasonValues([
        "preserve_memories",
        "self_reflection",
        "life_record",
        "organize_thoughts",
        "legacy_for_loved_ones",
        "exploring",
      ]),
    ).toEqual(reasonOptions.map((option) => option.value));
  });
});
