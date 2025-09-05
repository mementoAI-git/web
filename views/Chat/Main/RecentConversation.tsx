import Link from "next/link";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import TopicBar, { TopicBarSkeleton } from "@/components/Topic/TopicBar";

export default function RecentConversations() {
  const { data, isLoading } = useSWR(`${endpoint.memories}?page=1`)

  return (
    <div className="container w-full space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-canela font-medium text-xl md:text-2xl text-sand-12">Recent Conversations</h4>
        <Link href="/chat/conversations" className="text-blue-6 underline font-semibold font-inter text-lg cursor-pointer">
          See more
        </Link>
      </div>

      {
        isLoading ?
          <>
            <TopicBarSkeleton />
            <TopicBarSkeleton />
            <TopicBarSkeleton />
          </> :
          data?.data?.docs
            ?.slice(0, 3)
            ?.map((m, i) => <TopicBar key={i} {...m} />)
      }
    </div>
  )
}