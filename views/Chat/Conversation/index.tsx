"use client";

import Chatinput from "@/components/Chatinput";
import { Typing, TypingBubble } from "./Bubble";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import History from "./History";
import { IMessage } from "@/utility/interface";
import Loader from "./Loader";
import useSWRMutation from "swr/mutation";
import { streamlineFetcher } from "@/api/fetcher";
import { toast } from "sonner";
import SidebarDetails from "./SidebarDetails";

export default function Conversation({ id }) {
  const [aiMessage, setAiMessage] = useState("")
  const abortCtrl = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true);

  const [messages, setMessages] = useState<Partial<IMessage | any>[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar closed by default

  const { trigger: sendMessage, isMutating: isTyping } = useSWRMutation(endpoint.aiPrompt, streamlineFetcher)
  const { data: memoryData, isLoading: loadingMemory, error: memoryError } = useSWR(
    id ? `${endpoint.memories}/${id}` : null
  );

  const { data: promptData, isLoading: loadingPrompt } = useSWR(
    id && (memoryError || isEmpty(memoryData?.data)) ?
      `${endpoint.replyPrompt}/${id}` :
      null
  );

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Close sidebar handler
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Open sidebar handler 
  const handleOpenSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const handleChuckArrival = useCallback((chunk: string) => {
    if (chunk.trim().startsWith("ERROR: ")) {
      setAiMessage("");
      return toast.error("Something went wrong, try again")
    }

    if (typeof chunk === 'string' && chunk.trim() !== '') {
      setAiMessage((prev) => {
        // This ensures the message updates with each chunk.
        const newText = prev + chunk;
        return newText;
      });

      scrollToBottom();

    }
  }, [scrollToBottom]);

  const handleSend = async ({ text }) => {
    if (isEmpty(text)) return;

    try {
      // If there's an ongoing AI response, finalize it first
      if (aiMessage && aiMessage.trim()) {
        setMessages((p) => ([...p, { text: aiMessage, role: "ai" }]));
        setAiMessage("");
      }

      // Then add the new user message
      setMessages((p) => ([...p, { text, role: "user" }]));

      // Always scroll to bottom when the user sends a message
      setTimeout(scrollToBottom, 50);

      abortCtrl.current = new AbortController();

      await sendMessage({
        text,
        memory: id,
        signal: abortCtrl.current.signal,
        onChunk: handleChuckArrival
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to send message");
        setAiMessage("");
      }
    } finally {
      abortCtrl.current = null
    }
  }

  const handleStop = () => {
    if (abortCtrl.current) {
      abortCtrl.current.abort();
      abortCtrl.current = null
    }
    if (aiMessage) {
      setAiMessage((prev) => prev + "...");
    }
  };

  const handleOnFinishTyping = (text: string) => {
    if (text && text.trim()) {
      setMessages((p) => ([...p, { text, role: "ai" }]));
    }
    setAiMessage("");
  }

  const memory = useMemo(() => memoryData?.data || promptData?.data, [promptData, memoryData])

  // Update wasAtBottomRef on scroll to manage conditional scrolling
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      wasAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 50; // A 50px buffer
    }
  }, []);

  // Use a single useEffect to handle the initial load and all message updates
  useEffect(() => {
    if (messages.length > 0) {
      if (wasAtBottomRef.current) {
        // Use a small delay to ensure DOM is updated before scrolling
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages, scrollToBottom]);

  if (loadingMemory || loadingPrompt) {
    return <Loader />
  }

  return (
    <div className="flex flex-1 overflow-hidden items-stretch h-full">
      <div className="page-viewport hide-scrollbar h-full" ref={scrollContainerRef} onScroll={handleScroll}>
        <History {...{
          memory,
          messages,
          setMessages,
          scrollContainerRef,
          onViewDetails: handleOpenSidebar
        }}>
          {
            isTyping && !aiMessage ?
              <Typing /> :
              aiMessage &&
              <TypingBubble
                text={aiMessage}
                onFinish={handleOnFinishTyping}
              />
          }
        </History>
        <div className="sticky bottom-0 pb-4 bg-background">
          <div className="container">
            <Chatinput onStop={handleStop} onSend={handleSend} />
          </div>
        </div>
      </div>
      {/* Updated sidebar with slide-in transition */}
      <div
        className={`h-full border-l border-[#EAECF0] transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-60' : 'w-0'
          }`}
      >
        <SidebarDetails {...{ memory, onClose: handleCloseSidebar }} />
      </div>
    </div>
  );
}
