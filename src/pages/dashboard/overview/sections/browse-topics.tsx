import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import CategoryCard from "@/components/category-card";
import { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";

export default function BrowseTopics() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 py-0 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h2 className="min-w-0 font-garamond font-normal text-sand-12 text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
          Browse conversations
          <i className="text-[rgba(176,169,156,0.9)]"> by topics</i>
        </h2>
        <Link
          className="shrink-0 font-inter text-base font-semibold text-v3-fill-strong underline hover:opacity-90"
          to="/explore"
        >
          See all
        </Link>
      </div>
      <div className="relative w-full">
        <div className="relative w-full">
          <div className="flex gap-6 overflow-x-auto hide-scrollbar py-4">
            {
              isLoading ?
                <>
                  <TopicSkeleton />
                  <TopicSkeleton />
                  <TopicSkeleton />
                  <TopicSkeleton />
                </> :
                data?.data
                  ?.map((t, i) => {
                    const category = getCategory(t?.category)
                    return (
                      <div className="w-full max-w-[220px] flex flex-col shrink-0" key={i}>
                        <CategoryCard
                          subtitle={t?.title}
                          href={`/chat/reply/${t?._id}`}
                          image={category?.image}
                          className="w-full max-w-[220px]"
                        />
                      </div>
                    )
                  })
            }
          </div>

          <div className="absolute hidden md:block  right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
}

