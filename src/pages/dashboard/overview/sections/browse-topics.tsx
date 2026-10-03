import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import CategoryCard from "@/components/category-card";
import { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";
import { TypographyH2 } from "@/components/ui/typography";

export default function BrowseTopics() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 py-0 pb-12 sm:gap-6 sm:pb-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <TypographyH2 className="min-w-0 font-garamond font-normal text-xl leading-tight text-text-neutral-strong sm:text-2xl sm:leading-[38px] lg:text-[32px]">
          Browse conversations
          <i className="text-text-neutral-weaker"> by topics</i>
        </TypographyH2>
        <Link
          className="inline-flex min-h-[44px] shrink-0 items-center font-inter text-base font-semibold text-text-brand-strong underline hover:opacity-90 sm:min-h-0"
          to="/explore"
        >
          See all
        </Link>
      </div>
      <div className="relative w-full">
        <div className="relative w-full">
          {/* Bleed horizontal scroll to screen edges on small viewports; snap for predictable swipes */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 scroll-pr-4 py-1 hide-scrollbar sm:mx-0 sm:scroll-pl-0 sm:scroll-pr-0 sm:gap-6 sm:py-2 md:py-4">
            {
              isLoading ?
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      className="flex w-[min(238px,calc(100vw-3rem))] shrink-0 snap-start flex-col sm:w-[238px]"
                      key={`sk-${i}`}
                    >
                      <TopicSkeleton />
                    </div>
                  ))}
                </> :
                data?.data
                  ?.map((t, i) => {
                    const category = getCategory(t?.category)
                    return (
                      <div
                        className="flex w-[min(238px,calc(100vw-3rem))] shrink-0 snap-start flex-col sm:w-[238px]"
                        key={i}
                      >
                        <CategoryCard
                          subtitle={t?.title}
                          href={`/chat/reply/${t?._id}`}
                          image={category?.image}
                          imageCategory={t?.category}
                          imageLoading="lazy"
                          imageSizes="238px"
                          category={t?.category_title ?? t?.category}
                          className="w-full max-w-[238px]"
                        />
                      </div>
                    )
                  })
            }
          </div>

        </div>
      </div>
    </div>
  );
}
