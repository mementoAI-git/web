"use client";

import { useCallback, type MouseEvent } from "react";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { useMutation } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type GenerateTagsResponse = { tags: string[] };
type GenerateTagsRequest = { title?: string; body?: string };

/** Unwrap tags from POST /ai/generate-tags (ApiResponse shape or rare nested payloads). */
function extractGeneratedTags(result: unknown): string[] {
  if (!result || typeof result !== "object") return [];
  const r = result as Record<string, unknown>;
  const inner = r.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const nested = inner as Record<string, unknown>;
    const tags = nested.tags;
    if (Array.isArray(tags)) {
      return tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
    }
    const double = nested.data;
    if (double && typeof double === "object" && !Array.isArray(double)) {
      const deep = (double as Record<string, unknown>).tags;
      if (Array.isArray(deep)) {
        return deep.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
      }
    }
  }
  if (Array.isArray(r.tags)) {
    return (r.tags as unknown[]).filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  }
  return [];
}

interface AutogenerateTagsButtonProps {
  title: string;
  body: string;
  onTagsGenerated: (newTags: string[]) => void;
}

export function AutogenerateTagsButton({ title, body, onTagsGenerated }: AutogenerateTagsButtonProps) {
  const { trigger, isLoading } = useMutation<GenerateTagsResponse, GenerateTagsRequest>(endpoint.generateTags, {
    method: "POST",
    skipErrorHandling: true,
    onError: (err) => {
      if (err?.status === 400) {
        toast.error(err?.message || "Enter a title or some content to generate tags");
      } else {
        toast.error(err?.message || "Could not generate tags. Try again.");
      }
    },
  });

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const trimmedTitle = title?.trim() || "";
      const trimmedBody = body?.trim() || "";
      if (!trimmedTitle && !trimmedBody) {
        toast.error("Enter a title or some content to generate tags");
        return;
      }
      const payload: GenerateTagsRequest = {};
      if (trimmedTitle) payload.title = trimmedTitle;
      if (trimmedBody) payload.body = trimmedBody;
      const result = await trigger(payload);
      if (!result) {
        return;
      }
      const newTags = extractGeneratedTags(result).filter(
        (t): t is string => typeof t === "string" && t.length > 0 && t.length < 40,
      );
      if (newTags.length > 0) {
        onTagsGenerated(newTags);
      } else {
        toast.error("No tags returned. Try again.");
      }
    },
    [title, body, trigger, onTagsGenerated],
  );

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      title="Suggest tags from your title and story"
      className={cn(
        "shrink-0 rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weaker",
        "px-3 font-inter text-xs font-semibold text-text-neutral-strong shadow-none",
        "hover:bg-fill-neutral-weak",
        "gap-1.5 disabled:opacity-60",
      )}
    >
      {isLoading ? (
        <Spinner loading className="size-3.5!" />
      ) : (
        <>
          <Sparkles className="size-3.5 text-text-brand-strong" aria-hidden />
          Autotag
        </>
      )}
    </Button>
  );
}
