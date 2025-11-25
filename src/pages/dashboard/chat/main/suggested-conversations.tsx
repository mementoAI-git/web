import endpoint from "@/api/endpoint";
import Topic, { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";
import { Link } from "react-router-dom";
import useSWR from "swr";

export default function SuggestedCategories() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="container flex items-center justify-between w-full">
        <h4 className="font-garamond font-medium text-xl md:text-[32px] md:leading-[38px] text-sand-12">Suggested Conversations</h4>
        <Link to="/chat/conversations/suggested" className="text-blue-6 underline font-semibold font-inter text-sm sm:text-base md:text-lg cursor-pointer">
          See more
        </Link>
      </div>
      <div className="relative w-full">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar py-4 lg:pl-29">
          {isLoading ?
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
                  <Topic
                    id={t?._id}
                    title={t?.title}
                    key={i}
                    image={category?.image}
                    tag={category?.slug || t?.tag?.[0] || 'Question'}
                  />
                )
              })
          }
        </div>
        <div className="absolute hidden md:block left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute hidden md:block  right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}