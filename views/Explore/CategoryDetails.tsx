"use client";

import React, { useRef, useEffect, useState } from "react";
import endpoint from "@/api/endpoint";
import CategoryPromptCard from "@/views/Explore/CategoryPromptCard";
import Spinner from "@/components/Spinner";
import { cn, isEmpty } from "@/utility";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/api/fetcher";
import useIntersectionObserver from "@/hooks/use-intersection-observer";

export default function CategoryDetail({ category }) {
  const [activeTab, setActiveTab] = useState(0); // 0: Uploaded, 1: Answered, 2: Unanswered

  const getKey = (pageIndex: number, previousPageData) => {
    // Return null to not fetch for the initial page or if the previous page had no more data.
    if (previousPageData && !previousPageData.data.docs.length) return null;

    const params = new URLSearchParams();
    params.append('page', (pageIndex + 1).toString());

    // Add answered filter based on active tab
    if (activeTab === 1) { // Answered
      params.append('answered', 'true');
    } else if (activeTab === 2) { // Unanswered
      params.append('answered', 'false');
    }

    return `${endpoint.promptCategories}${category?.slug}?${params.toString()}`;
  };

  const { data, size, setSize, isLoading } = useSWRInfinite(
    !isEmpty(category?.slug) ? getKey : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const prompts = data ? data.flatMap(page => page.data.docs) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmptyData = prompts.length === 0 && !isLoading;
  const hasMore = data?.[data.length - 1]?.data?.hasNextPage || false;

  const loadMoreRef = useRef(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  // Trigger loading the next page when the sentinel element is visible
  useEffect(() => {
    if (isIntersecting && !isLoadingMore && hasMore) {
      setSize(size + 1);
    }
  }, [isIntersecting, isLoadingMore, hasMore, setSize, size]);

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const totalDocs = data?.[0]?.data?.totalDocs || 0;

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-3 sm:py-12 space-y-6">
          <div className="w-full min-h-[253px] gap-6 rounded-xl bg-sand-2 flex flex-col md:flex-row border border-sand-3 p-4">
            <div className="overflow-hidden border border-[#EAECF0] max-h-[221px] w-full md:max-w-[346px] rounded-[10px]">
              <img src={category?.image} className="size-full object-cover" alt="Career and ambition" />
            </div>
            <div className="flex-1 flex flex-col gap-3 sm:gap-6">
              <h5 className="font-canela text-2xl sm:text-[32px] leading-[38px] text-sand-12">{category?.title}</h5>
              <p className="text-sand-11 sm:text-xl font-georgia font-normal">
                {category?.subtitle}
              </p>
              <div className="flex gap-3">
                <button className="rounded-full cursor-pointer hover:scale-[97%] gap-[6px] flex items-center text-xs sm:text-sm border-[1.5px] text-sand-10 border-sand-10 px-3 py-1">
                  <div className="rounded-full size-[6px] bg-sand-10" />
                  {totalDocs} topics
                </button>
                <button></button>
              </div>
            </div>
          </div>
        </div>
        <div className="py-2 sm:py-12">
          <div className="space-y-6">
            <div className="w-full overflow-x-auto hide-scrollbar gap-2 sm:gap-6 flex items-center">
              {
                ["Uploaded", "Answered", "Unanswered"].map((tab, i) => (
                  <div
                    key={i}
                    className={cn("p-4 cursor-pointer text-gray-500 hover:text-blue-6 hover:font-bold font-inter font-normal transition-all duration-200 ease-in-out", {
                      "font-bold text-blue-6 border-b-2": activeTab === i
                    })}
                    onClick={() => handleTabChange(i)}
                  >
                    <span>{tab}</span>
                  </div>
                ))
              }
            </div>
            {
              isEmptyData ?
                <div className="text-center py-8 text-gray-500">
                  No prompts available for this category.
                </div> :
                <div className="space-y-6">
                  {prompts.map((prompt, i) => (
                    <CategoryPromptCard key={i} {...prompt} />
                  ))}
                </div>
            }
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore && <Spinner loading className="!size-16 text-blue-6" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}