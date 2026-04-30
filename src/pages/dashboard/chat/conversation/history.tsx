import {
  Fragment,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import Bubble from "./bubble";
import { dayDividerLabel } from "@/features/host-chat/month-navigation";
import ConversationHeader from "./header";
import type { ChatReplyQuote } from "@/utility/chat-reply-prompt";
import { type IMemory, type IMessage } from "@/utility/interface";
import { replyQuoteBodyFromMessage } from "./reply-quote-body";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import { isEmpty } from "@/utility";
import GoBack from "@/components/go-back";
import { useMatch } from "react-router-dom";

interface IHistory extends PropsWithChildren {
  setMessages: Dispatch<SetStateAction<Partial<IMessage>[]>>;
  messages: Partial<IMessage>[];
  memory: IMemory;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onViewDetails: () => void
  onRetryFailedMessage?: () => void
  onReplyToMessage?: (quote: ChatReplyQuote) => void
  hostChatDeepDive?: boolean
}

export default function History({
  memory,
  messages,
  children,
  setMessages,
  scrollContainerRef,
  onViewDetails,
  onRetryFailedMessage,
  onReplyToMessage,
  hostChatDeepDive = false,
}: IHistory) {
  const chatDetailMatch = useMatch({ path: "/chat/:id", end: true });
  const chatVoiceMatch = useMatch({ path: "/chat/:id/voice", end: true });
  const hideInlineConversationHeader = Boolean(chatDetailMatch || chatVoiceMatch);

  const isLoadingMoreRef = useRef(false);
  const containerRef = scrollContainerRef;
  /** Refs are unset during the first render; bump after layout so IO + scroll use the real column. */
  const [scrollRootReady, setScrollRootReady] = useState(false);
  useLayoutEffect(() => {
    setScrollRootReady(true);
  }, []);
  const [next, setNext] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { trigger: getMessages } = useFetcher(
    !isEmpty(memory?._id) ?
      `${endpoint.aiPromptMessage}/${memory?._id}?next=${next || ""}` :
      null
    , "get"
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef, {
    root: scrollRootReady ? containerRef.current : null,
    rootMargin: "20px 0px 0px 0px",
    threshold: 0.5,
  });

  const fetchMessage = useCallback(async () => {
    if (isLoadingMoreRef.current || isEmpty(memory?._id)) return;

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


  // Do not put `ref={scrollContainerRef}` here — the parent conversation column
  // owns that ref on the overflow-y-auto element. Re-attaching the same ref breaks
  // scrolling, scroll restoration, and intersection-based load-more.
  return (
    <div className="w-full max-w-full flex-1">

      {!hideInlineConversationHeader ? (
        <div className="w-full h-fit overflow-hidden space-y-6 py-3 px-6">
          <div>
            <GoBack />
          </div>
          <ConversationHeader {...{ onViewDetails, memory }} />
        </div>
      ) : null}
      <div className="px-0 sm:px-3 md:px-[30px] space-y-6">
        {isLoadingMore && (
          <div className="py-3 flex justify-center items-center">
            <div className="flex gap-1.5 text-sm text-text-neutral-weaker">
              <span>Loading more messages...</span>
              <Spinner loading className="!size-3" />
            </div>
          </div>
        )}
        <div ref={loadMoreRef} className="w-full h-1" />
        {messages &&
          (() => {
            let lastDayKey: string | null = null;
            let lastMonthKey: string | null = null;
            return messages.map((m, i) => {
              const failed = Boolean((m as { sendFailed?: boolean }).sendFailed);
              const attachments = (m as { attatchments?: { url: string; name: string }[] })
                .attatchments;
              const storedReply = (m as { replyTo?: ChatReplyQuote }).replyTo;
              const replyBody = replyQuoteBodyFromMessage(m.text, attachments);
              const iso = m.created_at;
              const validIso = Boolean(iso && dayjs(iso).isValid());
              const dayK = validIso && iso ? dayjs(iso).format("YYYY-MM-DD") : null;
              const monthK = validIso && iso ? dayjs(iso).format("YYYY-MM") : null;
              const showDayDivider = Boolean(dayK && dayK !== lastDayKey);
              if (showDayDivider && dayK) lastDayKey = dayK;
              const showMonthAnchor = Boolean(monthK && monthK !== lastMonthKey);
              if (monthK) lastMonthKey = monthK;
              const isAi = m.role !== "user";

              return (
                <Fragment key={m._id ?? `msg-${i}`}>
                  {showDayDivider && validIso && iso ? (
                    <div
                      className="flex justify-center py-2"
                      role="separator"
                      aria-label={dayDividerLabel(iso)}
                    >
                      <span className="rounded-full bg-fill-neutral-weakest px-3 py-1 font-inter text-xs font-medium text-text-neutral-weaker">
                        {dayDividerLabel(iso)}
                      </span>
                    </div>
                  ) : null}
                  <div id={showMonthAnchor && monthK ? `host-chat-anchor-${monthK}` : undefined}>
                    <Bubble
                      role={m.role}
                      text={m.text ?? ""}
                      createdAt={m.created_at}
                      modelLabel={(m as { ai_model?: string }).ai_model}
                      attatchments={attachments}
                      sendFailed={failed}
                      onRetry={failed ? onRetryFailedMessage : undefined}
                      replyQuote={storedReply}
                      hostChatDeepDive={hostChatDeepDive && isAi}
                      onReply={
                        onReplyToMessage && replyBody
                          ? () =>
                              onReplyToMessage({
                                role: m.role === "user" ? "user" : "ai",
                                text: replyBody,
                              })
                          : undefined
                      }
                    />
                  </div>
                </Fragment>
              );
            });
          })()}
        {children}
        <div className="w-full h-5" />
      </div>
    </div>
  );
}
