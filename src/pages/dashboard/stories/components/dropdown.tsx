import { useRef, useState, type Ref } from "react";
import { restoreMemory, memoryActionError } from "@/api/memory-lifecycle";
import { canRestoreMemory } from "./memory-recovery";
import "@/components/motion/navigation-motion.css";
import { useModal } from "@/hooks/use-modal";
import type { IMemory } from "@/utility/interface";
import { useBookmark } from "@/hooks/use-bookmark";
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
  Info,
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
  onEdit,
  onShare,
  onViewDetails,
  onDelete,
  triggerRef,
}: {
  memory: IMemory;
  trigger?: "horizontal" | "vertical";
  onEdit?: () => void;
  onShare?: () => void;
  onViewDetails?: () => void;
  onDelete?: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const openingOverlayRef = useRef(false);
  const { open } = useModal();
  const [restoring, setRestoring] = useState(false);
  const restoringRef = useRef(false);
  const { toggleBookmark } = useBookmark({
    memoryId: memory._id,
    isBookmarked: memory.bookmarked,
  });

  const handleRestore = async () => {
    if (restoringRef.current) return;
    restoringRef.current = true;
    setRestoring(true);
    try {
      await restoreMemory(memory._id);
      toast.dismiss(`memory-deleted:${memory._id}`);
      toast.success("Memory restored");
    } catch (error) {
      toast.error(
        memoryActionError(
          error,
          "Couldn't restore this memory. Please try again.",
        ),
      );
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  };

  const isDeleted = memory.status === "deleted";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
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
      <DropdownMenuContent
        align="end"
        className="navigation-menu z-[250] border border-stroke-neutral-weak bg-popover text-text-neutral-strong"
        onCloseAutoFocus={(event) => {
          if (openingOverlayRef.current) {
            event.preventDefault();
            openingOverlayRef.current = false;
          }
        }}
      >
        <DropdownMenuGroup>
          {isDeleted ? (
            <DropdownMenuItem
              disabled={restoring || !canRestoreMemory(memory)}
              onSelect={() => void handleRestore()}
            >
              <RotateCcwIcon />
              {restoring ? "Restoring…" : "Restore"}
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  onEdit ? onEdit() : open("edit-memory", { memory })
                }
              >
                <PencilIcon />
                Edit story
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (onShare) {
                    openingOverlayRef.current = true;
                    onShare();
                  } else open("share-memory", { memory });
                }}
              >
                <Share2Icon />
                Share story
              </DropdownMenuItem>
              {onViewDetails ? (
                <DropdownMenuItem
                  onSelect={() => {
                    openingOverlayRef.current = true;
                    onViewDetails();
                  }}
                >
                  <Info />
                  Details
                </DropdownMenuItem>
              ) : null}
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
            onSelect={() => {
              if (onDelete) {
                openingOverlayRef.current = true;
                onDelete();
              } else open("delete-memory", { memory });
            }}
          >
            <Trash2Icon />
            {isDeleted ? "Delete permanently" : "Delete"}
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
        className="navigation-menu w-36 rounded-lg border border-v3-stroke-weak bg-popover p-0.5 text-popover-foreground shadow-md"
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
