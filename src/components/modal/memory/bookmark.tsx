"use client";

import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import { useModal } from "@/hooks/use-modal";
import { AddBookmarkIcon, RemoveBookmarkIcon } from "@/components/icons";
import type { IMemory } from "@/utility/interface";
import { useBookmark } from "@/hooks/use-bookmark";

interface BookmarkMemoryProps {
  data: IMemory;
}

export function BookmarkMemory({ data: memory }: BookmarkMemoryProps) {
  const { close } = useModal();
  const isBookmarked = memory.bookmarked ?? false;

  const { addToBookmark, removeFromBookmark, isLoading } = useBookmark({
    memoryId: memory._id,
    isBookmarked,
    onSuccess: () => close("bookmark-memory"),
  });

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("bookmark-memory")} />
      <div className="flex size-12 items-center justify-center rounded-full bg-[#F0F4FF] text-primary">
        {isBookmarked ? (
          <RemoveBookmarkIcon width={18} height={20} />
        ) : (
          <AddBookmarkIcon width={18} height={20} />
        )}
      </div>
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">
            {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          </h4>
          <span className="font-inter text-sm text-text-neutral-weak">
            {isBookmarked
              ? "Are you sure you want to remove this memory from your bookmarks? You can always add it back later."
              : "Add this memory to your bookmarks for quick access later. You can find all your bookmarked memories in the bookmarks section."}
          </span>
          {memory.title && (
            <div className="rounded-lg bg-grey-50 p-3">
              <p className="mb-1 text-sm font-medium text-text-neutral-strong">Memory:</p>
              <p className="line-clamp-2 text-sm text-text-neutral-weak">{memory.title}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => close("bookmark-memory")}
            className="h-10 flex-1 cursor-pointer rounded-lg border border-stroke-neutral-weak bg-white/1 px-4 py-2.5 font-inter text-sm font-semibold shadow"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={isBookmarked ? removeFromBookmark : addToBookmark}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 font-inter text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            <Spinner loading={isLoading} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 