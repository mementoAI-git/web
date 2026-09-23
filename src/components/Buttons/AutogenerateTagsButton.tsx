"use client";

import { useCallback, type MouseEvent, type ReactNode } from "react";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { suggestStoryTagsTask } from "@/features/ai/tasks";
import { useAiTask } from "@/features/ai/use-ai-task";

interface AutogenerateTagsButtonProps {
  title: string;
  body: string;
  onTagsGenerated: (newTags: string[]) => void;
  label?: string;
  className?: string;
  icon?: ReactNode;
}

export function AutogenerateTagsButton({
  title,
  body,
  onTagsGenerated,
  label = "Autotag",
  className,
  icon,
}: AutogenerateTagsButtonProps) {
  const tagsTask = useAiTask(suggestStoryTagsTask, { mode: "suggest" });

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
      const completed = await tagsTask.run({
        ...(trimmedTitle ? { title: trimmedTitle } : {}),
        ...(trimmedBody ? { body: trimmedBody } : {}),
      });
      const newTags = (completed?.result?.tags ?? []).filter(
        (t): t is string => typeof t === "string" && t.length > 0 && t.length < 40,
      );
      if (newTags.length > 0) {
        onTagsGenerated(newTags);
      } else {
        toast.error("No tags returned. Try again.");
      }
    },
    [body, onTagsGenerated, tagsTask, title],
  );

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={tagsTask.isRunning}
      title="Suggest tags from your title and story"
      className={cn(
        "shrink-0 rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weaker",
        "px-3 font-inter text-xs font-semibold text-text-neutral-strong shadow-none",
        "hover:bg-fill-neutral-weak",
        "gap-1.5 disabled:opacity-60",
        className,
      )}
    >
      {tagsTask.isRunning ? (
        <Spinner loading className="size-3.5!" />
      ) : (
        <>
          {icon ?? <Sparkles className="size-3.5 text-text-brand-strong" aria-hidden />}
          {label}
        </>
      )}
    </Button>
  );
}
