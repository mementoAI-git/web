import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import CategoryCard from "@/components/category-card";
import { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";

interface Suggestion {
  _id: string;
  title: string;
  category: string;
}

export default function BrowseTopics() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);

  return (
    <div className="w-full space-y-6 py-6 sm:py-9 lg:py-12">
      <div className="flex items-center justify-between">
        <h2 className="font-garamond font-medium text-sand-12 text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
          Browse conversations
          <i className="text-gray-500"> by topics</i>
        </h2>
        <Link className="text-blue-6 font-semibold text-lg underline" to="/explore">See all</Link>
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
                      <div className="w-full max-w-[240px] flex shrink-0" key={i}>
                        <CategoryCard
                          subtitle={t?.title}
                          href={`/chat/reply/${t?._id}`}
                          image={category?.image}
                          className="w-full max-w-[240px]"
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

