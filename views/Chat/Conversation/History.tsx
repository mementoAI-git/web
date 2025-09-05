"use client";

import { Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import Bubble from "./Bubble";
import ConversationHeader from "./Header";
import { IMemory, IMessage } from "@/utility/interface";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/Spinner";
import useIntersectionObserver from "@/hooks/use-intersection-observer";

interface IHistory extends PropsWithChildren {
  setMessages: Dispatch<SetStateAction<Partial<IMessage>[]>>;
  messages: Partial<IMessage>[];
  memory: IMemory;
  scrollContainerRef: any;
}

export default function History({ memory, messages, children, setMessages, scrollContainerRef }: IHistory) {
  const isLoadingMoreRef = useRef(false);
  const containerRef = scrollContainerRef;
  const [next, setNext] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { trigger: getMessages } = useFetcher(`${endpoint.aiPromptMessage}/${memory?._id}?next=${next || ""}`, "get");

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef, {
    root: containerRef.current,
    rootMargin: "20px 0px 0px 0px",
    threshold: 0.5
  });

  const fetchMessage = useCallback(async () => {
    if (isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const { data } = await getMessages();
      if (!data) return;

      const container = containerRef.current;
      const oldScrollHeight = container?.scrollHeight || 0;

      const newMessages = data?.messages || [];
      const hasMoreData = newMessages.length > 0;

      setMessages(prev => [...newMessages, ...prev]);
      setNext(data?.next);

      // Re-adjust scroll position after new messages are loaded
      setTimeout(() => {
        if (container && oldScrollHeight > 0) {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;
          container.scrollTop = container.scrollTop + heightDifference;
        } else {
          // For the initial load, scroll to the bottom
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);

      // Check if the container is not full and there's more data to fetch
      if (container && container.scrollHeight <= container.clientHeight && hasMoreData) {
        fetchMessage(); // Recursively fetch more if the screen isn't full
      }

    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [getMessages, setMessages, containerRef]);

  // This effect now handles both the initial and subsequent infinite scroll fetches
  useEffect(() => {
    // We only fetch if the element is intersecting, there's a 'next' page, and we are not already loading
    if (isIntersecting && next && !isLoadingMoreRef.current) {
      fetchMessage();
    }
    // Also, trigger an initial fetch on component mount, but only once
    if (!messages.length && !isLoadingMoreRef.current) {
      fetchMessage();
    }
  }, [isIntersecting, next, fetchMessage, messages.length]);


  return (
    <div
      className="container flex-1"
      ref={containerRef}
    >
      <div className="py-12 space-y-6">
        <ConversationHeader memory={memory} />
      </div>
      <div className="px-5 space-y-6">
        {isLoadingMore && (
          <div className="py-3 flex justify-center items-center">
            <div className="flex gap-1.5 text-sm text-gray-500">
              <span>Loading more messages...</span>
              <Spinner loading className="!size-3" />
            </div>
          </div>
        )}
        <div ref={loadMoreRef} className="w-full h-1" /> {/* The sentinel element */}
        {messages && messages.map((m, i) => <Bubble key={i} text={m?.text} {...m} />)}
        {children}
        <div className="w-full h-5" />
      </div>
    </div>
  );
}
