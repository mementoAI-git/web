"use client";

import { useCallback } from "react";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { useMutation } from "@/hooks/use-api";

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <defs>
      <linearGradient id="sparkle-grad" x1="0" y1="0" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9E77ED" />
        <stop offset="100%" stopColor="#6941C6" />
      </linearGradient>
    </defs>
    <path d="M9 1.5L10.545 6.455L15.5 8L10.545 9.545L9 14.5L7.455 9.545L2.5 8L7.455 6.455L9 1.5Z" fill="url(#sparkle-grad)" />
    <path d="M14.5 12.5L15.25 14.75L17.5 15.5L15.25 16.25L14.5 18.5L13.75 16.25L11.5 15.5L13.75 14.75L14.5 12.5Z" fill="url(#sparkle-grad)" opacity="0.7" />
    <path d="M3 1L3.5 2.5L5 3L3.5 3.5L3 5L2.5 3.5L1 3L2.5 2.5L3 1Z" fill="url(#sparkle-grad)" opacity="0.5" />
  </svg>
);

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
      className="shrink-0 flex items-center gap-1.5 bg-[#EEEAF8] hover:bg-[#E5DFFF] text-[#6941C6] font-inter font-semibold text-sm px-3 py-1 mx-2 rounded-lg transition-colors disabled:opacity-60"
    >
      {isLoading ? <Spinner loading className="size-4!" /> : <SparkleIcon />}
      Autogenerate
    </button>
  );
}
