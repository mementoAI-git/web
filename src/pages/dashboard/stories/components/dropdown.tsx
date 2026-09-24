import { useModal } from "@/hooks/use-modal";
import type { IMemory } from "@/utility/interface";
import { useBookmark } from "@/hooks/use-bookmark";
import useFetcher from "@/hooks/use-fetcher";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  BookmarkIcon,
  BookmarkMinusIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";

const FILTER_LABELS = {
  all: "All",
  bookmarked: "Bookmarked",
  deleted: "Deleted",
};

export function MemoryItemActions({
  memory,
  trigger = "vertical",
}: {
  memory: IMemory;
  trigger?: "horizontal" | "vertical";
}) {
  const { open } = useModal();
  const { trigger: restoreMemory } = useFetcher(
    resolvePath(endpoint.restoreMemory, { id: memory._id }),
  );
  const { toggleBookmark } = useBookmark({
    memoryId: memory._id,
    isBookmarked: memory.bookmarked,
  });

  const handleRestore = async () => {
    await restoreMemory();
    await mutate(
      (key) => typeof key === "string" && key.startsWith(`${endpoint.stories}`),
    );
    toast.success("Memory restored successfully");
  };

  const isDeleted = memory.status === "deleted";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={trigger === "horizontal" ? "ghost" : "outline"}
          size="icon-sm"
          aria-label="Story actions"
        >
          {trigger === "horizontal" ? (
            <EllipsisIcon data-icon="inline-start" />
          ) : (
            <EllipsisVerticalIcon data-icon="inline-start" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {isDeleted ? (
            <DropdownMenuItem onSelect={() => void handleRestore()}>
              <RotateCcwIcon />
              Restore
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onSelect={() => open("edit-memory", { memory })}
              >
                <PencilIcon />
                Edit story
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => open("share-memory", { memory })}
              >
                <Share2Icon />
                Share story
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={toggleBookmark}>
                {memory.bookmarked ? <BookmarkMinusIcon /> : <BookmarkIcon />}
                {memory.bookmarked ? "Remove bookmark" : "Add bookmark"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => open("delete-memory", { memory })}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MemoryListFilterProps {
  value?: "all" | "bookmarked" | "deleted";
  onChange: (v: "all" | "bookmarked" | "deleted") => void;
}

export function MemoryListFilter({
  value = "all",
  onChange,
}: MemoryListFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-v3-stroke-weak bg-white text-v3-text-strong hover:bg-v3-fill-weaker font-inter text-sm"
        >
          <FilterIcon className="size-4 mr-1.5" />
          Filter: {FILTER_LABELS[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-36 rounded-lg border border-v3-stroke-weak bg-popover p-0.5 text-popover-foreground shadow-md"
      >
        {(Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>).map(
          (key) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-xs",
                value === key
                  ? "bg-v3-fill-weaker text-v3-text-strong"
                  : "text-v3-text-weak focus:bg-v3-fill-weaker focus:text-v3-text-strong",
              )}
            >
              <span
                className={cn(
                  "mr-1.5 flex size-3.5 items-center justify-center",
                  value === key && "text-v3-brand-strong",
                )}
              >
                {value === key && "✓"}
              </span>
              {FILTER_LABELS[key]}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
