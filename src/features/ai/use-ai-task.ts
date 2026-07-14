import type { ApiError } from "@/api/interface";
import { useMutation } from "@/hooks/use-api";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  completeAiTask,
  createIdleAiTaskState,
  failAiTask,
  getAiTaskFallbackErrorMessage,
  startAiTask,
} from "./ai-task-state";
import type {
  AiTaskDefinition,
  AiTaskExecutionMeta,
  AiTaskMode,
  AiTaskRunOptions,
  AiTaskState,
  AiTaskRunResponse,
  UseAiTaskOptions,
} from "./ai-task.types";

function resolveMode(
  taskMode: AiTaskMode | undefined,
  optionMode: AiTaskMode | undefined,
  runMode: AiTaskMode | undefined,
): AiTaskMode {
  return runMode ?? optionMode ?? taskMode ?? "assist";
}

function extractExecutionMeta<TResult>(
  response: { data: TRawLike<TResult> } | undefined,
): AiTaskExecutionMeta | null {
  const data = response?.data;
  if (!data || typeof data !== "object") {
    return null;
  }

  const maybeTaskResponse = data as Partial<AiTaskRunResponse<TResult>>;
  const hasMeta =
    typeof maybeTaskResponse.summary === "string" ||
    typeof maybeTaskResponse.session_id === "string" ||
    typeof maybeTaskResponse.run_id === "string" ||
    typeof maybeTaskResponse.workflow_id === "string" ||
    Array.isArray((maybeTaskResponse as { tool_calls?: unknown }).tool_calls) ||
    maybeTaskResponse.progress !== undefined ||
    Array.isArray(maybeTaskResponse.events);

  if (!hasMeta) {
    return null;
  }

  return {
    summary: maybeTaskResponse.summary,
    session_id: maybeTaskResponse.session_id,
    run_id: maybeTaskResponse.run_id,
    workflow_id: maybeTaskResponse.workflow_id,
    tool_calls: Array.isArray((maybeTaskResponse as { tool_calls?: unknown }).tool_calls)
      ? (((maybeTaskResponse as { tool_calls?: unknown }).tool_calls as unknown[]).filter(
          (toolCall): toolCall is string => typeof toolCall === "string",
        ))
      : [],
    progress: maybeTaskResponse.progress ?? null,
    events: maybeTaskResponse.events ?? [],
  };
}

type TRawLike<TResult> = TResult | AiTaskRunResponse<TResult>;

export function useAiTask<TInput, TResult, TRequest = TInput, TRawResponse = TResult>(
  definition: AiTaskDefinition<TInput, TResult, TRequest, TRawResponse>,
  options?: UseAiTaskOptions<TResult>,
) {
  const defaultMode = useMemo(
    () => resolveMode(definition.defaultMode, options?.mode, undefined),
    [definition.defaultMode, options?.mode],
  );
  const [state, setState] = useState<AiTaskState<TResult>>(() =>
    createIdleAiTaskState(definition.task, defaultMode),
  );
  const activeModeRef = useRef<AiTaskMode>(defaultMode);
  const activeRunOptionsRef = useRef<AiTaskRunOptions<TResult> | undefined>(
    undefined,
  );

  const handleError = useCallback(
    (error: ApiError, runOptions?: AiTaskRunOptions<TResult>) => {
      const mode = activeModeRef.current;
      setState((previous) =>
        failAiTask(definition.task, mode, error, previous.result, previous.meta),
      );

      if (!options?.skipErrorToast) {
        const message =
          definition.getErrorMessage?.(error, mode) ??
          error.message ??
          getAiTaskFallbackErrorMessage(definition.label, mode);
        toast.error(message);
      }

      runOptions?.onError?.(error);
      options?.onError?.(error);
    },
    [
      definition.getErrorMessage,
      definition.label,
      definition.task,
      options?.onError,
      options?.skipErrorToast,
    ],
  );

  const { trigger, isLoading, reset } = useMutation<TRawResponse, TRequest>(
    definition.endpoint,
    {
      method: definition.method ?? "POST",
      skipErrorHandling: true,
      onError: (error) => handleError(error, activeRunOptionsRef.current),
    },
  );

  const run = useCallback(
    async (input: TInput, runOptions?: AiTaskRunOptions<TResult>) => {
      const mode = resolveMode(
        definition.defaultMode,
        options?.mode,
        runOptions?.mode,
      );
      activeModeRef.current = mode;
      activeRunOptionsRef.current = runOptions;
      setState((previous) =>
        startAiTask(definition.task, mode, previous.result, previous.meta),
      );

      const payload = definition.buildRequest
        ? definition.buildRequest(input, mode)
        : ((input as unknown) as TRequest);

      let response;
      try {
        response = await trigger(payload);
      } catch (error) {
        handleError(error as ApiError, runOptions);
        return undefined;
      }

      if (!response) {
        return undefined;
      }

      const result = definition.parseResponse
        ? definition.parseResponse(response)
        : ((response.data as unknown) as TResult);
      const meta = extractExecutionMeta<TResult>(
        response as { data: TRawLike<TResult> },
      );
      const completedState = completeAiTask(definition.task, mode, result, meta);
      setState(completedState);
      runOptions?.onSuccess?.(completedState);
      options?.onSuccess?.(completedState);
      return completedState;
    },
    [
      definition.buildRequest,
      definition.defaultMode,
      definition.parseResponse,
      definition.task,
      options?.mode,
      options?.onSuccess,
      trigger,
    ],
  );

  const resetTask = useCallback(() => {
    reset();
    const mode = resolveMode(definition.defaultMode, options?.mode, undefined);
    activeModeRef.current = mode;
    activeRunOptionsRef.current = undefined;
    setState(createIdleAiTaskState(definition.task, mode));
  }, [definition.defaultMode, definition.task, options?.mode, reset]);

  return {
    task: definition.task,
    mode: state.mode,
    state,
    run,
    reset: resetTask,
    isLoading,
    isIdle: state.status === "idle",
    isRunning: state.status === "running",
    isSuccess: state.status === "completed",
    isError: state.status === "failed",
    result: state.result,
    meta: state.meta,
    error: state.error,
  };
}
