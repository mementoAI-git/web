"use client";

import ChatIcon from "@/public/icon/chat.svg";
import GearIcon from "@/public/icon/gear.svg";
import { cn } from "@/utility";
import Link from "next/link";
import Chatinput from "@/components/Chatinput";
import RecentConversations from "./RecentConversation";
import SuggestedCategories from "./SuggestedConversations";

export default function Chat() {
  return (
    <div className="flex h-screen flex-col">
      <div className="w-full px-2 py-3">
        <div className="w-full px-2 mx-auto max-w-[1038px] flex items-center justify-between">
          <Link href="/chat/conversations" className="bg-sand-2 p-3 rounded-xl flex items-center gap-2">
            <div className="size-5 flex items-center justify-center text-sand-8"><ChatIcon /></div>
            <span className="text-sand-10 text-sm font-inter">Recent Conversations</span>
          </Link>
          <div className={cn("icon-container", "!rounded-xl")}>
            <GearIcon className="size-5" />
          </div>
        </div>
      </div>
      <div className="flex overflow-y-auto page-viewport flex-1 hide-scrollbar">
        <div className="space-y-10 md:space-y-16 w-full pb-8">
          <div className="container space-y-10 md:space-y-16 py-6 md:py-12">
            <h4 className="hidden md:block text-center font-canela text-[32px] leading-[38px] text-sand-12">
              Hey Groot, What’s on your mind today?
            </h4>
            <h4 className="md:hidden font-medium font-canela text-2xl text-sand-12">
              Hey <span className="italic font-light gray-500">Groot</span>, <br />
              What’s on your mind today?
            </h4>
            <Chatinput
              inputClassName="min-h-10 md:min-h-25"
              className="max-w-[760px]"
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