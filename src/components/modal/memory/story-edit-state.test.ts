import { describe, expect, it } from "vitest";
import type { IMemory } from "@/utility/interface";
import {
  buildStoryUpdatePayload,
  createStoryEditDraft,
} from "./story-edit-state";

const memory = {
  _id: "memory-1",
  title: "Sunday dinner",
  body: "<p>At home.</p>",
  attachments: [],
  tags: ["family"],
  groups: [{ _id: "group-1", name: "Family", color: 2 }],
  beneficiaries: [{ _id: "person-1", name: "Ada" }],
  visibility: "private",
} as IMemory;

describe("story edit state", () => {
  it("creates an isolated editable draft from a memory", () => {
    const draft = createStoryEditDraft(memory);

    expect(draft).toMatchObject({
      title: "Sunday dinner",
      body: "<p>At home.</p>",
      tags: ["family"],
      visibility: "private",
    });
    expect(draft.access.map(({ id, source }) => ({ id, source }))).toEqual([
      { id: "group-1", source: "group" },
      { id: "person-1", source: "beneficiary" },
    ]);
    expect(draft.tags).not.toBe(memory.tags);
  });

  it("returns an empty payload when the draft is unchanged", () => {
    expect(
      buildStoryUpdatePayload(memory, createStoryEditDraft(memory)),
    ).toEqual({});
  });

  it("returns only changed story fields", () => {
    const draft = createStoryEditDraft(memory);
    draft.title = "A new title";
    draft.tags = ["family", "food"];
    draft.visibility = "everyone";
    draft.access = [];

    expect(buildStoryUpdatePayload(memory, draft)).toEqual({
      title: "A new title",
      tags: ["family", "food"],
      visibility: "everyone",
      groups: [],
      beneficiaries: [],
    });
  });
});
