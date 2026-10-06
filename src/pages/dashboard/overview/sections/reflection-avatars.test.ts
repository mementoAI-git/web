import { describe, expect, it, vi } from "vitest";
import {
  avatarsForCard,
  createAvatarOrder,
  reflectionAvatars,
  refreshAvatarOrder,
} from "./reflection-avatars";

describe("reflection avatars", () => {
  it("loads twenty distinct WebP avatars", () => {
    expect(reflectionAvatars).toHaveLength(20);
    expect(new Set(reflectionAvatars).size).toBe(20);
  });

  it("randomizes the pool without losing or duplicating portraits", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const order = createAvatarOrder();
      expect(order).not.toEqual(reflectionAvatars);
      expect([...order].sort()).toEqual([...reflectionAvatars].sort());
    } finally {
      vi.restoreAllMocks();
    }
  });

  it.each([0, 0.5, 0.999])(
    "replaces all three portraits on every card when refreshed (%s)",
    (random) => {
      vi.spyOn(Math, "random").mockReturnValue(random);
      try {
        const previous = [...reflectionAvatars];
        const refreshed = refreshAvatarOrder(previous);
        for (let card = 0; card < 3; card++) {
          const oldFaces = avatarsForCard(previous, card);
          const newFaces = avatarsForCard(refreshed, card);
          expect(newFaces).toHaveLength(3);
          expect(newFaces.every((face) => !oldFaces.includes(face))).toBe(true);
        }
        expect(new Set(refreshed).size).toBe(20);
      } finally {
        vi.restoreAllMocks();
      }
    },
  );

  it("gives the three cards nine different portraits", () => {
    const faces = [0, 1, 2].flatMap((index) =>
      avatarsForCard(reflectionAvatars, index),
    );
    expect(new Set(faces).size).toBe(9);
  });
});
