import { describe, expect, it } from "vitest";
import {
  classifyStoryMemoryTask,
  composeAssistantResponseTask,
  connectRelatedMemoryTask,
  deepDiveFollowupTask,
  draftStoryFromNotesTask,
  enrichMemoryBatchTask,
  enrichMemoryTask,
  expandStoryDraftTask,
  identifyMissingDetailsTask,
  rewriteStoryDraftTask,
  selectAssistantSubagentTask,
} from "./tasks";

describe("rewriteStoryDraftTask", () => {
  it("parses a structured draft rewrite result", () => {
    const parsed = rewriteStoryDraftTask.parseResponse({
      data: {
        result: {
          tone: "storyteller",
          body: "A warmer, more vivid rewrite.",
          title: "Sunday Dinner",
          summary: "Draft rewritten in storyteller voice",
        },
      },
    });

    expect(parsed).toEqual({
      tone: "storyteller",
      body: "A warmer, more vivid rewrite.",
      title: "Sunday Dinner",
      summary: "Draft rewritten in storyteller voice",
    });
  });
});

describe("identifyMissingDetailsTask", () => {
  it("parses structured missing-details guidance", () => {
    const parsed = identifyMissingDetailsTask.parseResponse({
      data: {
        result: {
          summary: "A few details would strengthen this memory.",
          missing_details: ["who was there", "how you felt"],
          suggested_questions: ["Who shared the moment with you?"],
        },
      },
    });

    expect(parsed).toEqual({
      summary: "A few details would strengthen this memory.",
      missing_details: ["who was there", "how you felt"],
      suggested_questions: ["Who shared the moment with you?"],
    });
  });
});

describe("connectRelatedMemoryTask", () => {
  it("parses structured related-memory guidance", () => {
    const parsed = connectRelatedMemoryTask.parseResponse({
      data: {
        result: {
          summary: "This moment connects well to an earlier family gathering.",
          related_memories: [
            {
              title: "Sunday Dinner",
              reason: "Both memories revolve around family closeness at the table.",
            },
          ],
          suggested_prompt:
            "Does this remind you of another family meal that shaped how you think about home?",
        },
      },
    });

    expect(parsed).toEqual({
      summary: "This moment connects well to an earlier family gathering.",
      related_memories: [
        {
          title: "Sunday Dinner",
          reason: "Both memories revolve around family closeness at the table.",
        },
      ],
      suggested_prompt:
        "Does this remind you of another family meal that shaped how you think about home?",
    });
  });
});

describe("selectAssistantSubagentTask", () => {
  it("parses structured assistant routing guidance", () => {
    const parsed = selectAssistantSubagentTask.parseResponse({
      data: {
        result: {
          subagent: "writing",
          confidence: "high",
          reason: "The prompt asks for a rewrite of an existing draft.",
          suggested_task: "story.rewrite_draft",
        },
      },
    });

    expect(parsed).toEqual({
      subagent: "writing",
      confidence: "high",
      reason: "The prompt asks for a rewrite of an existing draft.",
      suggested_task: "story.rewrite_draft",
    });
  });
});

describe("composeAssistantResponseTask", () => {
  it("parses a structured assistant conversation response", () => {
    const parsed = composeAssistantResponseTask.parseResponse({
      data: {
        result: {
          text: "This sounds like a memory about belonging, and I can help you unpack why it still matters.",
        },
      },
    });

    expect(parsed).toEqual({
      text: "This sounds like a memory about belonging, and I can help you unpack why it still matters.",
    });
  });
});

describe("draftStoryFromNotesTask", () => {
  it("parses a draft built from rough notes", () => {
    const parsed = draftStoryFromNotesTask.parseResponse({
      data: {
        result: {
          title: "Rain on the Walk Home",
          body: "It started with a walk home in the rain.",
          summary: "Built a first-pass memory draft from rough notes.",
        },
      },
    });

    expect(parsed).toEqual({
      title: "Rain on the Walk Home",
      body: "It started with a walk home in the rain.",
      summary: "Built a first-pass memory draft from rough notes.",
    });
  });
});

describe("expandStoryDraftTask", () => {
  it("parses an expanded draft result", () => {
    const parsed = expandStoryDraftTask.parseResponse({
      data: {
        result: {
          title: "Rain on the Walk Home",
          body: "It started with a walk home in the rain, and then the memory opened up.",
          summary: "Expanded the draft with more scene-setting detail.",
          focus: "scene setting",
        },
      },
    });

    expect(parsed).toEqual({
      title: "Rain on the Walk Home",
      body: "It started with a walk home in the rain, and then the memory opened up.",
      summary: "Expanded the draft with more scene-setting detail.",
      focus: "scene setting",
    });
  });
});

describe("deepDiveFollowupTask", () => {
  it("parses a deep-dive follow-up question", () => {
    const parsed = deepDiveFollowupTask.parseResponse({
      data: {
        result: {
          dimension: "relationships_people",
          question: "Who was the first person you wanted to call after it happened?",
          summary: "Suggested a follow-up question for deeper reflection.",
        },
      },
    });

    expect(parsed).toEqual({
      dimension: "relationships_people",
      question: "Who was the first person you wanted to call after it happened?",
      summary: "Suggested a follow-up question for deeper reflection.",
    });
  });
});

describe("classifyStoryMemoryTask", () => {
  it("parses a structured memory classification result", () => {
    const parsed = classifyStoryMemoryTask.parseResponse({
      data: {
        result: {
          category: "relationships_people",
          category_label: "Relationships & People",
          dimensions: ["relationships_people", "everyday_life"],
          summary: "This draft is mainly about people and the closeness of a shared routine.",
        },
      },
    });

    expect(parsed).toEqual({
      category: "relationships_people",
      category_label: "Relationships & People",
      dimensions: ["relationships_people", "everyday_life"],
      summary: "This draft is mainly about people and the closeness of a shared routine.",
    });
  });
});

describe("enrichMemoryTask", () => {
  it("parses an archive enrichment result for one memory", () => {
    const parsed = enrichMemoryTask.parseResponse({
      data: {
        result: {
          title: "Sunday Dinner",
          tags: ["family", "home", "tradition"],
          category: "relationships_people",
          category_label: "Relationships & People",
          dimensions: ["relationships_people", "heritage_roots"],
          summary: "Prepared enrichment suggestions for this memory.",
          next_action: "Review and apply the suggested metadata in the story editor.",
        },
      },
    });

    expect(parsed).toEqual({
      title: "Sunday Dinner",
      tags: ["family", "home", "tradition"],
      category: "relationships_people",
      category_label: "Relationships & People",
      dimensions: ["relationships_people", "heritage_roots"],
      summary: "Prepared enrichment suggestions for this memory.",
      next_action: "Review and apply the suggested metadata in the story editor.",
    });
  });
});

describe("enrichMemoryBatchTask", () => {
  it("parses a batch enrichment result", () => {
    const parsed = enrichMemoryBatchTask.parseResponse({
      data: {
        result: {
          summary: "Queued 3 memories for archive enrichment.",
          accepted: 3,
          memory_ids: [
            "507f1f77bcf86cd799439011",
            "507f1f77bcf86cd799439012",
            "507f1f77bcf86cd799439013",
          ],
          mode: "queued",
        },
      },
    });

    expect(parsed).toEqual({
      summary: "Queued 3 memories for archive enrichment.",
      accepted: 3,
      memory_ids: [
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439013",
      ],
      mode: "queued",
    });
  });
});
