import { useState, type MouseEvent } from "react";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import type { SharedItem } from "@/api/people";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";
import { useModal } from "@/hooks/use-modal";
import { storyDestination } from "@/lib/story-destination";
import { cn } from "@/utility";

const MOBILE_MAX_WIDTH = 640;

function storyThumbnail(attachments: SharedItem["attachments"]) {
  const ready = attachments.filter(
    (file) => file.status !== "processing" && file.status !== "failed",
  );
  const image = ready.find((file) => file.type?.startsWith("image/"));
  if (image?.url) return image.url;
  return ready.find((file) => file.thumbnail)?.thumbnail ?? null;
}

/** A memory shared in a connection chat. Opens the way a story card does: the story modal, or its page on phones. */
export function SharedMemoryLink({
  item,
  mine,
  onTalk,
  onRemove,
}: {
  item: SharedItem;
  mine: boolean;
  onTalk?: (id: string, title: string) => void;
  onRemove?: () => void;
}) {
  const { open } = useModal();
  const identicon = getQuestionIdenticonUrl(item.source_id);
  const thumbnail = storyThumbnail(item.attachments);
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
  const date = new Date(item.shared_date || item.original_date);
  const openMemory = (event: MouseEvent) => {
    if (window.innerWidth < MOBILE_MAX_WIDTH) return;
    event.preventDefault();
    open("view-memory", { memoryId: item.source_id });
  };

  return (
    <div className={cn("flex items-center gap-1", mine && "flex-row-reverse")}>
      <Link
        to={storyDestination({ _id: item.source_id })}
        onClick={openMemory}
        className="sky-card flex w-[320px] min-w-0 max-w-[85%] flex-col overflow-hidden rounded-[16px] bg-fill-neutral-weak transition-colors hover:bg-fill-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
      >
        <img
          src={thumbnail && thumbnail !== failedThumbnail ? thumbnail : identicon}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedThumbnail(thumbnail)}
          className="aspect-[1.91/1] w-full bg-fill-neutral-weak object-cover"
        />
        <span className="min-w-0 px-3 py-2.5">
          <span className="line-clamp-2 font-geist text-sm font-medium text-text-neutral-strong">
            {item.title}
          </span>
          <span className="mt-0.5 block truncate font-geist text-xs text-text-neutral-weak">
            {mine ? "You" : item.contributor.name} shared a memory ·{" "}
            <time dateTime={date.toISOString()}>
              {date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </time>
          </span>
        </span>
      </Link>
      {(onTalk || onRemove) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="people-control size-8 shrink-0"
              aria-label={`Actions for ${item.title}`}
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={mine ? "end" : "start"}
            className="people-menu bg-bg-neutral text-text-neutral-strong"
          >
            {onTalk && (
              <DropdownMenuItem
                onSelect={() => onTalk(item.source_id, item.title)}
              >
                Talk about this memory
              </DropdownMenuItem>
            )}
            {onRemove && (
              <DropdownMenuItem
                className="text-text-error-strong"
                onSelect={onRemove}
              >
                Remove from this chat
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
