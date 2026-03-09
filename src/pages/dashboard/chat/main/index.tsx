"use client";

import Chatinput, { type IOnSendPayload } from "@/components/Chatinput";
import RecentConversations from "./recent-conversation";
import SuggestedCategories from "./suggested-conversations";
import { useNavigate } from "react-router-dom";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";

export default function ChatLandingPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const { trigger: startConversation, isMutating: startingConversation } = useFetcher(endpoint.startConversation);

  const handleSend = async ({ text, attachments = [] }: IOnSendPayload) => {
    if (!text.trim()) return;
    try {
      const result = await startConversation({ text, attachments });
      const { memory_id } = result?.data ?? {};
      if (memory_id) {
        navigate(`/chat/${memory_id}`, { replace: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex overflow-y-auto page-viewport flex-1 hide-scrollbar">
        <div className="space-y-10 md:space-y-16 w-full pb-8">
          <div className="container max-w-full w-full space-y-10 md:space-y-16 py-3 sm:py-6 md:py-12">
            <h4 className="hidden md:block text-center font-medium font-garamond text-[30px] sm:text-[40px] leading-[34px] sm:leading-[48px] text-sand-12">
              {user?.first_name && `Hey ${user?.first_name},`} What’s on your mind today?
            </h4>
            <h4 className="md:hidden font-medium font-garamond text-[40px] leading-[48px] text-sand-12">
              Hey <span className="italic font-light gray-500">{user?.nickname || user?.first_name || user?.last_name || "User"}</span>, <br />
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
  );
}