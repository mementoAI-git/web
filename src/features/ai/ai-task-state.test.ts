import { describe, expect, it, vi } from "vitest";
import {
  completeAiTask,
  createIdleAiTaskState,
  failAiTask,
  getAiTaskFallbackErrorMessage,
  isAiTaskTerminal,
  startAiTask,
} from "./ai-task-state";

describe("ai-task-state", () => {
  it("creates idle state with empty result and error", () => {
    const state = createIdleAiTaskState("story.suggest_title", "suggest");

    expect(state).toEqual({
      task: "story.suggest_title",
      mode: "suggest",
      status: "idle",
      result: null,
      meta: null,
      error: null,
      lastUpdatedAt: null,
    });
  });

  it("keeps the previous result while the next run starts", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const state = startAiTask("story.suggest_tags", "assist", ["family"], {
      session_id: "session-1",
    });

    expect(state).toEqual({
      task: "story.suggest_tags",
      mode: "assist",
      status: "running",
      result: ["family"],
      meta: { session_id: "session-1" },
      error: null,
      lastUpdatedAt: 1700000000000,
    });
  });

  it("marks completed and failed states as terminal", () => {
    const completed = completeAiTask("story.suggest_title", "suggest", {
      title: "A Better Name",
    });
    const failed = failAiTask(
      "story.suggest_title",
      "suggest",
      { message: "No title returned" },
      null,
    );

    expect(isAiTaskTerminal(completed)).toBe(true);
    expect(isAiTaskTerminal(failed)).toBe(true);
  });

  it("returns a consistent fallback error message by mode", () => {
    expect(getAiTaskFallbackErrorMessage("tag suggestion", "suggest")).toBe(
      "Could not complete tag suggestion. Try again.",
    );
    expect(getAiTaskFallbackErrorMessage(undefined, "act")).toBe(
      "Could not complete the automated action. Try again.",
    );
  });
});
