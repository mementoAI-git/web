import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useTextReveal } from "@/components/motion/use-text-reveal";
import "@/components/motion/text-reveal.css";
import "../overview-motion.css";
import { useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import CategoryCard from "@/components/category-card";
import { TopicSkeleton } from "@/components/topic";
import { TypographyH2 } from "@/components/ui/typography";

const TOPIC_LIMIT = 7;

export default function BrowseTopics() {
  const { data, isLoading, error, mutate } = useSWR(endpoint.overviewPrompt);
  const retry = useRequestRecovery("overview-topics", error, mutate, "Topics couldn’t be loaded. Try again.");
  const [order, setOrder] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topics = data?.data ?? [];
  const indices =
    order.length === topics.length ? order : topics.map((_, index) => index);
  const visibleTopics = indices
    .slice(0, TOPIC_LIMIT)
    .map((index) => topics[index]);

  useTextReveal(scrollRef, isLoading ? "loading" : visibleTopics.map((topic) => topic._id).join(","));

  const shuffleTopics = () => {
    const next = topics.map((_, index) => index);
    for (let index = next.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
    }
    const currentSelection = new Set(indices.slice(0, TOPIC_LIMIT));
    // Bring in another topic when the pool contains more than seven suggestions.
    if (
      next.length > TOPIC_LIMIT &&
      next.slice(0, TOPIC_LIMIT).every((value) => currentSelection.has(value))
    ) {
      [next[TOPIC_LIMIT - 1], next[TOPIC_LIMIT]] = [
        next[TOPIC_LIMIT],
        next[TOPIC_LIMIT - 1],
      ];
    } else if (
      next
        .slice(0, TOPIC_LIMIT)
        .every((value, index) => value === indices[index])
    ) {
      next.push(next.shift()!);
    }
    setOrder(next);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-11">
      <div className="flex items-center justify-between gap-4">
        <TypographyH2 className="min-w-0 font-garamond text-[28px] font-normal leading-tight text-text-neutral-strong sm:text-[32px] lg:text-[32px]">
          Explore more <i className="text-text-neutral-weaker">topics</i>
        </TypographyH2>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Shuffle topics"
            disabled={isLoading || topics.length < 2}
            onClick={shuffleTopics}
            className="rounded-lg text-icon-neutral-strong"
          >
            <Shuffle className="size-6" aria-hidden />
          </Button>
          <Link
            className="inline-flex min-h-[44px] shrink-0 items-center font-inter text-sm font-semibold text-text-neutral-strong hover:opacity-90 sm:min-h-0"
            to="/explore"
          >
            See all
          </Link>
        </div>
      </div>
      {error && <Button variant="outline" onClick={retry}>Retry loading topics</Button>}
      {!error && !isLoading && topics.length === 0 && <p className="text-text-neutral-weak">No topics available right now.</p>}
      <div className="relative w-full">
        <div className="relative w-full">
          {/* Bleed horizontal scroll to screen edges on small viewports; snap for predictable swipes */}
          <div
            ref={scrollRef}
            className="overview-topics-reveal t-stagger -mx-4 flex px-4 snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 scroll-pr-4 hide-scrollbar sm:mx-0 sm:px-0 sm:scroll-pl-0 sm:scroll-pr-0 sm:gap-6"
          >
            {isLoading ? (
              <>
                {Array.from({ length: TOPIC_LIMIT }).map((_, i) => (
                  <div
                    className="flex w-[min(230px,calc(100vw-3rem))] shrink-0 snap-start flex-col sm:w-[230px]"
                    key={`sk-${i}`}
                  >
                    <TopicSkeleton />
                  </div>
                ))}
              </>
            ) : (
              visibleTopics.map((t, index) => {
                return (
                  <div
                    className="t-stagger-line flex w-[min(230px,calc(100vw-3rem))] shrink-0 snap-start flex-col sm:w-[230px]"
                    key={t._id}
                    style={{ transitionDelay: `calc(var(--stagger-stagger) * ${index})` }}
                  >
                    <CategoryCard
                      subtitle={t?.title}
                      href={`/chat/reply/${t?._id}`}
                      imageCategory={t?.category}
                      imageLoading="lazy"
                      imageSizes="230px"
                      variant="overview"
                      category={t?.category_title ?? t?.category}
                      className="w-full max-w-[230px]"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
