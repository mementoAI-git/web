"use client";

import { useCallback, type MouseEvent } from "react";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { useMutation } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heading } from "lucide-react";

type GenerateTitleResponse = { title: string };
type GenerateTitleRequest = { title?: string; body?: string };

function extractGeneratedTitle(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  const inner = r.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const nested = inner as Record<string, unknown>;
    const t = nested.title;
    if (typeof t === "string" && t.trim().length > 0) return t.trim();
    const double = nested.data;
    if (double && typeof double === "object" && !Array.isArray(double)) {
      const deep = (double as Record<string, unknown>).title;
      if (typeof deep === "string" && deep.trim().length > 0) return deep.trim();
    }
  }
  if (typeof r.title === "string" && r.title.trim().length > 0) return r.title.trim();
  return null;
}

interface AutogenerateTitleButtonProps {
  /** Current title field (optional hint for the model). */
  draftTitle: string;
  /** Plain text from the story editor. */
  bodyPlain: string;
  onTitle: (title: string) => void;
}

export function AutogenerateTitleButton({ draftTitle, bodyPlain, onTitle }: AutogenerateTitleButtonProps) {
  const { trigger, isLoading } = useMutation<GenerateTitleResponse, GenerateTitleRequest>(
    endpoint.generateStoryTitle,
    {
      method: "POST",
      skipErrorHandling: true,
      onError: (err) => {
        if (err?.status === 400) {
          toast.error(err?.message || "Add some story text or a title to suggest from");
        } else {
          toast.error(err?.message || "Could not suggest a title. Try again.");
        }
      },
    },
  );

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const title = draftTitle?.trim() || "";
      const body = bodyPlain?.trim() || "";
      if (!title && !body) {
        toast.error("Add some story text or a title to suggest from");
        return;
      }
      const payload: GenerateTitleRequest = {};
      if (title) payload.title = title;
      if (body) payload.body = body;
      const result = await trigger(payload);
      if (!result) return;
      const suggested = extractGeneratedTitle(result);
      if (suggested) {
        onTitle(suggested);
      } else {
        toast.error("No title returned. Try again.");
      }
    },
    [draftTitle, bodyPlain, trigger, onTitle],
  );

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      title="Suggest a title from your story"
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
          <Heading className="size-3.5 text-text-brand-strong" aria-hidden />
          Suggest title
        </>
      )}
    </Button>
  );
}
