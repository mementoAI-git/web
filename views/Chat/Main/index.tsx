"use client";

import ChatIcon from "@/public/icon/chat.svg";
import GearIcon from "@/public/icon/gear.svg";
import { cn } from "@/utility";
import Link from "next/link";
import Chatinput from "@/components/Chatinput";
import RecentConversations from "./RecentConversation";
import SuggestedCategories from "./SuggestedConversations";
import { useRouter } from "next/navigation";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import ChatSettings from "@/components/ChatSetting";

export default function Chat() {
  const router = useRouter();
  const { user } = useStore()
  const { trigger: startConversation, isMutating: startingConversation } = useFetcher(endpoint.startConversation)

  const handleSend = async ({ text, attachments = [] }) => {
    if (!text.trim()) return;
    try {
      const result = await startConversation({ text, attachments })
      const { memory_id } = result?.data
      router.replace(`/chat/${memory_id}`);
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="w-full px-2 py-3">
        <div className="w-full px-2 mx-auto max-w-[1038px] flex items-center justify-between">
          <Link href="/chat/conversations" className="bg-sand-2 px-3 py-2 sm:p-3 rounded-full sm:rounded-xl flex items-center gap-1 sm:gap-2">
            <div className="size-5 flex items-center justify-center text-sand-8"><ChatIcon /></div>
            <span className="text-sand-10 text-sm font-inter">Recent Conversations</span>
          </Link>
          <ChatSettings>
            <div className={cn("icon-container", "!size-9 md:!size-11 md:!rounded-xl")}>
              <GearIcon className="size-5 stroke-2" />
            </div>
          </ChatSettings>
        </div>
      </div>
      <div className="flex overflow-y-auto page-viewport flex-1 hide-scrollbar">
        <div className="space-y-10 md:space-y-16 w-full pb-8">
          <div className="container space-y-10 md:space-y-16 py-3 sm:py-6 md:py-12">
            <h4 className="hidden md:block text-center font-canela text-[30px] sm:text-[32px] leading-[34px] sm:leading-[38px] text-sand-12">
              {user?.first_name && `Hey ${user?.first_name},`} What’s on your mind today?
            </h4>
            <h4 className="md:hidden font-medium font-canela text-2xl text-sand-12">
              Hey <span className="italic font-light gray-500">Groot</span>, <br />
              What’s on your mind today?
            </h4>
            <Chatinput
              inputClassName="!h-[50px]"
              className="max-w-[760px] !gap-3  sm:!gap-10"
              onSend={handleSend}
              loading={startingConversation}
            />
          </div>

          <RecentConversations />
          <SuggestedCategories />
          <div className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}