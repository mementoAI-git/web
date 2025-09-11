import endpoint from "@/api/endpoint";
import Topic, { TopicSkeleton } from "@/components/Topic";
import Link from "next/link";
import useSWR from "swr";

export default function SuggestedCategories() {
  const { data, isLoading } = useSWR(endpoint.suggestions)

  return (
    <div className="space-y-6">
      <div className="container flex items-center justify-between w-full">
        <h4 className="font-canela font-medium text-xl md:text-2xl text-sand-12">Suggested Conversations</h4>
        <Link href="/chat/conversations/suggested" className="text-blue-6 underline font-semibold font-inter text-lg cursor-pointer">
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
            data?.data?.docs?.map((t, i) => <Topic id={t?._id} title={t?.title} key={i} tag="Question" />)
          }
        </div>
        <div className="absolute hidden md:block left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute hidden md:block  right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  )
}