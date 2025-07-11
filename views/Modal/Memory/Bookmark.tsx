"use client"

import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import AddBookmarkIcon from "@/public/icon/add-bookmark.svg";
import RemoveBookmarkIcon from "@/public/icon/remove-bookmark.svg";
import { IMemory } from "@/utility/interface";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";

export function BookmarkMemory({ data: memory }: { data: IMemory }) {
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory._id}/bookmark`, "post");
  const { trigger: removeBookmark, isMutating: removing } = useFetcher(`${endpoint.memories}/${memory._id}/bookmark`, "delete");
  const { close } = useModal();

  const handleBookmark = async () => {
    try {
      const result = await trigger();
      if (result?.success) {
        toast.success("Memory added to bookmarks successfully!");
        mutate(`${endpoint.memories}/${memory._id}`)
        mutate(endpoint.memoriesStats)
        mutate(`${endpoint.memories}?page=1`)
        close("bookmark-memory");
      }
    } catch (error) {
      toast.error("An error occurred while bookmarking");
    }
  };

  const handleRemoveBookmark = async () => {
    try {
      const result = await removeBookmark("");
      if (result?.success) {
        toast.success("Memory removed from bookmarks successfully!");
        mutate(`${endpoint.memories}/${memory._id}`)
        mutate(endpoint.memoriesStats)
        mutate(`${endpoint.memories}?page=1`)
        close("bookmark-memory");
      }
    } catch (error) {
      toast.error("An error occurred while removing bookmark");
    }
  };

  const isBookmarked = memory.bookmarked || false;

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
            disabled={isMutating || removing}
            onClick={isBookmarked ? handleRemoveBookmark : handleBookmark}
            className="flex-1 flex items-center gap-2 justify-center cursor-pointer bg-secondary text-white rounded-lg h-10 font-inter font-semibold text-sm"
          >
            {isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            <Spinner loading={isMutating || removing} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 