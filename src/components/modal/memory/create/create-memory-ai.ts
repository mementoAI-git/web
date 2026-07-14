"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  composeAssistantResponseTask,
  draftStoryFromNotesTask,
  expandStoryDraftTask,
  classifyStoryMemoryTask,
  connectRelatedMemoryTask,
  enrichMemoryTask,
  identifyMissingDetailsTask,
  organizeStoryUploadsTask,
  selectAssistantSubagentTask,
  suggestStoryTagsTask,
  suggestStoryTitleTask,
  rewriteStoryDraftTask,
  type RewriteStoryDraftTone,
} from "@/features/ai/tasks";
import { useAiTask } from "@/features/ai/use-ai-task";

export type CreateMemoryAssistantAction =
  | {
      type: "apply_body";
      body: string;
      html: string;
    }
  | {
      type: "apply_title";
      title: string;
    }
  | {
      type: "apply_tags";
      tags: string[];
    }
  | {
      type: "apply_enrichment";
      title: string;
      tags: string[];
    };

export type CreateMemoryAssistantTone = "whimsical" | "reflective" | "direct" | "legacy";

export interface CreateMemoryAssistantSuggestion {
  id: string;
  label: string;
  prompt: string;
  featured?: boolean;
}

export interface CreateMemoryAssistantMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  action?: CreateMemoryAssistantAction;
}

interface UseCreateMemoryAssistantOptions {
  title: string;
  bodyText: string;
  uploadedFileIds: string[];
  uploadedMediaCount: number;
  uploadedDocumentCount: number;
  onApplyTitle: (nextTitle: string) => void;
  onApplyTags: (nextTags: string[]) => void;
  onApplyBody: (nextBody: string, nextHtml: string) => void;
}

export function useCreateMemoryAssistant({
  title,
  bodyText,
  uploadedFileIds,
  uploadedMediaCount,
  uploadedDocumentCount,
  onApplyTitle,
  onApplyTags,
  onApplyBody,
}: UseCreateMemoryAssistantOptions) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CreateMemoryAssistantMessage[]>([]);
  const [tone, setTone] = useState<CreateMemoryAssistantTone>("whimsical");
  const [isComposeResponseUnavailable, setIsComposeResponseUnavailable] = useState(false);
  const routeTask = useAiTask(selectAssistantSubagentTask, {
    mode: "assist",
    skipErrorToast: true,
  });
  const rewriteTask = useAiTask(rewriteStoryDraftTask, { mode: "assist" });
  const composeResponseTask = useAiTask(composeAssistantResponseTask, {
    mode: "assist",
    skipErrorToast: true,
  });
  const missingDetailsTask = useAiTask(identifyMissingDetailsTask, { mode: "assist" });
  const relatedMemoryTask = useAiTask(connectRelatedMemoryTask, { mode: "assist" });
  const suggestTitleTask = useAiTask(suggestStoryTitleTask, { mode: "suggest" });
  const suggestTagsTask = useAiTask(suggestStoryTagsTask, { mode: "suggest" });
  const classifyMemoryTask = useAiTask(classifyStoryMemoryTask, { mode: "suggest" });
  const draftFromNotesTask = useAiTask(draftStoryFromNotesTask, { mode: "assist" });
  const expandDraftTask = useAiTask(expandStoryDraftTask, { mode: "assist" });
  const organizeUploadsTask = useAiTask(organizeStoryUploadsTask, { mode: "assist" });
  const enrichMemoryAiTask = useAiTask(enrichMemoryTask, { mode: "assist" });
  const lastRewriteSignatureRef = useRef<string | null>(null);
  const lastMissingDetailsSignatureRef = useRef<string | null>(null);
  const lastComposeResponseSignatureRef = useRef<string | null>(null);
  const lastRelatedMemorySignatureRef = useRef<string | null>(null);
  const lastTitleSignatureRef = useRef<string | null>(null);
  const lastTagsSignatureRef = useRef<string | null>(null);
  const lastClassificationSignatureRef = useRef<string | null>(null);
  const lastDraftFromNotesSignatureRef = useRef<string | null>(null);
  const lastExpandDraftSignatureRef = useRef<string | null>(null);
  const lastOrganizeUploadsSignatureRef = useRef<string | null>(null);
  const lastEnrichMemorySignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rewriteTask.result?.body) return;

    const signature = JSON.stringify(rewriteTask.result);
    if (lastRewriteSignatureRef.current === signature) return;
    lastRewriteSignatureRef.current = signature;

    const label = getToneLabel(rewriteTask.result.tone);
    const text = `${label} version\n\n${rewriteTask.result.body}`;
    setMessages((current) => [
      ...current,
      createAssistantMessage(text, {
        type: "apply_body",
        body: rewriteTask.result.body,
        html: toHtmlParagraphs(rewriteTask.result.body),
      }),
    ]);
  }, [rewriteTask.result]);

  useEffect(() => {
    if (!composeResponseTask.result?.text) return;
    const signature = JSON.stringify(composeResponseTask.result);
    if (lastComposeResponseSignatureRef.current === signature) return;
    lastComposeResponseSignatureRef.current = signature;

    setMessages((current) => [...current, createAssistantMessage(composeResponseTask.result.text)]);
  }, [composeResponseTask.result]);

  useEffect(() => {
    if (!missingDetailsTask.result) return;
    const signature = JSON.stringify(missingDetailsTask.result);
    if (lastMissingDetailsSignatureRef.current === signature) return;
    lastMissingDetailsSignatureRef.current = signature;

    const details = missingDetailsTask.result.missing_details.join(", ");
    const questions = missingDetailsTask.result.suggested_questions.join(" ");
    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${missingDetailsTask.result.summary}${details ? ` ${details}.` : ""} ${questions}`.trim(),
      ),
    ]);
  }, [missingDetailsTask.result]);

  useEffect(() => {
    if (!relatedMemoryTask.result) return;
    const signature = JSON.stringify(relatedMemoryTask.result);
    if (lastRelatedMemorySignatureRef.current === signature) return;
    lastRelatedMemorySignatureRef.current = signature;

    const relatedMemoryText = relatedMemoryTask.result.related_memories
      .map((memory) => `${memory.title}: ${memory.reason}`)
      .join(" ");
    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${relatedMemoryTask.result.summary} ${relatedMemoryText} ${relatedMemoryTask.result.suggested_prompt}`.trim(),
      ),
    ]);
  }, [relatedMemoryTask.result]);

  useEffect(() => {
    if (!suggestTitleTask.result?.title) return;
    const signature = JSON.stringify(suggestTitleTask.result);
    if (lastTitleSignatureRef.current === signature) return;
    lastTitleSignatureRef.current = signature;

    setMessages((current) => [
      ...current,
      createAssistantMessage(`Suggested title: ${suggestTitleTask.result.title}`, {
        type: "apply_title",
        title: suggestTitleTask.result.title,
      }),
    ]);
  }, [suggestTitleTask.result]);

  useEffect(() => {
    if (!suggestTagsTask.result?.tags?.length) return;
    const signature = JSON.stringify(suggestTagsTask.result);
    if (lastTagsSignatureRef.current === signature) return;
    lastTagsSignatureRef.current = signature;

    setMessages((current) => [
      ...current,
      createAssistantMessage(`Suggested tags: ${suggestTagsTask.result.tags.join(", ")}`, {
        type: "apply_tags",
        tags: suggestTagsTask.result.tags,
      }),
    ]);
  }, [suggestTagsTask.result]);

  useEffect(() => {
    if (!classifyMemoryTask.result) return;
    const signature = JSON.stringify(classifyMemoryTask.result);
    if (lastClassificationSignatureRef.current === signature) return;
    lastClassificationSignatureRef.current = signature;

    const dimensions = classifyMemoryTask.result.dimensions.join(", ");
    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${classifyMemoryTask.result.summary} Primary category: ${classifyMemoryTask.result.category_label}.${dimensions ? ` Dimensions: ${dimensions}.` : ""}`.trim(),
      ),
    ]);
  }, [classifyMemoryTask.result]);

  useEffect(() => {
    if (!draftFromNotesTask.result?.body) return;
    const signature = JSON.stringify(draftFromNotesTask.result);
    if (lastDraftFromNotesSignatureRef.current === signature) return;
    lastDraftFromNotesSignatureRef.current = signature;

    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${draftFromNotesTask.result.summary}\n\n${draftFromNotesTask.result.body}`,
        {
          type: "apply_body",
          body: draftFromNotesTask.result.body,
          html: toHtmlParagraphs(draftFromNotesTask.result.body),
        },
      ),
    ]);
  }, [draftFromNotesTask.result]);

  useEffect(() => {
    if (!expandDraftTask.result?.body) return;
    const signature = JSON.stringify(expandDraftTask.result);
    if (lastExpandDraftSignatureRef.current === signature) return;
    lastExpandDraftSignatureRef.current = signature;

    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${expandDraftTask.result.summary}\n\n${expandDraftTask.result.body}`,
        {
          type: "apply_body",
          body: expandDraftTask.result.body,
          html: toHtmlParagraphs(expandDraftTask.result.body),
        },
      ),
    ]);
  }, [expandDraftTask.result]);

  useEffect(() => {
    if (!organizeUploadsTask.result) return;
    const signature = JSON.stringify(organizeUploadsTask.result);
    if (lastOrganizeUploadsSignatureRef.current === signature) return;
    lastOrganizeUploadsSignatureRef.current = signature;

    const inlineMediaCount = organizeUploadsTask.result.inline_media?.length ?? 0;
    const attachmentCount = organizeUploadsTask.result.attachments?.length ?? 0;
    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${organizeUploadsTask.result.summary} I found ${inlineMediaCount} inline media item${
          inlineMediaCount === 1 ? "" : "s"
        } and ${attachmentCount} document attachment${
          attachmentCount === 1 ? "" : "s"
        }.`,
      ),
    ]);
  }, [organizeUploadsTask.result]);

  useEffect(() => {
    if (!enrichMemoryAiTask.result) return;
    const signature = JSON.stringify(enrichMemoryAiTask.result);
    if (lastEnrichMemorySignatureRef.current === signature) return;
    lastEnrichMemorySignatureRef.current = signature;

    const dimensions = enrichMemoryAiTask.result.dimensions.join(", ");
    setMessages((current) => [
      ...current,
      createAssistantMessage(
        `${enrichMemoryAiTask.result.summary} Suggested category: ${enrichMemoryAiTask.result.category_label}.${dimensions ? ` Dimensions: ${dimensions}.` : ""} Next: ${enrichMemoryAiTask.result.next_action}`,
        {
          type: "apply_enrichment",
          title: enrichMemoryAiTask.result.title,
          tags: enrichMemoryAiTask.result.tags,
        },
      ),
    ]);
  }, [enrichMemoryAiTask.result]);

  const submitMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const userMessage: CreateMemoryAssistantMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
      };
      const nextMessages = [
        ...messages,
        userMessage,
      ];
      setMessages(nextMessages);
      setInput("");

      const routeResult = await routeTask.run({
        prompt: trimmed,
        surface: "story_composer",
      });

      const suggestedTask = routeResult?.result?.suggested_task;
      const normalizedBody = normalizeBody(bodyText);
      const normalizedTitle = title.trim();
      if (suggestedTask === "story.suggest_title") {
        await suggestTitleTask.run({
          title: normalizedTitle,
          body: normalizedBody,
        });
        return;
      }

      if (suggestedTask === "story.suggest_tags") {
        await suggestTagsTask.run({
          title: normalizedTitle,
          body: normalizedBody,
        });
        return;
      }

      if (suggestedTask === "story.classify_memory") {
        await classifyMemoryTask.run({
          title: normalizedTitle,
          body: normalizedBody,
        });
        return;
      }

      if (suggestedTask === "archive.enrich_memory") {
        await enrichMemoryAiTask.run({
          ...(normalizedTitle ? { title: normalizedTitle } : {}),
          ...(normalizedBody ? { body: normalizedBody } : {}),
        });
        return;
      }

      if (suggestedTask === "story.connect_related_memory") {
        await relatedMemoryTask.run({
          title: normalizedTitle,
          body: normalizedBody,
        });
        return;
      }

      if (suggestedTask === "story.identify_missing_details" || suggestedTask === "chat.deep_dive_followup") {
        await missingDetailsTask.run({
          title: normalizedTitle,
          body: normalizedBody,
        });
        return;
      }

      if (suggestedTask === "story.draft_from_notes") {
        if (!normalizedBody) {
          setMessages((current) => [
            ...current,
            createAssistantMessage(
              "Add some rough notes in the journal first, then I can turn them into a cleaner story draft.",
            ),
          ]);
          return;
        }

        await draftFromNotesTask.run({
          ...(normalizedTitle ? { title: normalizedTitle } : {}),
          notes: normalizedBody,
        });
        return;
      }

      if (suggestedTask === "story.expand_draft") {
        if (!normalizedBody) {
          setMessages((current) => [
            ...current,
            createAssistantMessage(
              "Write a little of the memory first, then I can expand it into a fuller draft.",
            ),
          ]);
          return;
        }

        await expandDraftTask.run({
          ...(normalizedTitle ? { title: normalizedTitle } : {}),
          body: normalizedBody,
          focus: inferExpandFocus(trimmed),
        });
        return;
      }

      if (suggestedTask === "story.organize_uploads") {
        if (uploadedFileIds.length === 0) {
          setMessages((current) => [
            ...current,
            createAssistantMessage(
              "Upload some files first, then I can help organize what should sit inline in the story and what should stay as an attachment.",
            ),
          ]);
          return;
        }

        await organizeUploadsTask.run({
          file_ids: uploadedFileIds,
        });
        return;
      }

      if (suggestedTask === "story.rewrite_draft") {
        await rewriteTask.run({
          title: normalizedTitle,
          body: normalizedBody,
          tone: inferRewriteToneFromIntent(trimmed, tone),
        });
        return;
      }

      if (!isComposeResponseUnavailable) {
        let hitServerError = false;
        const composeResponse = await composeResponseTask.run(
          {
            prompt: trimmed,
            surface: "story_composer",
            ...(normalizedTitle ? { title: normalizedTitle } : {}),
            ...(normalizedBody ? { body: normalizedBody } : {}),
            tone,
            uploaded_file_ids: uploadedFileIds,
            uploaded_media_count: uploadedMediaCount,
            uploaded_document_count: uploadedDocumentCount,
            messages: nextMessages.map((entry) => ({
              role: entry.role,
              content: entry.text,
            })),
          },
          {
            onError: (error) => {
              if ((error.status ?? 0) >= 500) {
                hitServerError = true;
              }
            },
          },
        );

        if (composeResponse?.result?.text) {
          return;
        }

        if (hitServerError) {
          setIsComposeResponseUnavailable(true);
        }
      }

      const assistantMessage = buildAssistantReply({
        prompt: trimmed,
        tone,
        title,
        bodyText,
        uploadedFileIds,
        uploadedMediaCount,
        uploadedDocumentCount,
      });

      setMessages((current) => [...current, assistantMessage]);
    },
    [
      bodyText,
      composeResponseTask,
      messages,
      missingDetailsTask,
      relatedMemoryTask,
      routeTask,
      rewriteTask,
      classifyMemoryTask,
      draftFromNotesTask,
      expandDraftTask,
      enrichMemoryAiTask,
      organizeUploadsTask,
      suggestTagsTask,
      suggestTitleTask,
      isComposeResponseUnavailable,
      title,
      uploadedDocumentCount,
      uploadedFileIds,
      uploadedMediaCount,
    ],
  );

  const applyAction = useCallback(
    (action: CreateMemoryAssistantAction) => {
      if (action.type === "apply_body") {
        onApplyBody(action.body, action.html);
        return;
      }

      if (action.type === "apply_title") {
        onApplyTitle(action.title);
        return;
      }

      if (action.type === "apply_enrichment") {
        if (action.title.trim()) {
          onApplyTitle(action.title);
        }
        onApplyTags(action.tags);
        return;
      }

      onApplyTags(action.tags);
    },
    [onApplyBody, onApplyTags, onApplyTitle],
  );

  return {
    input,
    isWorking:
      routeTask.isRunning ||
      rewriteTask.isRunning ||
      composeResponseTask.isRunning ||
      missingDetailsTask.isRunning ||
      relatedMemoryTask.isRunning ||
      draftFromNotesTask.isRunning ||
      expandDraftTask.isRunning ||
      organizeUploadsTask.isRunning ||
      enrichMemoryAiTask.isRunning ||
      suggestTitleTask.isRunning ||
      suggestTagsTask.isRunning ||
      classifyMemoryTask.isRunning,
    messages,
    suggestions: getContextualSuggestions({
      title,
      bodyText,
      uploadedFileIds,
      messagesCount: messages.length,
    }),
    tone,
    setTone,
    setInput,
    submitMessage,
    applyAction,
  };
}

function getToneLabel(tone: RewriteStoryDraftTone) {
  switch (tone) {
    case "reflective":
      return "Reflective & Wise";
    case "storyteller":
      return "Storyteller";
    case "beneficiaries":
      return "Letter to Beneficiaries";
    case "raw":
      return "Raw & Unfiltered";
  }
}

function inferRewriteToneFromIntent(
  message: string,
  selectedTone: CreateMemoryAssistantTone,
): RewriteStoryDraftTone {
  const normalizedPrompt = message.trim().toLowerCase();
  if (normalizedPrompt.includes("beneficiar") || normalizedPrompt.includes("letter")) {
    return "beneficiaries";
  }
  if (normalizedPrompt.includes("raw") || normalizedPrompt.includes("unfiltered")) {
    return "raw";
  }
  if (normalizedPrompt.includes("reflect") || normalizedPrompt.includes("wise")) {
    return "reflective";
  }

  switch (selectedTone) {
    case "legacy":
      return "beneficiaries";
    case "direct":
      return "raw";
    case "reflective":
      return "reflective";
    case "whimsical":
    default:
      return "storyteller";
  }
}

function inferExpandFocus(message: string) {
  const normalizedPrompt = message.trim().toLowerCase();
  if (normalizedPrompt.includes("emotion")) return "emotional clarity";
  if (normalizedPrompt.includes("detail") || normalizedPrompt.includes("sensory")) {
    return "sensory detail";
  }
  if (normalizedPrompt.includes("beneficiar") || normalizedPrompt.includes("legacy")) {
    return "legacy meaning";
  }
  return "story detail";
}

function buildAssistantReply({
  prompt,
  tone,
  title,
  bodyText,
  uploadedFileIds,
  uploadedMediaCount,
  uploadedDocumentCount,
}: {
  prompt: string;
  tone: CreateMemoryAssistantTone;
  title: string;
  bodyText: string;
  uploadedFileIds: string[];
  uploadedMediaCount: number;
  uploadedDocumentCount: number;
}) {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const normalizedBody = normalizeBody(bodyText);

  if (normalizedPrompt === "add sensory details") {
    return createAssistantMessage(
      "Add sounds, smells, textures, or the atmosphere around the moment. Even one detail about what you heard, smelled, saw, or felt will make this memory more vivid.",
    );
  }

  if (normalizedPrompt === "what was the hidden lesson here?") {
    return createAssistantMessage(
      "Try naming the lesson beneath the event: what changed in you, what you understood later, or what you hope someone else learns from this moment.",
    );
  }

  if (normalizedPrompt === "connect to a past memory") {
    return createAssistantMessage(
      "Look for an earlier moment this echoes. Was there a similar person, place, feeling, or decision in another season of your life that gives this story more meaning?",
    );
  }

  if (normalizedPrompt === "what details are missing?") {
    return createAssistantMessage(
      buildMissingDetailsGuidance({
        title,
        bodyText: normalizedBody,
        uploadedMediaCount,
        uploadedDocumentCount,
      }),
    );
  }

  if (normalizedPrompt.includes("title")) {
    const suggestedTitle = buildTitleSuggestion(title, normalizedBody);
    return createAssistantMessage(`Suggested title: ${suggestedTitle}`, {
      type: "apply_title",
      title: suggestedTitle,
    });
  }

  if (normalizedPrompt.includes("tag")) {
    const tags = buildTagSuggestion(title, normalizedBody);
    return createAssistantMessage(`Suggested tags: ${tags.join(", ")}`, {
      type: "apply_tags",
      tags,
    });
  }

  if (normalizedPrompt.includes("upload") || normalizedPrompt.includes("attachment")) {
    const summary =
      uploadedFileIds.length === 0
        ? "You have not added any uploads yet."
        : `You currently have ${uploadedMediaCount} media item${uploadedMediaCount === 1 ? "" : "s"} and ${uploadedDocumentCount} document${uploadedDocumentCount === 1 ? "" : "s"} attached to this story.`;
    return createAssistantMessage(summary);
  }

  return createAssistantMessage(
    `${getToneLead(tone)} Ask for help with missing details, titles, tags, earlier memories, uploads, or a rewrite shaped to the voice you selected.`,
  );
}

function createAssistantMessage(
  text: string,
  action?: CreateMemoryAssistantAction,
): CreateMemoryAssistantMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    text,
    action,
  };
}

function normalizeBody(bodyText: string) {
  return bodyText.replace(/\s+/g, " ").trim();
}

function buildTitleSuggestion(title: string, bodyText: string) {
  if (title.trim()) {
    return title.trim();
  }

  if (!bodyText) {
    return "A memory worth keeping";
  }

  const words = bodyText.split(/\s+/).slice(0, 5).join(" ");
  return words.length > 0 ? words : "A memory worth keeping";
}

function buildTagSuggestion(title: string, bodyText: string) {
  const source = `${title} ${bodyText}`.toLowerCase();
  const tags = new Set<string>();

  if (/\bfamily|mom|dad|sister|brother|child|children\b/.test(source)) {
    tags.add("Family");
  }
  if (/\bfriend|friends\b/.test(source)) {
    tags.add("Friendship");
  }
  if (/\blove|grateful|proud|happy|joy\b/.test(source)) {
    tags.add("Emotions");
  }
  if (/\btravel|trip|journey|flight|road\b/.test(source)) {
    tags.add("Travel");
  }
  if (/\blesson|learned|realized|realised\b/.test(source)) {
    tags.add("Life Lessons");
  }

  if (tags.size === 0) {
    tags.add("Personal");
    tags.add("Reflection");
  }

  return Array.from(tags).slice(0, 5);
}

function buildMissingDetailsGuidance({
  title,
  bodyText,
  uploadedMediaCount,
  uploadedDocumentCount,
}: {
  title: string;
  bodyText: string;
  uploadedMediaCount: number;
  uploadedDocumentCount: number;
}) {
  const prompts: string[] = [];
  const source = `${title} ${bodyText}`.toLowerCase();

  if (!/\b(i|we|he|she|they|mom|dad|friend|family|children|wife|husband)\b/.test(source)) {
    prompts.push("who was there");
  }
  if (!/\b(today|yesterday|morning|night|monday|tuesday|january|\d{1,2}[/-]\d{1,2})\b/.test(source)) {
    prompts.push("when it happened");
  }
  if (!/\b(home|school|church|road|park|beach|office|room|street|lagos|abuja)\b/.test(source)) {
    prompts.push("where it took place");
  }
  if (!/\b(happy|sad|afraid|grateful|angry|proud|worried|excited|calm)\b/.test(source)) {
    prompts.push("how you felt");
  }
  if (!/\b(saw|heard|smell|smelled|taste|tasted|warm|cold|bright|quiet|loud|soft|rough)\b/.test(source)) {
    prompts.push("what made the moment feel vivid");
  }
  if (uploadedMediaCount > 0 && uploadedDocumentCount === 0) {
    prompts.push("whether any documents or notes should be attached for context");
  }

  if (prompts.length === 0) {
    return "This draft already has a strong base. The next upgrade is to sharpen the emotional turn and the reason this moment matters to your future readers.";
  }

  return `A few details would strengthen this memory: ${prompts.join(", ")}.`;
}

function toHtmlParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getContextualSuggestions({
  title,
  bodyText,
  uploadedFileIds,
  messagesCount,
}: {
  title: string;
  bodyText: string;
  uploadedFileIds: string[];
  messagesCount: number;
}): CreateMemoryAssistantSuggestion[] {
  const hasTitle = title.trim().length > 0;
  const hasBody = normalizeBody(bodyText).length > 0;
  const hasUploads = uploadedFileIds.length > 0;

  if (!hasBody) {
    return [
      {
        id: "draft",
        label: "Turn notes into draft",
        prompt: "Turn these notes into a story draft",
        featured: true,
      },
      {
        id: "title",
        label: "Suggest a title",
        prompt: "Can you suggest a better title for this memory?",
      },
      ...(hasUploads
        ? [
            {
              id: "uploads",
              label: "Organize uploads",
              prompt: "Can you organize these uploads for this story?",
            },
          ]
        : []),
    ];
  }

  const suggestions: CreateMemoryAssistantSuggestion[] = [
    {
      id: "missing",
      label: "Missing details",
      prompt: "What details are missing?",
      featured: messagesCount === 0,
    },
    {
      id: "rewrite",
      label: "Rewrite draft",
      prompt: "Rewrite this in storyteller voice",
    },
    {
      id: "related",
      label: "Find related memory",
      prompt: "Connect to a past memory",
    },
  ];

  if (!hasTitle) {
    suggestions.push({
      id: "title",
      label: "Suggest a title",
      prompt: "Can you suggest a better title for this memory?",
    });
  }

  suggestions.push({
    id: "tags",
    label: "Suggest tags",
    prompt: "Can you suggest tags for this memory?",
  });

  if (hasUploads) {
    suggestions.push({
      id: "uploads",
      label: "Organize uploads",
      prompt: "Can you organize these uploads for this story?",
    });
  }

  return suggestions.slice(0, 5);
}

function getToneLead(tone: CreateMemoryAssistantTone) {
  switch (tone) {
    case "legacy":
      return "I will lean toward a legacy-minded voice.";
    case "direct":
      return "I will keep the guidance plain and direct.";
    case "reflective":
      return "I will keep the guidance calm and reflective.";
    case "whimsical":
    default:
      return "I will keep the guidance warm and lightly imaginative.";
  }
}
