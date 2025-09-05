"use client";

import SearchIcon from "@/public/icon/dashboard/search.svg";
import TopicBar from "@/components/Topic/TopicBar";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { IMemory } from "@/utility/interface";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import SectionSkeleton from "./SectionSkeletion";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import Spinner from "@/components/Spinner";

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
  const [page, setPage] = useState(1);
  const [allMemories, setAllMemories] = useState<IMemory[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Fetch memories data
  const { data, isLoading } = useSWR(
    `${endpoint.memories}?page=${page}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
  );

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  // Use the new hook pattern: create a ref and pass it to the hook
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

  // Update allMemories when new data arrives
  useEffect(() => {
    if (data?.data?.docs) {
      // Otherwise, append the new data for pagination.
      if (page === 1) {
        setAllMemories(data.data.docs);
      } else {
        setAllMemories(prev => [...prev, ...data.data.docs]);
      }

      // Check if there are more pages - be more explicit about this
      const hasNextPage = data.data.hasNextPage !== false && data.data.docs.length > 0;
      setHasMore(hasNextPage);
    }
  }, [data, page]);

  // Reset pagination when search changes
  // useEffect(() => {
  //   setPage(1);
  //   setAllMemories([]);
  //   setHasMore(true);
  // }, [searchQuery]);
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-6 sm:py-12 flex flex-col gap-3 sm:gap-10">
          <h2 className="text-2xl sm:text-[40px] sm:leading-[48px] font-normal font-canela text-sand-12">
            Recent conversations
          </h2>
          <div className="bg-white flex items-center gap-2 border border-gray-200 rounded-lg p-3.5">
            <SearchIcon />
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
            </> : groupedMemories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? "No conversations found matching your search." : "No conversations yet."}
                </p>
              </div>
            ) : (
              <>
                {groupedMemories.map((group, index) => (
                  <div key={`${group.label}-${index}`} className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-col min-w-30 shrink-0">
                      <span className="font-bold text-sm font-inter text-gray-800">{group.label}</span>
                      <span className="text-gray-500 text-sm font-inter font-normal">{group.date}</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-4">
                      {group.memories.map((memory, i) => (
                        <TopicBar
                          key={i}
                          size="lg"
                          _id={memory._id}
                          title={memory.title || "Untitled Conversation"}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {/* Loading indicator for pagination */}
                {isLoading && page > 1 && (
                  <div className="flex justify-center py-4">
                    <Spinner loading className="size-5 text-black" />
                  </div>
                )}
              </>
            )}
        </div>
        {/* The sentinel element for infinite scroll */}
        <div ref={loadMoreRef} className="w-full h-10" />
      </div>
    </div>
  );
}
