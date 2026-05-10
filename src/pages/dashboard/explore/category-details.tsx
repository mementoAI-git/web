"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import endpoint from "@/api/endpoint";
import CategoryPromptCard from "./category-prompt-card";
import Spinner from "@/components/spinner";
import { cn, isEmpty } from "@/utility";
import { fetcher } from "@/api/fetcher";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import { useStore } from "@/hooks/use-store";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";

interface CategoryDetailsProps {
  category: {
    slug: string;
    image: string;
    title: string;
    subtitle: string;
  } | null;
}

export default function CategoryDetails({ category }: CategoryDetailsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { setHeaderTitle } = useStore();

  const getKey = useCallback(
    (pageIndex: number, previousPageData: { data?: { docs?: unknown[] } } | null) => {
      if (!category?.slug) return null;
      if (previousPageData && !previousPageData.data?.docs?.length) return null;

      const params = new URLSearchParams();
      params.append("page", String(pageIndex + 1));

      if (activeTab === 1) {
        params.append("answered", "true");
      } else if (activeTab === 2) {
        params.append("answered", "false");
      }

      return `${endpoint.promptCategories}${category.slug}?${params.toString()}`;
    },
    [activeTab, category?.slug],
  );

  const { data, size, setSize, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const prompts = data ? data.flatMap((page) => page.data.docs) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmptyData = prompts.length === 0 && !isLoading;
  const hasMore = data?.[data.length - 1]?.data?.hasNextPage || false;

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  useEffect(() => {
    if (isIntersecting && !isLoadingMore && hasMore) {
      setSize(size + 1);
    }
  }, [hasMore, isIntersecting, isLoadingMore, setSize, size]);

  const totalDocs = data?.[0]?.data?.totalDocs || 0;

  useEffect(() => {
    setHeaderTitle(category.title);
    return () => {
      setHeaderTitle(null);
    }
  }, [category.title]);

  if (!category || isEmpty(category)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        Category not found.
      </div>
    );
  }

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="space-y-6 py-3 sm:py-12">
          <div className="flex min-h-[253px] w-full flex-col gap-6 rounded-xl border border-sand-3 bg-sand-2 p-4 md:flex-row">
            <div className="max-h-[221px] w-full overflow-hidden rounded-[10px] border border-v3-stroke-weak md:max-w-[346px]">
              <img src={category.image} className="size-full object-cover" alt={category.title} />
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:gap-6">
              <TypographyH2 className="font-garamond text-2xl leading-[38px] text-sand-12 sm:text-[32px]">{category.title}</TypographyH2>
              <TypographyMuted className="font-georgia text-sand-11 sm:text-xl">{category.subtitle}</TypographyMuted>
              <div className="flex gap-3">
                <span className="flex items-center gap-[6px] rounded-full border-[1.5px] border-sand-10 px-3 py-1 text-xs text-sand-10">
                  <span className="size-[6px] rounded-full bg-sand-10" />
                  {totalDocs} topics
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="py-2 sm:py-12">
          <div className="space-y-6">
            <div className="flex w-full items-center gap-2 overflow-x-auto hide-scrollbar sm:gap-6">
              {["Uploaded", "Answered", "Unanswered"].map((tab, index) => (
                <button
                  type="button"
                  key={tab}
                  className={cn(
                    "p-4 font-inter font-normal text-gray-500 transition-all duration-200 ease-in-out hover:text-blue-6",
                    index === activeTab && "border-b-2 font-bold text-blue-6",
                  )}
                  onClick={() => {
                    setActiveTab(index);
                    setSize(1);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            {isEmptyData ? (
              <TypographyMuted className="py-8 text-center text-gray-500">No prompts available for this category.</TypographyMuted>
            ) : (
              <div className="space-y-6">
                {(prompts as React.ComponentProps<typeof CategoryPromptCard>[]).map((prompt, index: number) => (
                  <CategoryPromptCard key={prompt._id ?? index} {...prompt} />
                ))}
              </div>
            )}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore && <Spinner loading className="!size-16 text-blue-6" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
