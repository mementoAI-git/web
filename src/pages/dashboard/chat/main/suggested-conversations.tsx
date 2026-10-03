import endpoint from "@/api/endpoint";
import Topic, { TopicSkeleton } from "@/components/topic";
import { getCategory } from "@/utility";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { TypographyH2 } from "@/components/ui/typography";

export default function SuggestedCategories() {
  const { data, isLoading } = useSWR(endpoint.overviewPrompt);

  return (
    <div className="w-full max-w-[560px] space-y-3 md:space-y-6">
      <div className="container flex items-center justify-between w-full">
        <TypographyH2 className="font-inter text-xl font-semibold text-text-neutral-strong md:text-base md:leading-[24px]">
          Suggested Conversations
        </TypographyH2>
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
                    tag={t?.category_title || 'Question'}
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
