import endpoint from "@/api/endpoint";
import Topic, { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";
import { Link } from "react-router-dom";
import useSWR from "swr";

export default function SuggestedCategories() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);

  return (
    <div className="w-full max-w-[560px] space-y-3 md:space-y-6">
      <div className="container flex items-center justify-between w-full">
        <h4 className="font-inter font-semibold text-xl md:text-base md:leading-[24px] text-text-neutral-strong">Suggested Conversations</h4>
        <Link to="/chat/conversations/suggested" className="text-text-brand-strong underline font-semibold font-inter text-sm cursor-pointer">
          See more
        </Link>
      </div>
      <div className="relative w-full">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-4 lg:pl-[80px]">
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
        <div className="absolute hidden md:block right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}