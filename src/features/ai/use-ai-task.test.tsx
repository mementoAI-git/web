import { act, renderHook, waitFor } from "@testing-library/react";
import type { ApiError, ApiResponse } from "@/api/interface";
import { useAiTask } from "./use-ai-task";
import type { AiTaskDefinition } from "./ai-task.types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const triggerMock = vi.fn();
const resetMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/hooks/use-api", () => ({
  useMutation: vi.fn(() => ({
    trigger: triggerMock,
    isLoading: false,
    reset: resetMock,
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

type Input = { title?: string; body?: string };
type Result = { title: string };

const definition: AiTaskDefinition<Input, Result> = {
  task: "story.suggest_title",
  endpoint: "/ai/generate-story-title",
  method: "POST",
  defaultMode: "suggest",
  label: "title suggestion",
  parseResponse: (response: ApiResponse<{ title: string }>) => ({
    title: response.data.title.trim(),
  }),
};

describe("useAiTask", () => {
  beforeEach(() => {
    triggerMock.mockReset();
    resetMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("runs a task, parses the response, and stores the completed state", async () => {
    triggerMock.mockResolvedValue({
      data: { title: "  Sunday Dinner  " },
    });

    const { result } = renderHook(() => useAiTask(definition));

    await act(async () => {
      await result.current.run({ body: "A family story" });
    });

    expect(triggerMock).toHaveBeenCalledWith({ body: "A family story" });
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.result).toEqual({ title: "Sunday Dinner" });
    expect(result.current.state.mode).toBe("suggest");
  });

  it("uses buildRequest and per-run mode overrides", async () => {
    const structuredDefinition: AiTaskDefinition<
      { fileIds: string[] },
      { inlineMedia: string[] },
      { task: string; mode: string; context: { fileIds: string[] } },
      { result: { inlineMedia: string[] } }
    > = {
      task: "story.organize_uploads",
      endpoint: "/ai/tasks/run",
      method: "POST",
      defaultMode: "assist",
      buildRequest: (input, mode) => ({
        task: "story.organize_uploads",
        mode,
        context: input,
      }),
      parseResponse: (response) => response.data.result,
    };

    triggerMock.mockResolvedValue({
      data: {
        session_id: "session-42",
        run_id: "run-99",
        workflow_id: "workflow-story-organizer",
        progress: { current: 1, total: 3, label: "Classifying uploads" },
        events: [{ type: "tool_call", label: "load files" }],
        result: { inlineMedia: ["file-1"] },
      },
    });

    const { result } = renderHook(() => useAiTask(structuredDefinition));

    await act(async () => {
      await result.current.run(
        { fileIds: ["file-1"] },
        { mode: "act" },
      );
    });

    expect(triggerMock).toHaveBeenCalledWith({
      task: "story.organize_uploads",
      mode: "act",
      context: { fileIds: ["file-1"] },
    });
    expect(result.current.state.mode).toBe("act");
    expect(result.current.result).toEqual({ inlineMedia: ["file-1"] });
    expect(result.current.meta).toEqual({
      session_id: "session-42",
      run_id: "run-99",
      workflow_id: "workflow-story-organizer",
      tool_calls: [],
      progress: { current: 1, total: 3, label: "Classifying uploads" },
      events: [{ type: "tool_call", label: "load files" }],
      summary: undefined,
    });
  });

  it("resets back to idle state", async () => {
    triggerMock.mockResolvedValue({
      data: { title: "Reset Me" },
    });

    const { result } = renderHook(() => useAiTask(definition));

    await act(async () => {
      await result.current.run({ title: "Reset Me" });
    });

    act(() => {
      result.current.reset();
    });

    expect(resetMock).toHaveBeenCalled();
    expect(result.current.isIdle).toBe(true);
    expect(result.current.result).toBeNull();
  });

  it("surfaces standardized error handling when the request throws", async () => {
    const expectedError: ApiError = { message: "Request failed", status: 500 };
    triggerMock.mockRejectedValue(expectedError);

    const { result } = renderHook(() =>
      useAiTask(definition, { skipErrorToast: false }),
    );

    await act(async () => {
      try {
        await result.current.run({ body: "Broken" });
      } catch {
        // The underlying mutation mock throws directly here.
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("Request failed");
  });
});
