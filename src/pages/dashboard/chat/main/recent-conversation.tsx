import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import ConversationBar, { ConversationBarSkeleton } from "@/components/conversation-bar";
import { isEmpty } from "@/utility";

export default function RecentConversations() {
  const { data, isLoading } = useSWR(`${endpoint.conversations}?page=1`);

  if (!isLoading && isEmpty(data?.data?.docs)) return null;
  return (
    <div className="container w-full space-y-3 md:space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-garamond font-medium text-xl md:text-[32px] md:leading-[38px] text-sand-12">Recent Conversations</h4>
        <Link to="/chat/conversations" className="cursor-pointer text-sm font-inter font-semibold text-blue-6 sm:text-base md:text-lg md:underline">
          See more
        </Link>
      </div>

      {isLoading ? (
        <>
          <ConversationBarSkeleton />
          <ConversationBarSkeleton />
          <ConversationBarSkeleton />
        </>
      ) : (
        data?.data?.docs?.slice(0, 3)?.map((conversation: any, index: number) => (
          <ConversationBar key={conversation._id ?? index} {...conversation} />
        ))
      )}
    </div>
  );
}