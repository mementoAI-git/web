"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { SearchIcon } from "@/components/icons";
import ConversationBar from "@/components/conversation-bar";
import SectionSkeleton from "./section-skeletion";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import type { IMemory } from "@/utility/interface";
import GoBack from "@/components/go-back";

dayjs.extend(calendar);

// Simplified calendar date function using dayjs calendar plugin
export const getCalendarDate = (date: Date | string) => {
  return dayjs(date).calendar(null, {
    sameDay: '[Today]',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse: 'DD MMM YYYY'
  });
};

// Helper function to group memories by date using calendar format
function groupMemoriesByDate(memories: IMemory[]) {
  const grouped: { [key: string]: IMemory[] } = {};

  memories.forEach(memory => {
    const calendarLabel = getCalendarDate(memory.created_at);
    if (!grouped[calendarLabel]) {
      grouped[calendarLabel] = [];
    }
    grouped[calendarLabel].push(memory);
  });

  // Define order for calendar labels
  const labelOrder = [
    'Today',
    'Tomorrow',
    'Yesterday',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Last Monday', 'Last Tuesday', 'Last Wednesday', 'Last Thursday', 'Last Friday', 'Last Saturday', 'Last Sunday'
  ];

  // Sort dates with custom order
  const sortedLabels = Object.keys(grouped).sort((a, b) => {
    const aIndex = labelOrder.indexOf(a);
    const bIndex = labelOrder.indexOf(b);

    // If both are in the predefined order, sort by that order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // If only one is in predefined order, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // If neither is in predefined order, sort alphabetically
    return a.localeCompare(b);
  });

  return sortedLabels.map(label => ({
    label,
    memories: grouped[label],
    date: label.includes('Last') || label === 'Today' || label === 'Yesterday' || label === 'Tomorrow'
      ? dayjs().format('DD/MM/YY')
      : label
  }));
}

export default function RecentConversation() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get the key function for useSWRInfinite
  const getKey = (pageIndex: number, previousPageData: any) => {
    // If we've reached the end, return null to stop fetching
    if (previousPageData && !previousPageData.data?.hasNextPage) return null;

    // Return the URL for the next page with search query
    const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    return `${endpoint.conversations}?page=${pageIndex + 1}${searchParam}`;
  };

  const {
    data,
    isLoading,
    size,
    setSize,
    mutate
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false
  });

  // Flatten all pages of data into a single array
  const allMemories = data ? data.flatMap(page => page?.data?.docs || []) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.data?.docs?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.hasNextPage === false);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isLoadingMore, isReachingEnd, size, setSize]);

  // Use the intersection observer hook
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  // Filter and group memories
  const groupedMemories = useMemo(() => {
    if (allMemories.length === 0) return [];

    let filteredMemories = allMemories;

    // Apply search filter (this is now handled by the API, but keeping for client-side filtering if needed)
    if (searchQuery.trim()) {
      filteredMemories = filteredMemories.filter((memory: IMemory) =>
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return groupMemoriesByDate(filteredMemories);
  }, [allMemories, searchQuery]);

  // Trigger loadMore when the sentinel element intersects
  useEffect(() => {
    if (isIntersecting) {
      loadMore();
    }
  }, [isIntersecting, loadMore]);

  // Reset pagination when search changes
  useEffect(() => {
    setSize(1);
    mutate();
  }, [searchQuery, setSize, mutate]);

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-6 sm:py-12 flex flex-col gap-3 sm:gap-10">
          <div>
            <GoBack />
          </div>
          <h2 className="text-2xl sm:text-[40px] sm:leading-[48px] font-normal font-garamond text-sand-12">
            Recent conversations
          </h2>
          <div className="bg-white flex items-center gap-2 border border-gray-200 rounded-lg p-3.5">
            <SearchIcon width={15} height={15} className="text-gray-500" />
            <input
              placeholder="Search..."
              className="outline-none w-full flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Show skeletons only when initial load is in progress */}
          {isLoading && groupedMemories.length === 0 ?
            <>
              <SectionSkeleton />
              <SectionSkeleton />
            </> :
            groupedMemories.length === 0 ?
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? "No conversations found matching your search." : "No conversations yet."}
                </p>
              </div> :
              <>
                {groupedMemories.map((group, index) => (
                  <div key={`${group.label}-${index}`} className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col min-w-30 shrink-0">
                      <span className="font-bold text-sm font-inter text-gray-800">{group.label}</span>
                      <span className="text-gray-500 text-sm font-inter font-normal">{group.date}</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-4">
                      {group.memories.map((memory, i) => (
                        <ConversationBar
                          key={memory._id || i}
                          size="lg"
                          _id={memory._id}
                          title={memory.title || "Untitled Conversation"}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Loading indicator for pagination */}
                {isLoadingMore && !isLoading && (
                  <SectionSkeleton />
                )}
              </>
          }
        </div>

        {/* The sentinel element for infinite scroll */}
        {!isReachingEnd ?
          <div ref={loadMoreRef} className="w-full h-10" /> :
          <div className="w-full h-10" />
        }
      </div>
    </div>
  );
}
