import { toast } from "sonner";
import { mutate } from "swr";
import useFetcher from "./use-fetcher";
import endpoint from "@/api/endpoint";
import { resolvePath } from "@/utility";

interface UseBookmarkOptions {
  memoryId: string;
  isBookmarked: boolean;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  showToast?: boolean;
}

export function useBookmark({
  memoryId,
  isBookmarked,
  onSuccess,
  onError,
  showToast = true
}: UseBookmarkOptions) {
  const { trigger: addBookmark, isMutating: adding } = useFetcher(resolvePath(endpoint.bookmarkMemory, { id: memoryId }), "post");
  const { trigger: removeBookmark, isMutating: removing } = useFetcher(resolvePath(endpoint.bookmarkMemory, { id: memoryId }), "delete");

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        const result = await removeBookmark({});
        if (result?.success) {
          if (showToast) {
            toast.success("Memory removed from bookmarks successfully!");
          }
        }
      } else {
        const result = await addBookmark();
        if (result?.success) {
          if (showToast) {
            toast.success("Memory added to bookmarks successfully!");
          }
        }
      }

      // Update the cache
      mutate(`${endpoint.memories}/${memoryId}`);
      mutate(endpoint.memoriesStats);
      mutate(`${endpoint.memories}?page=1`);

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      if (showToast) {
        toast.error("An error occurred while bookmarking");
      }
      // Call error callback if provided
      onError?.(error);
    }
  };

  const addToBookmark = async () => {
    try {
      const result = await addBookmark();
      if (result?.success) {
        if (showToast) {
          toast.success("Memory added to bookmarks successfully!");
        }
        mutate(`${endpoint.memories}/${memoryId}`);
        mutate(endpoint.memoriesStats);
        mutate(`${endpoint.memories}?page=1`);
        onSuccess?.();
      }
    } catch (error) {
      if (showToast) {
        toast.error("An error occurred while bookmarking");
      }
      onError?.(error);
    }
  };

  const removeFromBookmark = async () => {
    try {
      const result = await removeBookmark({});
      if (result?.success) {
        if (showToast) {
          toast.success("Memory removed from bookmarks successfully!");
        }
        mutate(`${endpoint.memories}/${memoryId}`);
        mutate(endpoint.memoriesStats);
        mutate(`${endpoint.memories}?page=1`);
        onSuccess?.();
      }
    } catch (error) {
      if (showToast) {
        toast.error("An error occurred while removing bookmark");
      }
      onError?.(error);
    }
  };

  return {
    toggleBookmark,
    addToBookmark,
    removeFromBookmark,
    isLoading: adding || removing,
    isAdding: adding,
    isRemoving: removing
  };
}

