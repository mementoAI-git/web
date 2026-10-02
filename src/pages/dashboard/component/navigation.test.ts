import { describe, expect, it } from "vitest";
import { topNavigations } from "./navigation";

describe("dashboard navigation", () => {
  it("hides the disabled time capsule feature", () => {
    expect(topNavigations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ link: "/capsule" }),
      ]),
    );
  });
});
