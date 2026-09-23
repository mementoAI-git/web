import type { ApiError } from "@/api/interface";
import type {
  AiTaskExecutionMeta,
  AiTaskMode,
  AiTaskState,
  CompletedAiTaskState,
  FailedAiTaskState,
  IdleAiTaskState,
  RunningAiTaskState,
} from "./ai-task.types";

export const AI_TASK_MODE_LABELS: Record<AiTaskMode, string> = {
  suggest: "suggestion",
  assist: "assistant action",
  act: "automated action",
};

export function createIdleAiTaskState<TResult>(
  task: string,
  mode: AiTaskMode,
): IdleAiTaskState<TResult> {
  return {
    task,
    mode,
    status: "idle",
    result: null,
    meta: null,
    error: null,
    lastUpdatedAt: null,
  };
}

export function startAiTask<TResult>(
  task: string,
  mode: AiTaskMode,
  previousResult: TResult | null = null,
  previousMeta: AiTaskExecutionMeta | null = null,
): RunningAiTaskState<TResult> {
  return {
    task,
    mode,
    status: "running",
    result: previousResult,
    meta: previousMeta,
    error: null,
    lastUpdatedAt: Date.now(),
  };
}

export function completeAiTask<TResult>(
  task: string,
  mode: AiTaskMode,
  result: TResult,
  meta: AiTaskExecutionMeta | null = null,
): CompletedAiTaskState<TResult> {
  return {
    task,
    mode,
    status: "completed",
    result,
    meta,
    error: null,
    lastUpdatedAt: Date.now(),
  };
}

export function failAiTask<TResult>(
  task: string,
  mode: AiTaskMode,
  error: ApiError,
  previousResult: TResult | null = null,
  previousMeta: AiTaskExecutionMeta | null = null,
): FailedAiTaskState<TResult> {
  return {
    task,
    mode,
    status: "failed",
    result: previousResult,
    meta: previousMeta,
    error,
    lastUpdatedAt: Date.now(),
  };
}

export function isAiTaskTerminal<TResult>(
  state: AiTaskState<TResult>,
): boolean {
  return state.status === "completed" || state.status === "failed";
}

export function getAiTaskFallbackErrorMessage(
  taskLabel: string | undefined,
  mode: AiTaskMode,
): string {
  if (taskLabel?.trim()) {
    return `Could not complete ${taskLabel.trim().toLowerCase()}. Try again.`;
  }

  const modeLabel = AI_TASK_MODE_LABELS[mode];
  return `Could not complete the ${modeLabel}. Try again.`;
}
