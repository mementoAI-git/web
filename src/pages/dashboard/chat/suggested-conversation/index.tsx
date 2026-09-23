"use client";

import { useCallback, useEffect, useRef } from "react";
import Topic, { TopicSkeleton } from "@/components/topic";
import endpoint from "@/api/endpoint";
import useSWRInfinite from "swr/infinite";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import { getCategory } from "@/utility";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import GoBack from "@/components/go-back";
import { TypographyH1, TypographyH2, TypographyMuted } from "@/components/ui/typography";

type ConversationSuggestion = {
  _id: string;
  title: string;
  category?: string;
  tag?: string[];
};

export default function SuggestedConversation() {
  // Get the key function for useSWRInfinite
  const getKey = (pageIndex: number, previousPageData: { data?: { hasNextPage?: boolean } } | null) => {
    // If we've reached the end, return null to stop fetching
    if (previousPageData && !previousPageData.data?.hasNextPage) return null;

    // Return the URL for the next page
    return `${endpoint.suggestions}?page=${pageIndex + 1}`;
  };

  const {
    data,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, paginatedResponseFetcher<ConversationSuggestion>, {
    revalidateOnFocus: false,
    revalidateFirstPage: false
  });

  // Flatten all pages of data into a single array
  const conversations = data ? data.flatMap(page => page?.data?.docs || []) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.data?.docs?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.hasNextPage === false);

  const fetchMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isLoadingMore, isReachingEnd, size, setSize]);

  // Use the intersection observer hook
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  // Trigger fetch when element is intersecting
  useEffect(() => {
    if (isIntersecting) {
      fetchMore();
    }
  }, [isIntersecting, fetchMore]);

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="pb-2 sm:pb-4 space-y-5 pt-12">
          <div>
            <GoBack />
          </div>
          <TypographyH1 className="font-garamond text-[24px] font-normal leading-[32px] text-sand-12 sm:text-[32px] sm:leading-[40px] md:text-[40px] md:leading-[48px]">
            Suggested conversations
          </TypographyH1>
        </div>
        <div className="overflow-y-auto hide-scrollbar scroll-smooth pt-2 sm:pt-8" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {
              !isEmpty &&
              conversations.map((c, i) => {
                const category = getCategory(c?.category)
                return (
                  <Topic
                    key={i}
                    id={c?._id}
                    title={c.title}
                    image={category?.image}
                    tag={category ? category?.title : c?.tag[0]}
                    className="p-3"
                  />
                )
              })
            }
            {/* Show loading skeletons for additional pages */}
            {isLoadingMore && !isLoading && (
              Array.from({ length: 6 }, (_, i) => (
                <TopicSkeleton key={`skeleton-more-${i}`} />
              ))
            )}
          </div>

          {/* Empty state */}
          {!isLoading && isEmpty && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-2">
                <TypographyH2 className="text-lg font-medium text-sand-11">No suggestions available</TypographyH2>
                <TypographyMuted className="text-sm text-sand-10">Check back later for new conversation suggestions.</TypographyMuted>
              </div>
            </div>
          )}

          {/* The sentinel element for infinite scroll */}
          {!isReachingEnd && (
            <div ref={loadMoreRef} className="w-full h-20" />
          )}
        </div>
      </div>
    </div>
  );
}
