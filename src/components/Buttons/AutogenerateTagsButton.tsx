"use client";

import { useCallback } from "react";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { useMutation } from "@/hooks/use-api";
import autogenerateImg from "@/assets/image/autogenerate.svg";

type GenerateTagsResponse = { tags: string[] };
type GenerateTagsRequest = { title?: string; body?: string };

interface AutogenerateTagsButtonProps {
  title: string;
  body: string;
  onTagsGenerated: (newTags: string[]) => void;
}

export function AutogenerateTagsButton({ title, body, onTagsGenerated }: AutogenerateTagsButtonProps) {
  const { trigger, isLoading } = useMutation<GenerateTagsResponse, GenerateTagsRequest>(
    endpoint.generateTags,
    {
      method: "POST",
      skipErrorHandling: true,
      onSuccess: (result) => {
        if (result?.data?.tags && Array.isArray(result.data.tags)) {
          const newTags = result.data.tags.filter(
            (t): t is string => typeof t === "string" && t.length > 0 && t.length < 40
          );
          if (newTags.length > 0) {
            onTagsGenerated(newTags);
          } else {
            toast.error("No tags returned. Try again.");
          }
        } else {
          toast.error("No tags returned. Try again.");
        }
      },
      onError: (err) => {
        if (err?.status === 400) {
          toast.error(err?.message || "Enter a title or some content to generate tags");
        }
      },
    }
  );

  const handleClick = useCallback(async () => {
    const trimmedTitle = title?.trim() || "";
    const trimmedBody = body?.trim() || "";
    if (!trimmedTitle && !trimmedBody) {
      toast.error("Enter a title or some content to generate tags");
      return;
    }
    const payload: GenerateTagsRequest = {};
    if (trimmedTitle) payload.title = trimmedTitle;
    if (trimmedBody) payload.body = trimmedBody;
    await trigger(payload);
  }, [title, body, trigger]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="shrink-0 flex items-center justify-center mx-2 transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {isLoading ? (
        <Spinner loading className="size-4!" />
      ) : (
        <img src={autogenerateImg} alt="Autogenerate" className="h-7 w-auto" />
      )}
    </button>
  );
}
