"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import endpoint from "@/api/endpoint";
import CategoryPromptCard from "./category-prompt-card";
import Spinner from "@/components/spinner";
import { Link } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import { useStore } from "@/hooks/use-store";
import { TypographyMuted } from "@/components/ui/typography";
import type {
  ExploreCategory,
  ExploreQuestion,
  ExploreQuestionStatus,
} from "@/features/explore/explore-types";
import { setExploreQuestionFeedback } from "@/features/explore/explore-api";
import { toast } from "sonner";
import ExploreCategoryImage from "@/features/explore/explore-category-image";

interface CategoryDetailsProps {
  category: ExploreCategory;
}

export default function CategoryDetails({ category }: CategoryDetailsProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(
    null,
  );
  const { setHeaderTitle } = useStore();

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: { data?: { docs?: unknown[] } } | null,
    ) => {
      if (!category?.slug) return null;
      if (previousPageData && !previousPageData.data?.docs?.length) return null;

      const params = new URLSearchParams();
      params.append("page", String(pageIndex + 1));

      if (activeTab === "answered") {
        params.append("answered", "true");
      }

      return `${endpoint.promptCategories}${category.slug}?${params.toString()}`;
    },
    [activeTab, category?.slug],
  );

  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey,
    paginatedResponseFetcher<ExploreQuestion>,
    {
      revalidateOnFocus: false,
    },
  );

  const prompts = data ? data.flatMap((page) => page.data.docs) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
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
    async (
      promptId: string,
      status: Extract<ExploreQuestionStatus, "skipped" | "not-relevant">,
    ) => {
      setPendingFeedbackId(promptId);
      try {
        await setExploreQuestionFeedback(promptId, { status });
        await mutate();
        toast.success(
          status === "skipped"
            ? "Question skipped"
            : "We’ll avoid questions like this",
        );
      } catch {
        toast.error("We couldn’t save that preference. Please try again.");
      } finally {
        setPendingFeedbackId(null);
      }
    },
    [mutate],
  );

  useEffect(() => {
    setHeaderTitle("Explore topics");
    return () => {
      setHeaderTitle(null);
    };
  }, [setHeaderTitle]);

  return (
    <div className="page-viewport hide-scrollbar px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-10 py-6 sm:gap-16 sm:py-12">
        <div className="flex flex-col gap-6">
          <Button
            asChild
            variant="ghost"
            className="h-9 w-fit gap-1 rounded-lg px-2.5 font-geist text-sm font-medium"
          >
            <Link to="/explore">
              <Undo2 aria-hidden="true" />
              Back
            </Link>
          </Button>
          <header className="flex w-full flex-col gap-6 rounded-[32px] border border-stroke-neutral-weak bg-fill-neutral-weak px-6 py-5 md:flex-row">
            <div className="aspect-[336/266] w-full shrink-0 overflow-hidden rounded-[20px] md:w-[40%] md:max-w-[336px]">
              <ExploreCategoryImage
                slug={category.slug}
                alt=""
                sizes="(min-width: 768px) 336px, calc(100vw - 80px)"
                loading="eager"
                className="size-full object-cover object-center"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-6">
              <div className="flex flex-col gap-4">
                <h1 className="font-garamond text-[32px] font-medium leading-tight text-text-neutral-strong sm:text-[40px] sm:leading-[48px]">
                  {category.title}
                </h1>
                <p className="font-garamond text-2xl font-normal leading-tight text-text-neutral-strong sm:text-[30px] sm:leading-[34px]">
                  {category.description}
                </p>
              </div>
              <Badge
                variant="outline"
                className="h-auto gap-1.5 rounded-full border-stroke-neutral-strong bg-transparent px-2 py-1 font-geist text-base font-medium text-text-neutral-strong"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full bg-fill-info-strong"
                />
                {totalDocs} {totalDocs === 1 ? "topic" : "topics"}
              </Badge>
            </div>
          </header>
        </div>
        <section aria-label="Category topics" className="flex flex-col gap-6">
          <ToggleGroup
            type="single"
            value={activeTab}
            spacing={3}
            aria-label="Filter topics"
            onValueChange={(value) => {
              if (!value) return;
              setActiveTab(value);
              setSize(1);
            }}
          >
            {[
              { value: "all", label: "All topics" },
              { value: "answered", label: "Answered" },
            ].map((tab) => (
              <ToggleGroupItem
                key={tab.value}
                value={tab.value}
                className="h-10 rounded-lg bg-fill-neutral-weak px-4 font-geist text-sm font-medium text-text-neutral-weak data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                {tab.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {isEmptyData ? (
            <TypographyMuted className="py-8 text-center text-text-neutral-weak">
              {activeTab === "answered"
                ? "You haven’t answered any topics in this category yet."
                : "No prompts available for this category."}
            </TypographyMuted>
          ) : (
            <div className="flex flex-col gap-6">
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
            {isLoadingMore && (
              <Spinner loading className="!size-16 text-text-brand-strong" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
