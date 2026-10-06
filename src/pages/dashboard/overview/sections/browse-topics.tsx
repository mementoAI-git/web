import { useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import CategoryCard from "@/components/category-card";
import { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";
import relationships from "@/assets/image/overview/topic-relationships.webp";
import love from "@/assets/image/overview/topic-love.webp";
import childhood from "@/assets/image/overview/topic-childhood.webp";
import changes from "@/assets/image/overview/topic-changes.webp";
import { TypographyH2 } from "@/components/ui/typography";

const TOPIC_LIMIT = 7;

const topicArtwork: Record<string, string> = {
  relationships,
  relationship: relationships,
  family: relationships,
  love,
  "people-i-love": love,
  childhood,
  "growing-up": childhood,
  changes,
  "life-transition": changes,
  "what-life-taught-me": changes,
};

export default function BrowseTopics() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);
  const [order, setOrder] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topics = data?.data ?? [];
  const indices =
    order.length === topics.length ? order : topics.map((_, index) => index);
  const visibleTopics = indices
    .slice(0, TOPIC_LIMIT)
    .map((index) => topics[index]);

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
    <div className="flex w-full min-w-0 flex-col gap-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <TypographyH2 className="min-w-0 font-garamond font-medium tracking-normal text-xl leading-tight text-text-neutral-strong sm:text-2xl sm:leading-[38px] lg:text-[32px]">
          Explore more <i className="text-text-neutral-weak">topics</i>
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
      <div className="relative w-full">
        <div className="relative w-full">
          {/* Bleed horizontal scroll to screen edges on small viewports; snap for predictable swipes */}
          <div
            ref={scrollRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 scroll-pr-4 hide-scrollbar sm:mx-0 sm:scroll-pl-0 sm:scroll-pr-0 sm:gap-6"
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
              visibleTopics.map((t) => {
                const category = getCategory(t?.category);
                const artwork = topicArtwork[t?.category];
                return (
                  <div
                    className="flex w-[min(230px,calc(100vw-3rem))] shrink-0 snap-start flex-col sm:w-[230px]"
                    key={t._id}
                  >
                    <CategoryCard
                      subtitle={t?.title}
                      href={`/chat/reply/${t?._id}`}
                      image={artwork ?? category?.image}
                      imageCategory={artwork ? undefined : t?.category}
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
