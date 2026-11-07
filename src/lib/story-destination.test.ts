import { expect, it } from "vitest";
import { storyDestination } from "./story-destination";
it.each(["static", "ai-generated"] as const)(
  "opens saved %s reflections as topic conversations",
  (prompt_type) => {
    expect(storyDestination({ _id: "saved-answer", prompt_type })).toBe(
      "/chat/reflection/saved-answer",
    );
  },
);
it("keeps ordinary stories in the story viewer", () =>
  expect(storyDestination({ _id: "story" })).toBe("/stories/story"));
