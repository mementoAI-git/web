import endpoint from "@/api/endpoint"
import useFetcher from "@/hooks/use-fetcher"
import { IMessage } from "@/utility/interface"
import { Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useRef, useState } from "react"
import Message from "./message"
import Spinner from "@/components/Spinner"
import { isEmpty } from "@/utility"

interface IHistory extends PropsWithChildren {
  setMessages: Dispatch<SetStateAction<Partial<IMessage>[]>>,
  messages: Partial<IMessage>[]
}

export default function History({ messages, setMessages, children }: IHistory) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true);
  const lastScrollTop = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const loadMoreTriggeredRef = useRef(false);

  const [next, setNext] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { trigger: getMessages } = useFetcher(`${endpoint.aiPromptMessage}?limit=50&next=${next || ""}`, "get")

  const fetchMessage = useCallback(async () => {
    if (isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const { data } = await getMessages();
      if (!data) return;

      const container = containerRef.current;
      const oldScrollHeight = container?.scrollHeight || 0;

      if (isEmpty(messages)) {
        setMessages(data?.messages || []);
      } else {
        setMessages(prev => [...data?.messages, ...prev]);
      }
      setNext(data?.next);

      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;
          container.scrollTop = container.scrollTop + heightDifference;
        }
        loadMoreTriggeredRef.current = false;
      }, 50);

    } catch (error) {
      loadMoreTriggeredRef.current = false;
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [getMessages, messages]);

  // Initial load
  useEffect(() => {
    if (!hasInitialized) {
      fetchMessage();
      setHasInitialized(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    wasAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 10;

    const isScrollingUp = scrollTop < lastScrollTop.current;

    if (
      scrollTop <= 30 &&
      isScrollingUp &&
      next &&
      !isLoadingMoreRef.current &&
      !loadMoreTriggeredRef.current
    ) {
      loadMoreTriggeredRef.current = true;
      fetchMessage();
    }

    lastScrollTop.current = scrollTop;
  }, [next, fetchMessage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasInitialized) return;

    if (wasAtBottomRef.current && !isLoadingMore) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages, children, hasInitialized, isLoadingMore]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="space-y-4 gap-2"
      style={{ scrollBehavior: 'smooth' }}
    >
      {isLoadingMore && (
        <div className="py-3 flex justify-center items-center">
          <div className="flex gap-1.5 text-sm text-gray-500">
            <span>Loading more messages...</span>
            <Spinner loading={true} className="!size-3" />
          </div>
        </div>
      )}

      {messages && messages.map((m, i) => <Message key={i} {...m} />)}
      {children}
      <div className="w-full h-35" />
    </div>
  )
}