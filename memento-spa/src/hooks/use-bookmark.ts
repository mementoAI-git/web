import { toast } from "sonner";
import { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { resolvePath } from "@/utility";
import useFetcher from "./use-fetcher";

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
  showToast = true,
}: UseBookmarkOptions) {
  const { trigger: addBookmark, isMutating: adding } = useFetcher(
    resolvePath(endpoint.bookmarkMemory, { id: memoryId }),
    "post",
  );
  const { trigger: removeBookmark, isMutating: removing } = useFetcher(
    resolvePath(endpoint.bookmarkMemory, { id: memoryId }),
    "delete",
  );

  const notify = (message: string) => {
    if (showToast) {
      toast.success(message);
    }
  };

  const notifyError = (message: string, error: unknown) => {
    if (showToast) {
      toast.error(message);
    }
    onError?.(error);
  };

  const refresh = () => {
    mutate(`${endpoint.memories}/${memoryId}`);
    mutate(endpoint.memoriesStats);
    mutate(`${endpoint.memories}?page=1`);
  };

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        const result = await removeBookmark({});
        if (result?.success) {
          notify("Memory removed from bookmarks successfully!");
        }
      } else {
        const result = await addBookmark();
        if (result?.success) {
          notify("Memory added to bookmarks successfully!");
        }
      }
      refresh();
      onSuccess?.();
    } catch (error) {
      notifyError("An error occurred while bookmarking", error);
    }
  };

  const addToBookmark = async () => {
    try {
      const result = await addBookmark();
      if (result?.success) {
        notify("Memory added to bookmarks successfully!");
        refresh();
        onSuccess?.();
      }
    } catch (error) {
      notifyError("An error occurred while bookmarking", error);
    }
  };

  const removeFromBookmark = async () => {
    try {
      const result = await removeBookmark({});
      if (result?.success) {
        notify("Memory removed from bookmarks successfully!");
        refresh();
        onSuccess?.();
      }
    } catch (error) {
      notifyError("An error occurred while removing bookmark", error);
    }
  };

  return {
    toggleBookmark,
    addToBookmark,
    removeFromBookmark,
    isLoading: adding || removing,
    isAdding: adding,
    isRemoving: removing,
  };
}
