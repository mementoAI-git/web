import type { ApiError, ApiResponse } from "@/api/interface";
import type { MutationMethod } from "@/hooks/use-api";

export const AI_TASK_MODES = ["suggest", "assist", "act"] as const;

export type AiTaskMode = (typeof AI_TASK_MODES)[number];

export type AiTaskLifecycleStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface AiTaskProgress {
  current: number;
  total?: number | null;
  label?: string;
}

export interface AiTaskEvent<TPayload = Record<string, unknown>> {
  type: string;
  label?: string;
  timestamp?: string;
  payload?: TPayload;
}

export interface AiTaskExecutionMeta {
  summary?: string;
  session_id?: string;
  run_id?: string;
  workflow_id?: string;
  tool_calls?: string[];
  progress?: AiTaskProgress | null;
  events?: AiTaskEvent[];
}

export interface AiTaskRunRequest<TContext = Record<string, unknown>> {
  task: string;
  mode: AiTaskMode;
  context: TContext;
}

export interface AiTaskRunResponse<TResult = unknown>
  extends AiTaskExecutionMeta {
  status: "completed" | "failed" | "running";
  task: string;
  mode: AiTaskMode;
  result: TResult;
}

export interface AiTaskDefinition<
  TInput,
  TResult,
  TRequest = TInput,
  TRawResponse = TResult,
> {
  task: string;
  endpoint: string;
  method?: MutationMethod;
  defaultMode?: AiTaskMode;
  label?: string;
  buildRequest?: (input: TInput, mode: AiTaskMode) => TRequest;
  parseResponse?: (response: ApiResponse<TRawResponse>) => TResult;
  getErrorMessage?: (error: ApiError, mode: AiTaskMode) => string;
}

export interface AiTaskStateBase<TResult> {
  task: string;
  mode: AiTaskMode;
  status: AiTaskLifecycleStatus;
  result: TResult | null;
  meta: AiTaskExecutionMeta | null;
  error: ApiError | null;
  lastUpdatedAt: number | null;
}

export interface IdleAiTaskState<TResult> extends AiTaskStateBase<TResult> {
  status: "idle";
}

export interface RunningAiTaskState<TResult> extends AiTaskStateBase<TResult> {
  status: "running";
}

export interface CompletedAiTaskState<TResult>
  extends AiTaskStateBase<TResult> {
  status: "completed";
  result: TResult;
}

export interface FailedAiTaskState<TResult> extends AiTaskStateBase<TResult> {
  status: "failed";
  error: ApiError;
}

export type AiTaskState<TResult> =
  | IdleAiTaskState<TResult>
  | RunningAiTaskState<TResult>
  | CompletedAiTaskState<TResult>
  | FailedAiTaskState<TResult>;

export interface AiTaskRunOptions<TResult> {
  mode?: AiTaskMode;
  onSuccess?: (state: CompletedAiTaskState<TResult>) => void;
  onError?: (error: ApiError) => void;
}

export interface UseAiTaskOptions<TResult> extends AiTaskRunOptions<TResult> {
  skipErrorToast?: boolean;
}
