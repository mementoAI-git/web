import { cn, getDuration, isEmpty } from "@/utility";
import { CopyIcon, WaveIcon } from "@/components/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dayjs from "dayjs";
import { CornerDownRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { snippetReplyText } from "@/utility/chat-reply-prompt";

interface IBubbleProps {
  role?: "user" | "ai" | string
  attatchments?: { url: string, name: string }[]
  text?: string
  duration?: number
  is_voice?: boolean
  /** Compact variant for sidebar: 14px body text, user messages use bg-v3-fill-weak */
  compact?: boolean
  /** ISO timestamp from the server; shown when valid */
  createdAt?: string
  /** When true, show retry after a failed send (user messages only) */
  sendFailed?: boolean
  onRetry?: () => void
  /** When false, hide time + copy (defaults to hidden when `compact`) */
  showMessageMeta?: boolean
  /** Shown above the body on user bubbles when this message was a reply */
  replyQuote?: { role: string; text: string } | null
  onReply?: () => void
  /** Host Chat: deep-dive accent on assistant bubbles */
  hostChatDeepDive?: boolean
}

interface ITypingBubbleProps extends Pick<IBubbleProps, "text"> {
  onFinish: (text: string) => void
}

function formatMessageTime(iso?: string) {
  if (!iso) return null;
  const d = dayjs(iso);
  if (!d.isValid()) return null;
  return d.format("MMM D, h:mm A");
}

export default function Bubble({
  role = "user",
  attatchments = [],
  duration = 0,
  text = "",
  is_voice = false,
  compact = false,
  createdAt,
  sendFailed = false,
  onRetry,
  showMessageMeta,
  replyQuote,
  onReply,
  hostChatDeepDive = false,
}: IBubbleProps) {

  const isUser = role === "user"
  const metaVisible = showMessageMeta ?? !compact;
  const timeLabel = metaVisible ? formatMessageTime(createdAt) : null;
  const canCopy = metaVisible && Boolean(text?.trim());
  const hasReplyableContent = Boolean(text?.trim() || !isEmpty(attatchments));
  const bubbleTimeTitle =
    metaVisible && createdAt && dayjs(createdAt).isValid()
      ? `Sent ${dayjs(createdAt).format("MMMM D, YYYY [at] h:mm A")}`
      : undefined;

  const handleCopy = useCallback(async () => {
    const t = text?.trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }, [text]);

  const { mins, secs } = useMemo(() => {
    if (!is_voice) return getDuration(0)
    return getDuration(duration)
  }, [is_voice, duration])
  return (
    <div
      className={cn("flex flex-col space-y-1 px-2", isUser && "items-end")}
      title={bubbleTimeTitle}
    >
      {
        !isEmpty(attatchments) &&
        <div
          className={cn(
            "flex w-fit max-w-[85%] gap-2 rounded-xl px-2 py-2",
            isUser && "bg-v3-fill-weak",
            !isUser && "bg-transparent",
          )}
        >
          {
            attatchments.map(({ url, name }, i) => (
              <img
                src={url}
                width={148}
                height={99}
                className="flex-1 h-auto max-h-[99px] max-w-[148px] shrink rounded-lg object-cover"
                alt={name}
                key={i}
              />
            ))
          }
        </div>
      }
      <div className={cn(isUser && "w-fit max-w-[85%]")}>
        <div
          className={cn(
            "w-full rounded-[8px] p-2",
            isUser && "max-w-[470px]",
            isUser && compact && "bg-v3-fill-weak",
            isUser && !compact && "bg-v3-fill-weak",
            !isUser && "bg-transparent",
            !isUser &&
              hostChatDeepDive &&
              "border-l-[3px] border-v3-brand-strong bg-v3-fill-weaker pl-3",
          )}
        >
          {isUser && replyQuote?.text?.trim() ? (
            <div className="mb-2 border-b border-v3-stroke-weak pb-2">
              <p className="font-inter text-[10px] font-semibold uppercase tracking-wide text-v3-text-weak">
                Replying to{" "}
                {replyQuote.role === "user" ? "your message" : "Memento"}
              </p>
              <p className="mt-0.5 line-clamp-2 font-inter text-xs text-v3-text-strong opacity-90">
                {snippetReplyText(replyQuote.text, 160)}
              </p>
            </div>
          ) : null}
          <span
            className={cn(
              "text-sand-12 font-georgia font-normal",
              compact
                ? "text-[14px] leading-relaxed [&_p]:m-0 [&_p]:text-[14px] [&_p]:leading-relaxed"
                : "text-base leading-relaxed md:text-xl md:leading-snug [&_p]:m-0 [&_p]:text-base [&_p]:leading-relaxed [&_p]:md:text-xl [&_p]:md:leading-snug",
            )}
          >
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children, ...props }) => (
                  <p
                    className={
                      compact
                        ? "text-[14px] leading-relaxed"
                        : "text-base leading-relaxed md:text-xl md:leading-snug"
                    }
                    {...props}
                  >
                    {children}
                  </p>
                ),
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mem-tags text-sm! inline-flex items-center max-w-full normal-case! cursor-pointer!",
                      "text-primary dark:text-primary/80 hover:opacity-80",
                      "truncate break-all",
                    )}
                    {...props}
                  >
                    <span className="truncate">{children}</span>
                  </a>
                ),
              }}
            >
              {text || ""}
            </Markdown>
          </span>
        </div>
        {metaVisible &&
          (timeLabel || canCopy || (onReply && hasReplyableContent)) && (
          <div
            className={cn(
              "mt-1 flex max-w-[470px] flex-wrap items-center gap-1 px-0.5",
              isUser && "ml-auto justify-end",
              !isUser && "justify-start",
            )}
          >
            {timeLabel ? (
              <time
                className="font-inter text-xs text-[var(--v3-text-weak)]"
                dateTime={createdAt}
              >
                {timeLabel}
              </time>
            ) : null}
            {onReply && hasReplyableContent && !sendFailed ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply();
                }}
                className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 font-inter text-xs font-medium text-[var(--v3-text-weak)] transition-colors hover:bg-v3-fill-weaker hover:text-v3-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong"
                aria-label="Reply to message"
              >
                <CornerDownRight className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                Reply
              </button>
            ) : null}
            {canCopy ? (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--v3-text-weak)] transition-colors hover:bg-v3-fill-weaker hover:text-v3-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong"
                aria-label="Copy message"
              >
                <CopyIcon className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        )}
        {isUser && sendFailed && onRetry ? (
          <div
            className={cn(
              "mt-2 flex max-w-[470px] flex-wrap items-center gap-2 px-0.5",
              "ml-auto justify-end",
            )}
          >
            <span className="font-inter text-xs text-[#F97066]">Couldn&apos;t send.</span>
            <button
              type="button"
              onClick={onRetry}
              className="font-inter text-xs font-semibold text-[var(--v3-brand-strong)] underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}
        {
          is_voice &&
          <div className="mt-2 flex gap-2">
            <WaveIcon className={cn("size-[18px] text-sand-8", { "ml-auto size-[15px] text-[#667085]": isUser })} />
            {
              isUser && (
                <span className="font-inter text-xs text-gray-700">
                  {mins}:{secs}
                </span>
              )
            }
          </div>
        }
      </div>
    </div>
  )
}


export function TypingBubble({ text, onFinish }: ITypingBubbleProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);
  const lastTextLengthRef = useRef(0);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      setIsTyping(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If this is a completely new message (starting from empty)
    if (lastTextLengthRef.current === 0) {
      setDisplayText("");
      setIsTyping(true);
      lastTextLengthRef.current = text.length;

      // Start typing effect from the beginning
      let currentIndex = 0;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        currentIndex += 1;

        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
        } else {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsTyping(false);
          onFinish(text);
        }
      }, 20);
    } else {
      // This is an update to existing text (new chunks arriving)
      const newChars = text.slice(lastTextLengthRef.current);

      if (newChars.length > 0) {
        // Add new characters immediately without typing effect
        setDisplayText(text);
        lastTextLengthRef.current = text.length;

        // If we were typing, stop and show the new content
        if (isTyping && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsTyping(false);
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, onFinish, isTyping]);

  // Reset when text becomes empty (new message starting)
  useEffect(() => {
    if (!text) {
      lastTextLengthRef.current = 0;
      setDisplayText("");
      setIsTyping(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [text]);

  return <Bubble role="ai" text={displayText} />
}

export function Typing() {
  return (
    <div className="flex items-center gap-1 px-5 py-3">
      <div className="w-2 h-2 bg-sand-8 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-sand-8 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-sand-8 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}