"use client"

import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import { useModal } from "@/hooks/use-modal";
import AddBookmarkIcon from "@/public/icon/add-bookmark.svg";
import RemoveBookmarkIcon from "@/public/icon/remove-bookmark.svg";
import { IMemory } from "@/utility/interface";
import { useBookmark } from "@/hooks/use-bookmark";

export function BookmarkMemory({ data: memory }: { data: IMemory }) {
  const { close } = useModal();
  const isBookmarked = memory.bookmarked || false;

  const { addToBookmark, removeFromBookmark, isLoading } = useBookmark({
    memoryId: memory._id,
    isBookmarked,
    onSuccess: () => close("bookmark-memory")
  });

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("bookmark-memory")} />
      <div className="flex justify-center items-center cursor-pointer rounded-full size-12 text-primary bg-[#F0F4FF]">
        {isBookmarked ? (
          <RemoveBookmarkIcon width={18} height={20} />
        ) : (
          <AddBookmarkIcon width={18} height={20} />
        )}
      </div>
      <div className="space-y-6 mt-5">
        <div className="space-y-4">
          <h4 className="modal-title">
            {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          </h4>
          <span className="text-grey-600 text-sm font-inter">
            {isBookmarked
              ? "Are you sure you want to remove this memory from your bookmarks? You can always add it back later."
              : "Add this memory to your bookmarks for quick access later. You can find all your bookmarked memories in the bookmarks section."
            }
          </span>
          {memory.title && (
            <div className="bg-grey-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-grey-800 mb-1">Memory:</p>
              <p className="text-sm text-grey-600 line-clamp-2">{memory.title}</p>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => close("bookmark-memory")}
            className="flex-1 cursor-pointer bg-white/1 border border-[#0011661A] rounded-lg h-10 font-inter font-semibold text-sm shadow"
          >
            Cancel
          </button>
          <button
            disabled={isLoading}
            onClick={isBookmarked ? removeFromBookmark : addToBookmark}
            className="flex-1 flex items-center gap-2 justify-center cursor-pointer bg-secondary text-white rounded-lg h-10 font-inter font-semibold text-sm"
          >
            {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            <Spinner loading={isLoading} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 