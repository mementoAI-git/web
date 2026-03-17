"use client";

import Chatinput, { type IOnSendPayload } from "@/components/Chatinput";
import useFetcher from "@/hooks/use-fetcher";
import { useTimeBasedGreeting } from "@/hooks/use-time-based-greeting";
import { useStore } from "@/hooks/use-store";
import endpoint from "@/api/endpoint";
import { useNavigate } from "react-router-dom";
import RecentConversations from "./recent-conversation";
import SuggestedCategories from "./suggested-conversations";

export default function ChatLandingPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const greeting = useTimeBasedGreeting();
  const displayName = user?.nickname || user?.first_name || user?.last_name || "User";
  const greetingText = greeting.replace(/\{name\}/gi, displayName);
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
        <div className="flex flex-col justify-start items-center space-y-10 md:space-y-16 w-full pb-8">
          <div className="container flex flex-col items-center gap-10 md:gap-8 w-full max-w-none mx-0 mb-6 py-3 sm:py-6 md:py-12 text-center">
            <h3 className="hidden md:block text-center font-light font-garamond text-[30px] sm:text-[32px] leading-[34px] sm:leading-[48px] text-gray-900 max-w-[500px] mx-auto">
              {greetingText}
            </h3>
            <h3 className="md:hidden font-medium font-garamond text-[40px] leading-[48px] text-sand-12">
              {greetingText}
            </h3>
            <Chatinput
              className="max-w-[600px] !gap-3 sm:!gap-2"
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