import { Link } from "react-router-dom";
import { Ellipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExploreQuestionSource } from "@/features/explore/explore-types";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";

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
  const sourceLabel =
    source === "ai-generated"
      ? "Just for you"
      : source === "legacy"
        ? "From your history"
        : "Starter question";

  return (
    <article className="sky-card relative flex w-full items-start gap-3 rounded-[12px] border border-stroke-neutral-weak bg-fill-neutral-weaker p-3 sm:gap-6 sm:rounded-3xl sm:p-4">
      <img
        className="size-8 shrink-0 rounded-md bg-fill-neutral-weak object-cover sm:h-[113px] sm:w-[135px]"
        alt=""
        src={getQuestionIdenticonUrl(_id)}
        width={135}
        height={113}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-2 self-stretch sm:gap-4">
        <h3 className="font-garamond text-lg font-normal leading-snug text-text-neutral-strong sm:text-2xl">
          <Link
            to={`/chat/reply/${_id}`}
            aria-label={`Reply to: ${title}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[12px] sm:after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-stroke-brand-strong"
          >
            {title}
          </Link>
        </h3>
        <Badge
          variant="outline"
          className="h-auto gap-1.5 rounded-full border-stroke-neutral-strong bg-transparent px-2 py-0.5 font-geist text-xs font-medium sm:py-1 sm:text-sm text-text-neutral-strong"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-fill-info-strong sm:size-2.5"
          />
          {sourceLabel}
        </Badge>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-8 shrink-0 rounded-lg text-icon-neutral-weak sm:size-9"
            aria-label={`Topic options: ${title}`}
            disabled={isFeedbackPending}
            aria-busy={isFeedbackPending}
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={isFeedbackPending}
              onSelect={() => onFeedback(_id, "not-relevant")}
            >
              Not relevant to me
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
