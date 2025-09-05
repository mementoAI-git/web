"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Topic, { TopicSkeleton } from "@/components/Topic";
import endpoint from "@/api/endpoint";
import useSWR from "swr";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import { isEmpty } from "@/utility";

export default function SuggestedConversation() {
  const [conversations, setConversations] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useSWR(`${endpoint.suggestions}?page=${page}}`);

  const fetchMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  // Use the new hook pattern: create a ref and pass it to the hook.
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  // Use a useEffect to trigger the fetch when the element is intersecting.
  useEffect(() => {
    if (isIntersecting) {
      fetchMore();
    }
  }, [isIntersecting, fetchMore]);

  useEffect(() => {
    if (data?.data?.docs) {
      if (page === 1) {
        // Reset data for new search or initial load
        setConversations(data.data.docs);
      } else {
        // Append new data for pagination
        setConversations(prev => [...prev, ...data.data.docs]);
      }

      // Check if there are more pages - be more explicit about this
      const hasNextPage = data.data.hasNextPage !== false && data.data.docs.length > 0;
      setHasMore(hasNextPage);
    }
  }, [data, page]);

  return (
    <div className="container">
      <div className="pb-4 pt-12">
        <h2 className="text-[40px] leading-[48px] font-normal font-canela text-sand-12">
          Suggested conversations
        </h2>
      </div>
      <div className="overflow-y-auto hide-scrollbar scroll-smooth pt-8" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="grid grid-cols-3 gap-6">
          {/* Show skeletons only during initial loading */}
          {isLoading && page === 1 && (
            Array.from({ length: 6 }, (_, i) => (
              <TopicSkeleton key={`skeleton-${i}`} />
            ))
          )}
          {
            !isEmpty(conversations) &&
            conversations.map((conversation, i) => (
              <Topic
                key={i}
                title={conversation.title}
                tag={conversation.tag}
                className="p-3"
              />
            ))
          }
          {isLoading && page > 1 && (
            Array.from({ length: 6 }, (_, i) => (
              <TopicSkeleton key={`skeleton-${i}`} />
            ))
          )}
        </div>

        {/* Empty state */}
        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-sand-11">No suggestions available</h3>
              <p className="text-sm text-sand-10">Check back later for new conversation suggestions.</p>
            </div>
          </div>
        )}

        {/* The sentinel element for infinite scroll */}
        <div ref={loadMoreRef} className="w-full h-20" />
      </div>
    </div>
  );
}