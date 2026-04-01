import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import ConversationBar, { ConversationBarSkeleton } from "@/components/conversation-bar";
import { isEmpty } from "@/utility";

export default function RecentConversations() {
  const { data, isLoading } = useSWR(`${endpoint.conversations}?page=1`);

  if (!isLoading && isEmpty(data?.data?.docs)) return null;
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-inter font-semibold text-base text-text-neutral-strong">Recent Conversations</h4>
        <Link to="/chat/conversations" className="cursor-pointer text-sm font-inter font-semibold text-text-brand-strong md:underline">
          See more
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <ConversationBarSkeleton variant="compact" />
            <ConversationBarSkeleton variant="compact" />
            <ConversationBarSkeleton variant="compact" />
          </>
        ) : (
          data?.data?.docs?.slice(0, 3)?.map((conversation: any, index: number) => (
            <ConversationBar key={conversation._id ?? index} {...conversation} variant="compact" />
          ))
        )}
      </div>
    </div>
  );
}