import { cn, getDuration, isEmpty } from "@/utility";
import { WaveIcon } from "@/components/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dayjs from "dayjs";
import { ChatDesignIcon } from "@/components/chat-design-icon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { snippetReplyText } from "@/utility/chat-reply-prompt";
import type { IFile, ILinkMetadata } from "@/utility/interface";
import { ChatMediaGroup } from "./chat-media-group";
import { ChatLinkPreview } from "./chat-link-preview";
import { buildConversationAssetIndex, extractSharedUrls } from "./conversation-assets";

type ChatAttachment = Pick<IFile, "url" | "name"> &
  Partial<Omit<IFile, "url" | "name">>;

interface IBubbleProps {
  role?: "user" | "ai" | string
  attatchments?: ChatAttachment[]
  text?: string
  duration?: number
  is_voice?: boolean
  /** Compact variant for sidebar: 14px body text, user messages use bg-v3-fill-weak */
  compact?: boolean
  topic?: boolean
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
  modelLabel?: string
  linkMetadata?: ILinkMetadata[]
}

interface ITypingBubbleProps extends Pick<IBubbleProps, "text" | "modelLabel" | "topic"> {
  streamDone: boolean
  onFinish: (text: string) => void
}

function formatMessageTime(iso?: string) {
  if (!iso) return null;
  const d = dayjs(iso);
  if (!d.isValid()) return null;
  return d.format("h:mma");
}

export default function Bubble({
  role = "user",
  attatchments = [],
  duration = 0,
  text = "",
  is_voice = false,
  compact = false,
  topic = false,
  createdAt,
  sendFailed = false,
  onRetry,
  showMessageMeta,
  replyQuote,
  onReply,
  hostChatDeepDive = false,
  linkMetadata = [],
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
  const messageLinks = useMemo(
    () => buildConversationAssetIndex([{ text, link_metadata: linkMetadata }]).links,
    [linkMetadata, text],
  );
  const extractedUrls = useMemo(() => extractSharedUrls(text), [text]);
  const metadataLink = messageLinks.find((link) =>
    Boolean(link.title || link.domain || link.favicon),
  );
  const useMetadataPreview = Boolean(
    metadataLink &&
      extractedUrls.length === 1 &&
      text.trim() === extractedUrls[0],
  );

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col space-y-1",
        !topic && "px-0 sm:px-1",
        isUser && "items-end",
      )}
      title={bubbleTimeTitle}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col",
          isUser && "w-fit max-w-[min(380px,85%)] items-end",
          !isUser && (topic ? "w-fit max-w-full items-start" : "w-fit max-w-[75%] items-start"),
        )}
      >
        <div
          className={cn(
            "w-fit max-w-full",
            !hostChatDeepDive && "sky-card",
            !isUser && "chat-reply-surface",
            topic ? (isUser ? "rounded-md bg-fill-neutral-weak px-[5px] py-1" : "p-0") : "rounded-[16px] px-3 py-2",
            !topic && (isUser && !compact ? "bg-fill-chat-user" : "bg-fill-neutral-weak"),
            !isUser &&
              hostChatDeepDive &&
              "border-l-[3px] border-stroke-brand-strong pl-3",
          )}
        >
          {isUser && replyQuote?.text?.trim() ? (
            <div className={cn("mb-1 rounded-r-[3px] bg-fill-neutral-weak pl-1", topic ? "border-l-2 border-stroke-info-strong" : "border-l-[3px] border-stroke-brand-strong")}>
              <p className="sr-only">
                Replying to{" "}
                {replyQuote.role === "user" ? "your message" : "Memento"}
              </p>
              <p className="line-clamp-2 font-geist text-base leading-6 text-text-neutral-strong">
                {snippetReplyText(replyQuote.text, 160)}
              </p>
            </div>
          ) : null}
          {!isEmpty(attatchments) ? (
            <div className={cn(text.trim() && "mb-1.5")}>
              <ChatMediaGroup attachments={attatchments} sharedAt={createdAt} />
            </div>
          ) : null}
          {useMetadataPreview && metadataLink ? (
            <ChatLinkPreview link={metadataLink} />
          ) : text.trim() ? <span
            className={cn(
              "block min-w-0 max-w-full break-words font-geist font-normal text-text-neutral-strong [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
              compact
                ? "text-[14px] leading-relaxed [&_p]:m-0 [&_p]:text-[14px] [&_p]:leading-relaxed"
                : "text-base leading-6 sm:leading-7 [&_p]:m-0 [&_p]:text-inherit [&_p]:leading-[inherit]",
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
                        : "text-base leading-6 sm:leading-7"
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
                      "max-w-full break-all text-text-brand-strong underline underline-offset-2 hover:opacity-80",
                    )}
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {text || ""}
            </Markdown>
          </span> : null}
        </div>
        {metaVisible &&
          (timeLabel || canCopy || (onReply && hasReplyableContent)) && (
            <div
            className={cn(
              "mt-1 flex w-fit max-w-full flex-wrap items-center gap-1 px-0.5",
              isUser && "justify-end",
              !isUser && "justify-start",
            )}
          >
            {timeLabel ? (
              <time
                className="font-geist text-sm text-text-neutral-weak"
                dateTime={createdAt}
              >
                {timeLabel}
              </time>
            ) : null}
            {canCopy ? (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-neutral-weak transition-colors hover:bg-fill-neutral-weaker hover:text-text-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak"
                aria-label="Copy message"
              >
                <ChatDesignIcon name="copy" />
              </button>
            ) : null}
            {onReply && hasReplyableContent && !sendFailed ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply();
                }}
                className="inline-flex h-7 items-center gap-1 rounded-md px-1 font-geist text-sm font-normal text-text-neutral-weak transition-colors hover:bg-fill-neutral-weaker hover:text-text-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak"
                aria-label="Reply to message"
              >
                <ChatDesignIcon name="reply" />
                Reply
              </button>
            ) : null}
          </div>
        )}
        {isUser && sendFailed && onRetry ? (
          <div
            className={cn(
              "mt-2 flex max-w-[min(470px,100%)] flex-wrap items-center gap-2 px-0.5",
              "ml-auto justify-end",
            )}
          >
            <span className="font-inter text-xs text-text-error-strong">Couldn&apos;t send.</span>
            <button
              type="button"
              onClick={onRetry}
              className="font-inter text-xs font-semibold text-text-brand-strong underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}
        {
          is_voice &&
          <div className="mt-2 flex gap-2">
            <WaveIcon className={cn("size-[18px] text-icon-neutral-weaker", { "ml-auto size-[15px] text-text-neutral-weak": isUser })} />
            {
              isUser && (
                <span className="font-geist text-sm text-text-neutral-weak">
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


export function TypingBubble({ text, streamDone, onFinish, modelLabel, topic }: ITypingBubbleProps) {
  const [displayLength, setDisplayLength] = useState(0);
  const finishedTextRef = useRef("");
  const safeText = text || "";

  useEffect(() => {
    if (!safeText) {
      setDisplayLength(0);
      finishedTextRef.current = "";
      return;
    }

    const interval = setInterval(() => {
      setDisplayLength((prev) => {
        if (prev >= safeText.length) return prev;
        // Reveal 1-3 chars per tick for smoother typing.
        const next = prev + (safeText.length - prev > 24 ? 3 : 1);
        return Math.min(next, safeText.length);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [safeText]);

  useEffect(() => {
    if (!safeText) return;
    if (!streamDone) return;
    if (displayLength < safeText.length) return;
    if (finishedTextRef.current === safeText) return;
    finishedTextRef.current = safeText;
    onFinish(safeText);
  }, [displayLength, onFinish, safeText, streamDone]);

  return <Bubble role="ai" topic={topic} text={safeText.slice(0, displayLength)} modelLabel={modelLabel} />
}

export function Typing() {
  const loadingPhrases = [
    "Stirring stardust",
    "Tickling neurons",
    "Polishing moonbeams",
    "Herding wild ideas",
    "Brewing word-tea",
    "Chasing sparkles",
    "Weaving thought-ribbons",
    "Dusting off genius",
    "Tuning tiny violins",
    "Summoning cleverness",
    "Juggling metaphors",
    "Untangling noodle-thoughts",
    "Whispering to commas",
    "Folding clouds into sentences",
    "Feeding the brain gremlins",
    "Conducting the idea orchestra",
    "Aligning cosmic vibes",
    "Gluing thoughts with glitter",
    "Warming up the wisdom engine",
    "Adding a pinch of whimsy",
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % loadingPhrases.length);
    }, 1800);
    return () => clearInterval(id);
  }, [loadingPhrases.length]);

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-2 px-0 py-3 sm:flex-nowrap sm:px-1"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <div
        className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-solid border-[#1ED348] border-t-transparent"
        aria-hidden
      />
      <span
        className="min-w-0 max-w-full font-inter text-xs text-[#1ED348] sm:text-sm"
        style={{ wordBreak: "break-word" }}
      >
        {loadingPhrases[phraseIdx]}
      </span>
      <div className="w-1.5 h-1.5 bg-icon-neutral-weaker rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 bg-icon-neutral-weaker rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1.5 h-1.5 bg-icon-neutral-weaker rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}
