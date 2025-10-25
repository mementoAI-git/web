import Link from "next/link"
import useSWR from "swr"
import endpoint from "@/api/endpoint"
import { fetcher } from "@/api/fetcher"
import Topic, { TopicSkeleton } from "@/components/Topic"
import { getCategory } from "@/utility"

export default function BrowseTopics() {
  const { data, isLoading, error } = useSWR(
    `${endpoint.suggestions}?page=1&limit=10`,
    fetcher,
  )

  console.log('Topics data:', data);
  console.log('Topics loading:', isLoading);
  console.log('Topics error:', error);

  return (
    <div className="w-full space-y-6 py-6 sm:py-9 lg:py-12">
      <div className="flex items-center justify-between">
        <h2 className="font-canela text-sand-12 font-normal text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
          Browse conversations-
          <i className="text-gray-500"> by topics</i>
        </h2>
        <Link className="text-blue-6 font-semibold text-lg underline" href="/explore">See all</Link>
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
                data?.data?.docs
                  .map((t, i) => {
                    const category = getCategory(t?.category)
                    return (
                      <Topic
                        id={t?._id}
                        title={t?.title}
                        key={i}
                        image={category?.image}
                        tag={category?.slug || t.tag[0]}
                      />
                    )
                  })
            }
          </div>

          <div className="absolute hidden md:block  right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  )
}