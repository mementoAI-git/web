import { Link } from "react-router-dom";
import questionImage from "@/assets/image/question-2.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExploreQuestionSource } from "@/features/explore/explore-types";

interface CategoryPromptCardProps {
  title: string;
  _id: string;
  source?: ExploreQuestionSource;
  isFeedbackPending?: boolean;
  onFeedback: (promptId: string, status: "skipped" | "not-relevant") => void;
}

export default function CategoryPromptCard({
  title,
  _id,
  source = "starter",
  isFeedbackPending = false,
  onFeedback,
}: CategoryPromptCardProps) {
  const sourceLabel = source === "ai-generated" ? "Just for you" : source === "legacy" ? "From your history" : "Starter question";

  return (
    <article className="flex w-full flex-col items-start gap-4 rounded-2xl border border-stroke-neutral-weak bg-bg-neutral p-6 sm:flex-row sm:items-center sm:gap-10">
      <div className="flex w-full items-start justify-between sm:w-fit">
        <div className="flex size-18 shrink-0 items-center justify-center sm:size-37 sm:p-6">
          <img className="size-full shrink-0 object-contain" alt="" aria-hidden="true" src={questionImage} />
        </div>
        <Badge variant={source === "ai-generated" ? "default" : "secondary"}>{sourceLabel}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <h3 className="font-garamond text-xl text-text-neutral-strong md:text-2xl">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to={`/chat/reply/${_id}`} aria-label={`Reply to: ${title}`}>
              Reply
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={isFeedbackPending}
            aria-label="Skip this question"
            aria-busy={isFeedbackPending}
            onClick={() => onFeedback(_id, "skipped")}
          >
            Skip
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={isFeedbackPending}
            aria-label="Mark this question as not relevant"
            aria-busy={isFeedbackPending}
            onClick={() => onFeedback(_id, "not-relevant")}
          >
            Not relevant to me
          </Button>
        </div>
      </div>
    </article>
  );
}
