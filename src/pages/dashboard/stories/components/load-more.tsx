import { useEffect, useRef } from "react";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";

interface StoriesLoadMoreProps {
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
  slot?: string;
}

/** Loads the next stories as the reader nears the end of the grid or list. */
export function StoriesLoadMore({
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
  slot = "stories-load-more",
}: StoriesLoadMoreProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isVisible = useIntersectionObserver(loadMoreRef, {
    rootMargin: "400px 0px",
  });

  useEffect(() => {
    if (isVisible && hasMore && !isLoadingMore) onLoadMore?.();
  }, [hasMore, isVisible, isLoadingMore, onLoadMore]);

  return (
    <div
      ref={loadMoreRef}
      data-slot={slot}
      className="flex min-h-10 w-full items-center justify-center py-2"
      aria-live="polite"
    >
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>Retry loading stories</Button>
      ) : isLoadingMore ? (
        <Spinner loading />
      ) : hasMore ? (
        <span className="sr-only">Loading more items when visible</span>
      ) : (
        <TypographyMuted className="text-sm text-text-neutral-weaker">
          End of items
        </TypographyMuted>
      )}
    </div>
  );
}
