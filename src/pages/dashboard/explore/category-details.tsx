"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import endpoint from "@/api/endpoint";
import CategoryPromptCard from "./category-prompt-card";
import Spinner from "@/components/spinner";
import { cn } from "@/utility";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import { useStore } from "@/hooks/use-store";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";
import type { ExploreCategory, ExploreQuestion, ExploreQuestionStatus } from "@/features/explore/explore-types";
import { setExploreQuestionFeedback } from "@/features/explore/explore-api";
import { toast } from "sonner";
import ExploreCategoryImage from "@/features/explore/explore-category-image";

interface CategoryDetailsProps {
  category: ExploreCategory;
}

export default function CategoryDetails({ category }: CategoryDetailsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(null);
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

  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(getKey, paginatedResponseFetcher<ExploreQuestion>, {
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

  const handleFeedback = useCallback(
    async (promptId: string, status: Extract<ExploreQuestionStatus, "skipped" | "not-relevant">) => {
      setPendingFeedbackId(promptId);
      try {
        await setExploreQuestionFeedback(promptId, { status });
        await mutate();
        toast.success(status === "skipped" ? "Question skipped" : "We’ll avoid questions like this");
      } catch {
        toast.error("We couldn’t save that preference. Please try again.");
      } finally {
        setPendingFeedbackId(null);
      }
    },
    [mutate],
  );

  useEffect(() => {
    setHeaderTitle(category.title);
    return () => {
      setHeaderTitle(null);
    }
  }, [category.title, setHeaderTitle]);

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="space-y-6 py-3 sm:py-12">
          <div className="flex min-h-[253px] w-full flex-col gap-6 rounded-xl border border-stroke-neutral-weak bg-bg-neutral-weak p-4 md:flex-row">
            <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[10px] border border-stroke-neutral-weak md:aspect-[346/221] md:max-w-[346px]">
              <ExploreCategoryImage
                slug={category.slug}
                alt=""
                sizes="(min-width: 768px) 346px, calc(100vw - 64px)"
                loading="eager"
                className="size-full object-cover object-center"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:gap-6">
              <TypographyH2 className="font-garamond text-2xl leading-[38px] text-text-neutral-strong sm:text-[32px]">{category.title}</TypographyH2>
              <TypographyMuted className="font-georgia text-text-neutral-weak sm:text-xl">{category.description}</TypographyMuted>
              <div className="flex gap-3">
                <span className="flex items-center gap-[6px] rounded-full border border-stroke-neutral-strong px-3 py-1 text-xs text-text-neutral-weak">
                  <span className="size-[6px] rounded-full bg-fill-neutral-strong" />
                  {totalDocs} topics
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="py-2 sm:py-12">
          <div className="space-y-6">
            <div className="flex w-full items-center gap-2 overflow-x-auto hide-scrollbar sm:gap-6">
              {["All", "Answered", "Unanswered"].map((tab, index) => (
                <button
                  type="button"
                  key={tab}
                  className={cn(
                    "min-h-11 p-4 font-inter font-normal text-text-neutral-weak transition-colors hover:text-text-brand-strong",
                    index === activeTab && "border-b-2 border-stroke-brand-strong font-bold text-text-brand-strong",
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
              <TypographyMuted className="py-8 text-center text-text-neutral-weak">No prompts available for this category.</TypographyMuted>
            ) : (
              <div className="space-y-6">
                {prompts.map((prompt, index: number) => (
                  <CategoryPromptCard
                    key={prompt._id ?? index}
                    _id={prompt._id ?? String(index)}
                    title={prompt.title}
                    source={prompt.source}
                    isFeedbackPending={pendingFeedbackId === prompt._id}
                    onFeedback={handleFeedback}
                  />
                ))}
              </div>
            )}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore && <Spinner loading className="!size-16 text-text-brand-strong" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
