import { plainTextFromQuickCaptureNote } from "@/lib/quick-capture-drafts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mergeVoiceTimeline } from "@/features/voice/timeline";
import type { VoiceTimelineEntry } from "@/features/voice/types";
import { VoiceSessionDivider, type VoiceSessionEvent } from "./voice-session-divider";
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
import TopicHeader from "./topic-header";
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
  voiceEvents?: VoiceSessionEvent[];
  liveTimeline?: VoiceTimelineEntry[];
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
  voiceEvents = [],
  liveTimeline = [],
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
  const isReflection = Boolean(useMatch({ path: "/chat/reflection/:id", end: true }));
  const isTopic = Boolean(useMatch({ path: "/chat/reply/:id", end: true })) || isReflection;
  const hideInlineConversationHeader = Boolean(chatDetailMatch || chatVoiceMatch);

  const isLoadingMoreRef = useRef(false);
  const attemptedInitialRef = useRef(false);
  const activeRef = useRef(true);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastId = `message-history:${memory?._id}`;
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      clearTimeout(scrollTimer.current);
      toast.dismiss(toastId);
    };
  }, [toastId]);
  const [loadFailed, setLoadFailed] = useState(false);
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
    if (!activeRef.current || isLoadingMoreRef.current || isEmpty(memory?._id)) return;
    attemptedInitialRef.current = true;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const { data } = await getMessages();
      if (!activeRef.current) return;
      if (!data) throw new Error("Missing message history");
      setLoadFailed(false);
      toast.dismiss(toastId);

      const container = containerRef.current;
      const oldScrollHeight = container?.scrollHeight || 0;

      const newMessages = data?.messages || [];

      setMessages(prev => {
        const existing = new Set(prev.map(message => message._id).filter(Boolean));
        return [...newMessages.filter((message: Partial<IMessage>) => !message._id || !existing.has(message._id)), ...prev];
      });
      setNext(data?.next);

      // Re-adjust scroll position after new messages are loaded
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        const el = containerRef.current;
        if (!el) return;
        if (oldScrollHeight > 0) {
          const newScrollHeight = el.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;
          el.scrollTop = el.scrollTop + heightDifference;
        } else {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          });
        }
      }, 50);

    } catch {
      if (!activeRef.current) return;
      setLoadFailed(true);
      toast.error("Message history couldn’t be loaded. Try again.", {
        id: toastId,
        action: { label: "Retry", onClick: () => { void fetchMessage(); } },
      });
    } finally {
      isLoadingMoreRef.current = false;
      if (activeRef.current) setIsLoadingMore(false);
    }
  }, [getMessages, setMessages, containerRef, memory?._id, toastId]);

  // This effect now handles both the initial and subsequent infinite scroll fetches
  useEffect(() => {
    // We only fetch if the element is intersecting, there's a 'next' page, and we are not already loading
    if (!loadFailed && isIntersecting && next && !isLoadingMoreRef.current) {
      fetchMessage();
    }
    // Also, trigger an initial fetch on component mount, but only once
    if (!messages.length && !attemptedInitialRef.current && !isLoadingMoreRef.current) {
      fetchMessage();
    }
  }, [isIntersecting, next, fetchMessage, messages.length, loadFailed]);


  // Do not put `ref={scrollContainerRef}` here — the parent conversation column
  // owns that ref on the overflow-y-auto element. Re-attaching the same ref breaks
  // scrolling, scroll restoration, and intersection-based load-more.
  return (
    <div className="w-full max-w-full flex-1">

      {isTopic ? <TopicHeader memory={memory} /> : !hideInlineConversationHeader ? (
        <div className="w-full h-fit overflow-hidden space-y-6 py-3 px-6">
          <div>
            <GoBack />
          </div>
          <ConversationHeader {...{ onViewDetails, memory }} />
        </div>
      ) : null}
      <div className={isTopic ? "min-w-0 space-y-1 px-4 pt-4" : "min-w-0 space-y-1 px-0"}>
        {memory?.prompt_type && (memory?.body?.trim() || memory?.attachments?.length > 0) && (
          <Bubble role="user" text={plainTextFromQuickCaptureNote(memory.body || "")} attatchments={memory.attachments || []} createdAt={memory.created_at} topic />
        )}
        {isLoadingMore && (
          <div className="py-3 flex justify-center items-center">
            <div className="flex gap-1.5 text-sm text-text-neutral-weaker">
              <span>Loading more messages...</span>
              <Spinner loading className="!size-3" />
            </div>
          </div>
        )}
        {loadFailed && <div className="flex justify-center py-3"><Button variant="outline" disabled={isLoadingMore} onClick={() => { void fetchMessage(); }}>Retry loading messages</Button></div>}
        <div ref={loadMoreRef} className="w-full h-1" />
        {voiceEvents.filter(event => !event.afterMessage).map(event => <VoiceSessionDivider key={event.id} active={event.active} />)}
        {messages &&
          (() => {
            let lastDayKey: string | null = null;
            let lastMonthKey: string | null = null;
            return mergeVoiceTimeline(messages, liveTimeline).map((row, i) => {
              if (row.kind !== "message") return <VoiceSessionDivider key={row.id} active={row.kind === "started"} />;
              const m = row.message;
              const failed = Boolean((m as { sendFailed?: boolean }).sendFailed);
              const attachments = m.attachments ?? m.attatchments;
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
                <Fragment key={`${m._id ?? "msg"}-${i}`}>
                  {showDayDivider && validIso && iso ? (
                    <div
                      className={isTopic ? "flex justify-center" : "flex justify-center py-2"}
                      role="separator"
                      aria-label={dayDividerLabel(iso)}
                    >
                      <span className={isTopic ? "font-geist text-xs leading-4 text-text-neutral-weaker opacity-70" : "px-3 py-1 font-inter text-xs font-normal text-text-neutral-weaker"}>
                        {isTopic ? dayjs(iso).format("MMMM D, YYYY") : dayDividerLabel(iso)}
                      </span>
                    </div>
                  ) : null}
                  <div id={showMonthAnchor && monthK ? `host-chat-anchor-${monthK}` : undefined}>
                    <Bubble
                      topic={isTopic}
                      role={m.role}
                      text={m.text ?? ""}
                      createdAt={m.created_at}
                      modelLabel={(m as { ai_model?: string }).ai_model}
                      attatchments={attachments}
                      linkMetadata={m.link_metadata}
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
                  {voiceEvents.filter(event => event.afterMessage === m).map(event => <VoiceSessionDivider key={event.id} active={event.active} />)}
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
