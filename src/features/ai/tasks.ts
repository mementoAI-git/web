import type { ApiResponse } from "@/api/interface";
import endpoint from "@/api/endpoint";
import type {
  AiTaskDefinition,
  AiTaskMode,
  AiTaskRunRequest,
  AiTaskRunResponse,
} from "./ai-task.types";

export type SuggestStoryTitleInput = {
  title?: string;
  body?: string;
};

export type SuggestStoryTagsInput = {
  title?: string;
  body?: string;
};

export type SuggestStoryTitleResult = {
  title: string;
};

export type SuggestStoryTagsResult = {
  tags: string[];
};

export type RewriteStoryDraftTone =
  | "reflective"
  | "storyteller"
  | "beneficiaries"
  | "raw";

export type RewriteStoryDraftInput = {
  title?: string;
  body?: string;
  tone: RewriteStoryDraftTone;
};

export type RewriteStoryDraftResult = {
  tone: RewriteStoryDraftTone;
  body: string;
  title: string;
  summary: string;
};

export type IdentifyMissingDetailsInput = {
  title?: string;
  body?: string;
};

export type IdentifyMissingDetailsResult = {
  summary: string;
  missing_details: string[];
  suggested_questions: string[];
};

export type ConnectRelatedMemoryInput = {
  title?: string;
  body?: string;
};

export type ConnectRelatedMemoryResult = {
  summary: string;
  related_memories: Array<{
    title: string;
    reason: string;
  }>;
  suggested_prompt: string;
};

export type AssistantSurface =
  | "story_composer"
  | "host_chat"
  | "onboarding"
  | "archive"
  | "general";

export type AssistantSubagent =
  | "conversation"
  | "writing"
  | "memory_digging"
  | "metadata"
  | "media_archive";

export type AssistantRouteRequestInput = {
  prompt: string;
  surface?: AssistantSurface;
};

export type AssistantRouteRequestResult = {
  subagent: AssistantSubagent;
  confidence: "high" | "medium";
  reason: string;
  suggested_task: string;
};

export type AssistantComposeResponseInput = {
  prompt: string;
  surface?: AssistantSurface;
  title?: string;
  body?: string;
  tone?: string;
  uploaded_file_ids?: string[];
  uploaded_media_count?: number;
  uploaded_document_count?: number;
  messages?: Array<{
    role: "assistant" | "user";
    content: string;
  }>;
};

export type AssistantComposeResponseResult = {
  text: string;
};

export type DraftStoryFromNotesInput = {
  title?: string;
  notes: string;
};

export type DraftStoryFromNotesResult = {
  title: string;
  body: string;
  summary: string;
};

export type ExpandStoryDraftInput = {
  title?: string;
  body: string;
  focus?: string;
};

export type ExpandStoryDraftResult = {
  title: string;
  body: string;
  summary: string;
  focus: string;
};

export type DeepDiveFollowupInput = {
  text: string;
  dimension?: string;
};

export type DeepDiveFollowupResult = {
  dimension: string;
  question: string;
  summary: string;
};

export type ClassifyStoryMemoryInput = {
  title?: string;
  body?: string;
};

export type ClassifyStoryMemoryResult = {
  category: string;
  category_label: string;
  dimensions: string[];
  summary: string;
};

export type OrganizeStoryUploadsInput = {
  memory_id?: string;
  file_ids: string[];
};

export type OrganizeStoryUploadsResult = {
  summary: string;
  inline_media: string[];
  attachments: string[];
  items: Array<{
    file_id: string;
    kind: string;
    name: string;
    type: string;
  }>;
};

export type EnrichMemoryInput = {
  memory_id?: string;
  title?: string;
  body?: string;
};

export type EnrichMemoryResult = {
  title: string;
  tags: string[];
  category: string;
  category_label: string;
  dimensions: string[];
  summary: string;
  next_action: string;
};

export type EnrichMemoryBatchInput = {
  memory_ids: string[];
};

export type EnrichMemoryBatchResult = {
  summary: string;
  accepted: number;
  memory_ids: string[];
  mode: "queued" | "prepared";
};

function extractTitle(response: ApiResponse<{ title: string }>): SuggestStoryTitleResult {
  const suggested = unwrapNestedValue(response, "title");
  return {
    title: typeof suggested === "string" ? suggested.trim() : "",
  };
}

function extractTags(response: ApiResponse<{ tags: string[] }>): SuggestStoryTagsResult {
  const suggested = unwrapNestedValue(response, "tags");
  return {
    tags: Array.isArray(suggested)
      ? suggested.filter(
          (tag): tag is string =>
            typeof tag === "string" && tag.trim().length > 0,
        )
      : [],
  };
}

function extractRewriteDraft(
  response: ApiResponse<RewriteStoryDraftResult>,
): RewriteStoryDraftResult {
  const result = response.data;
  const nestedResult =
    result && typeof result === "object" && "result" in (result as Record<string, unknown>)
      ? ((result as { result?: unknown }).result as Partial<RewriteStoryDraftResult> | undefined)
      : (result as Partial<RewriteStoryDraftResult> | undefined);

  return {
    tone: nestedResult?.tone ?? "storyteller",
    body: typeof nestedResult?.body === "string" ? nestedResult.body.trim() : "",
    title: typeof nestedResult?.title === "string" ? nestedResult.title.trim() : "",
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
  };
}

function extractMissingDetails(
  response: ApiResponse<IdentifyMissingDetailsResult>,
): IdentifyMissingDetailsResult {
  const result = response.data;
  const nestedResult =
    result && typeof result === "object" && "result" in (result as Record<string, unknown>)
      ? ((result as { result?: unknown }).result as Partial<IdentifyMissingDetailsResult> | undefined)
      : (result as Partial<IdentifyMissingDetailsResult> | undefined);

  return {
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
    missing_details: Array.isArray(nestedResult?.missing_details)
      ? nestedResult.missing_details.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
    suggested_questions: Array.isArray(nestedResult?.suggested_questions)
      ? nestedResult.suggested_questions.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
  };
}

function extractRelatedMemory(
  response: ApiResponse<ConnectRelatedMemoryResult>,
): ConnectRelatedMemoryResult {
  const result = response.data;
  const nestedResult =
    result && typeof result === "object" && "result" in (result as Record<string, unknown>)
      ? ((result as { result?: unknown }).result as Partial<ConnectRelatedMemoryResult> | undefined)
      : (result as Partial<ConnectRelatedMemoryResult> | undefined);

  return {
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
    related_memories: Array.isArray(nestedResult?.related_memories)
      ? nestedResult.related_memories.filter(
          (
            item,
          ): item is { title: string; reason: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof item.title === "string" &&
            item.title.trim().length > 0 &&
            typeof item.reason === "string" &&
            item.reason.trim().length > 0,
        )
      : [],
    suggested_prompt:
      typeof nestedResult?.suggested_prompt === "string"
        ? nestedResult.suggested_prompt.trim()
        : "",
  };
}

function extractRouteSelection(
  response: ApiResponse<AssistantRouteRequestResult>,
): AssistantRouteRequestResult {
  const nestedResult = unwrapTaskResult<AssistantRouteRequestResult>(response.data);
  return {
    subagent:
      nestedResult?.subagent === "writing" ||
      nestedResult?.subagent === "memory_digging" ||
      nestedResult?.subagent === "metadata" ||
      nestedResult?.subagent === "media_archive"
        ? nestedResult.subagent
        : "conversation",
    confidence:
      nestedResult?.confidence === "high" ? "high" : "medium",
    reason: typeof nestedResult?.reason === "string" ? nestedResult.reason.trim() : "",
    suggested_task:
      typeof nestedResult?.suggested_task === "string"
        ? nestedResult.suggested_task.trim()
        : "",
  };
}

function extractAssistantComposeResponse(
  response: ApiResponse<AssistantComposeResponseResult>,
): AssistantComposeResponseResult {
  const result = response.data;
  const nestedResult =
    result && typeof result === "object" && "result" in (result as Record<string, unknown>)
      ? ((result as { result?: unknown }).result as Partial<AssistantComposeResponseResult> | undefined)
      : (result as Partial<AssistantComposeResponseResult> | undefined);

  return {
    text: typeof nestedResult?.text === "string" ? nestedResult.text.trim() : "",
  };
}

function extractDraftFromNotes(
  response: ApiResponse<DraftStoryFromNotesResult>,
): DraftStoryFromNotesResult {
  const nestedResult = unwrapTaskResult<DraftStoryFromNotesResult>(response.data);
  return {
    title: typeof nestedResult?.title === "string" ? nestedResult.title.trim() : "",
    body: typeof nestedResult?.body === "string" ? nestedResult.body.trim() : "",
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
  };
}

function extractExpandedDraft(
  response: ApiResponse<ExpandStoryDraftResult>,
): ExpandStoryDraftResult {
  const nestedResult = unwrapTaskResult<ExpandStoryDraftResult>(response.data);
  return {
    title: typeof nestedResult?.title === "string" ? nestedResult.title.trim() : "",
    body: typeof nestedResult?.body === "string" ? nestedResult.body.trim() : "",
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
    focus: typeof nestedResult?.focus === "string" ? nestedResult.focus.trim() : "",
  };
}

function extractDeepDiveFollowup(
  response: ApiResponse<DeepDiveFollowupResult>,
): DeepDiveFollowupResult {
  const nestedResult = unwrapTaskResult<DeepDiveFollowupResult>(response.data);
  return {
    dimension:
      typeof nestedResult?.dimension === "string" ? nestedResult.dimension.trim() : "",
    question: typeof nestedResult?.question === "string" ? nestedResult.question.trim() : "",
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
  };
}

function extractMemoryClassification(
  response: ApiResponse<ClassifyStoryMemoryResult>,
): ClassifyStoryMemoryResult {
  const nestedResult = unwrapTaskResult<ClassifyStoryMemoryResult>(response.data);
  return {
    category:
      typeof nestedResult?.category === "string" ? nestedResult.category.trim() : "",
    category_label:
      typeof nestedResult?.category_label === "string"
        ? nestedResult.category_label.trim()
        : "",
    dimensions: Array.isArray(nestedResult?.dimensions)
      ? nestedResult.dimensions.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
  };
}

function extractEnrichedMemory(
  response: ApiResponse<EnrichMemoryResult>,
): EnrichMemoryResult {
  const nestedResult = unwrapTaskResult<EnrichMemoryResult>(response.data);
  return {
    title: typeof nestedResult?.title === "string" ? nestedResult.title.trim() : "",
    tags: Array.isArray(nestedResult?.tags)
      ? nestedResult.tags.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
    category:
      typeof nestedResult?.category === "string" ? nestedResult.category.trim() : "",
    category_label:
      typeof nestedResult?.category_label === "string"
        ? nestedResult.category_label.trim()
        : "",
    dimensions: Array.isArray(nestedResult?.dimensions)
      ? nestedResult.dimensions.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
    next_action:
      typeof nestedResult?.next_action === "string"
        ? nestedResult.next_action.trim()
        : "",
  };
}

function extractEnrichmentBatch(
  response: ApiResponse<EnrichMemoryBatchResult>,
): EnrichMemoryBatchResult {
  const nestedResult = unwrapTaskResult<EnrichMemoryBatchResult>(response.data);
  return {
    summary: typeof nestedResult?.summary === "string" ? nestedResult.summary.trim() : "",
    accepted:
      typeof nestedResult?.accepted === "number" && Number.isFinite(nestedResult.accepted)
        ? nestedResult.accepted
        : 0,
    memory_ids: Array.isArray(nestedResult?.memory_ids)
      ? nestedResult.memory_ids.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [],
    mode: nestedResult?.mode === "prepared" ? "prepared" : "queued",
  };
}

function unwrapTaskResult<TResult>(source: unknown): Partial<TResult> | undefined {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  if ("result" in (source as Record<string, unknown>)) {
    return (source as { result?: Partial<TResult> }).result;
  }

  return source as Partial<TResult>;
}

function unwrapNestedValue(
  source: unknown,
  key: string,
): unknown {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const direct = source as Record<string, unknown>;
  if (key in direct) {
    return direct[key];
  }

  const nested = direct.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return unwrapNestedValue(nested, key);
  }

  return undefined;
}

export function createStructuredAiTaskDefinition<TContext, TResult>(
  task: string,
  options?: {
    defaultMode?: AiTaskMode;
    label?: string;
  },
): AiTaskDefinition<
  TContext,
  TResult,
  AiTaskRunRequest<TContext>,
  AiTaskRunResponse<TResult>
> {
  return {
    task,
    endpoint: endpoint.aiTasksRun,
    method: "POST",
    defaultMode: options?.defaultMode ?? "assist",
    label: options?.label,
    buildRequest: (context, mode) => ({
      task,
      mode,
      context,
    }),
    parseResponse: (response) => response.data.result,
  };
}

export const suggestStoryTitleTask: AiTaskDefinition<
  SuggestStoryTitleInput,
  SuggestStoryTitleResult
> = {
  ...createStructuredAiTaskDefinition<
    SuggestStoryTitleInput,
    SuggestStoryTitleResult
  >("story.suggest_title", {
    defaultMode: "suggest",
    label: "title suggestion",
  }),
  parseResponse: extractTitle,
};

export const suggestStoryTagsTask: AiTaskDefinition<
  SuggestStoryTagsInput,
  SuggestStoryTagsResult
> = {
  ...createStructuredAiTaskDefinition<SuggestStoryTagsInput, SuggestStoryTagsResult>(
    "story.suggest_tags",
    {
      defaultMode: "suggest",
      label: "tag suggestion",
    },
  ),
  parseResponse: extractTags,
};

export const rewriteStoryDraftTask: AiTaskDefinition<
  RewriteStoryDraftInput,
  RewriteStoryDraftResult
> = {
  ...createStructuredAiTaskDefinition<
    RewriteStoryDraftInput,
    RewriteStoryDraftResult
  >("story.rewrite_draft", {
    defaultMode: "assist",
    label: "draft rewrite",
  }),
  parseResponse: extractRewriteDraft,
};

export const identifyMissingDetailsTask: AiTaskDefinition<
  IdentifyMissingDetailsInput,
  IdentifyMissingDetailsResult
> = {
  ...createStructuredAiTaskDefinition<
    IdentifyMissingDetailsInput,
    IdentifyMissingDetailsResult
  >("story.identify_missing_details", {
    defaultMode: "assist",
    label: "missing details guidance",
  }),
  parseResponse: extractMissingDetails,
};

export const connectRelatedMemoryTask: AiTaskDefinition<
  ConnectRelatedMemoryInput,
  ConnectRelatedMemoryResult
> = {
  ...createStructuredAiTaskDefinition<
    ConnectRelatedMemoryInput,
    ConnectRelatedMemoryResult
  >("story.connect_related_memory", {
    defaultMode: "assist",
    label: "related memory guidance",
  }),
  parseResponse: extractRelatedMemory,
};

export const selectAssistantSubagentTask: AiTaskDefinition<
  AssistantRouteRequestInput,
  AssistantRouteRequestResult
> = {
  ...createStructuredAiTaskDefinition<
    AssistantRouteRequestInput,
    AssistantRouteRequestResult
  >("assistant.select_subagent", {
    defaultMode: "assist",
    label: "assistant routing",
  }),
  parseResponse: extractRouteSelection,
};

export const composeAssistantResponseTask: AiTaskDefinition<
  AssistantComposeResponseInput,
  AssistantComposeResponseResult
> = {
  ...createStructuredAiTaskDefinition<
    AssistantComposeResponseInput,
    AssistantComposeResponseResult
  >("assistant.compose_response", {
    defaultMode: "assist",
    label: "assistant response",
  }),
  parseResponse: extractAssistantComposeResponse,
};

export const draftStoryFromNotesTask: AiTaskDefinition<
  DraftStoryFromNotesInput,
  DraftStoryFromNotesResult
> = {
  ...createStructuredAiTaskDefinition<
    DraftStoryFromNotesInput,
    DraftStoryFromNotesResult
  >("story.draft_from_notes", {
    defaultMode: "assist",
    label: "draft from notes",
  }),
  parseResponse: extractDraftFromNotes,
};

export const expandStoryDraftTask: AiTaskDefinition<
  ExpandStoryDraftInput,
  ExpandStoryDraftResult
> = {
  ...createStructuredAiTaskDefinition<
    ExpandStoryDraftInput,
    ExpandStoryDraftResult
  >("story.expand_draft", {
    defaultMode: "assist",
    label: "draft expansion",
  }),
  parseResponse: extractExpandedDraft,
};

export const deepDiveFollowupTask: AiTaskDefinition<
  DeepDiveFollowupInput,
  DeepDiveFollowupResult
> = {
  ...createStructuredAiTaskDefinition<
    DeepDiveFollowupInput,
    DeepDiveFollowupResult
  >("chat.deep_dive_followup", {
    defaultMode: "assist",
    label: "deep-dive follow-up",
  }),
  parseResponse: extractDeepDiveFollowup,
};

export const classifyStoryMemoryTask: AiTaskDefinition<
  ClassifyStoryMemoryInput,
  ClassifyStoryMemoryResult
> = {
  ...createStructuredAiTaskDefinition<
    ClassifyStoryMemoryInput,
    ClassifyStoryMemoryResult
  >("story.classify_memory", {
    defaultMode: "suggest",
    label: "memory classification",
  }),
  parseResponse: extractMemoryClassification,
};

export const organizeStoryUploadsTask = createStructuredAiTaskDefinition<
  OrganizeStoryUploadsInput,
  OrganizeStoryUploadsResult
>("story.organize_uploads", {
  defaultMode: "assist",
  label: "upload organization",
});

export const enrichMemoryTask: AiTaskDefinition<
  EnrichMemoryInput,
  EnrichMemoryResult
> = {
  ...createStructuredAiTaskDefinition<EnrichMemoryInput, EnrichMemoryResult>(
    "archive.enrich_memory",
    {
      defaultMode: "assist",
      label: "memory enrichment",
    },
  ),
  parseResponse: extractEnrichedMemory,
};

export const enrichMemoryBatchTask: AiTaskDefinition<
  EnrichMemoryBatchInput,
  EnrichMemoryBatchResult
> = {
  ...createStructuredAiTaskDefinition<
    EnrichMemoryBatchInput,
    EnrichMemoryBatchResult
  >("archive.enrich_batch", {
    defaultMode: "act",
    label: "batch enrichment",
  }),
  parseResponse: extractEnrichmentBatch,
};
