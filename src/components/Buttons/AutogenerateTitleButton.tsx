"use client";

import { useCallback, type MouseEvent } from "react";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heading } from "lucide-react";
import { suggestStoryTitleTask } from "@/features/ai/tasks";
import { useAiTask } from "@/features/ai/use-ai-task";

interface AutogenerateTitleButtonProps {
  /** Current title field (optional hint for the model). */
  draftTitle: string;
  /** Plain text from the story editor. */
  bodyPlain: string;
  onTitle: (title: string) => void;
}

export function AutogenerateTitleButton({ draftTitle, bodyPlain, onTitle }: AutogenerateTitleButtonProps) {
  const titleTask = useAiTask(suggestStoryTitleTask, { mode: "suggest" });

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
      const completed = await titleTask.run({
        ...(title ? { title } : {}),
        ...(body ? { body } : {}),
      });
      const suggested = completed?.result?.title?.trim() || "";
      if (!suggested) {
        toast.error("No title returned. Try again.");
        return;
      }
      onTitle(suggested);
    },
    [bodyPlain, draftTitle, onTitle, titleTask],
  );

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={titleTask.isRunning}
      title="Suggest a title from your story"
      className={cn(
        "shrink-0 rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weaker",
        "px-3 font-inter text-xs font-semibold text-text-neutral-strong shadow-none",
        "hover:bg-fill-neutral-weak",
        "gap-1.5 disabled:opacity-60",
      )}
    >
      {titleTask.isRunning ? (
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
