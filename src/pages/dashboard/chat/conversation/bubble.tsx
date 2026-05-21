import { cn, getDuration, isEmpty } from "@/utility";
import { CopyIcon, WaveIcon } from "@/components/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dayjs from "dayjs";
import { CornerDownRight, Play, Mic } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { snippetReplyText } from "@/utility/chat-reply-prompt";
import { isImage } from "@/pages/dashboard/time-capsule-new/utility/helpers";
import { useModal } from "@/hooks/use-modal";
import type { IFile } from "@/utility/interface";

interface IBubbleProps {
  role?: "user" | "ai" | string
  attatchments?: { url: string; name: string; type?: string; _id?: string; size?: string | number }[]
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
  modelLabel?: string
}

interface ITypingBubbleProps extends Pick<IBubbleProps, "text" | "modelLabel"> {
  streamDone: boolean
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
  modelLabel,
}: IBubbleProps) {

  const isUser = role === "user"
  const { push } = useModal();
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
  const showDevModelLabel = Boolean(
    !isUser &&
      modelLabel &&
      (import.meta.env.DEV ||
        (typeof window !== "undefined" &&
          ["localhost", "127.0.0.1"].includes(window.location.hostname))),
  );

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col space-y-1 px-0 sm:px-1",
        isUser && "items-end",
      )}
      title={bubbleTimeTitle}
    >
      {
        !isEmpty(attatchments) &&
        <div
          className={cn(
            "flex w-fit max-w-[85%] flex-wrap gap-2 rounded-xl px-2 py-2",
            isUser && "bg-fill-neutral-weaker",
            !isUser && "bg-transparent",
          )}
        >
          {
            attatchments.map(({ url, name, type, _id, size }, i) => {
              const ext = name?.split(".").pop()?.toLowerCase() || "";
              const isVideoFile =
                type?.startsWith("video/") ||
                ["mp4", "mov", "webm", "ogg"].includes(ext);
              const isAudioFile =
                type?.startsWith("audio/") ||
                ["mp3", "wav", "m4a", "webm", "ogg", "aac"].includes(ext);
              const isImageFile = isImage(name);

              const handleClick = () => {
                // Map attachments to IFile shape for the FilePreview modal
                const files: IFile[] = attatchments.map((a) => ({
                  url: a.url,
                  name: a.name,
                  type: a.type ?? "",
                  _id: a._id ?? "",
                  size: a.size ?? 0,
                }));
                push?.("file-preview", { files, startIndex: i });
              };

              if (isVideoFile) {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={handleClick}
                    className="relative flex h-auto max-h-[99px] max-w-[148px] flex-1 shrink cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-black/80"
                  >
                    <video
                      src={url}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex size-8 items-center justify-center rounded-full bg-white/90">
                        <Play className="size-4 text-black" fill="currentColor" />
                      </div>
                    </div>
                  </button>
                );
              }

              if (isAudioFile) {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={handleClick}
                    className="flex h-[56px] w-[148px] cursor-pointer items-center gap-2 rounded-lg bg-fill-neutral-weakest px-3 py-2 transition-colors hover:bg-fill-neutral-weaker"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill-brand-weak">
                      <Mic className="size-4 text-text-brand-strong" />
                    </div>
                    <span className="min-w-0 flex-1 truncate font-inter text-xs text-text-neutral-strong">
                      {name || "Audio"}
                    </span>
                  </button>
                );
              }

              if (isImageFile) {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={handleClick}
                    className="cursor-pointer overflow-hidden rounded-lg"
                  >
                    <img
                      src={url}
                      width={148}
                      height={99}
                      className="h-auto max-h-[99px] max-w-[148px] flex-1 shrink rounded-lg object-cover transition-opacity hover:opacity-90"
                      alt={name}
                    />
                  </button>
                );
              }

              // Fallback for other file types (PDF, etc.)
              return (
                <button
                  type="button"
                  key={i}
                  onClick={handleClick}
                  className="flex h-[56px] w-[148px] cursor-pointer items-center gap-2 rounded-lg bg-fill-neutral-weakest px-3 py-2 transition-colors hover:bg-fill-neutral-weaker"
                >
                  <span className="min-w-0 flex-1 truncate font-inter text-xs text-text-neutral-strong">
                    {name || "File"}
                  </span>
                </button>
              );
            })
          }
        </div>
      }
      <div
        className={cn(
          "min-w-0 max-w-full",
          isUser && "w-fit max-w-[min(470px,85%)]",
          !isUser && "w-full",
        )}
      >
        <div
          className={cn(
            "w-full max-w-full rounded-[8px] p-2 sm:p-2.5",
            isUser && "max-w-[min(470px,85%)]",
            isUser && compact && "bg-fill-neutral-weaker",
            isUser && !compact && "bg-fill-neutral-weaker",
            !isUser && "bg-transparent",
            !isUser &&
              hostChatDeepDive &&
              "border-l-[3px] border-stroke-brand-strong bg-fill-neutral-weakest pl-3",
          )}
        >
          {showDevModelLabel ? (
            <div className="mb-1.5">
              <span className="inline-flex rounded-md bg-fill-brand-weak px-1.5 py-0.5 font-inter text-[10px] font-semibold uppercase tracking-wide text-text-brand-strong">
                {modelLabel}
              </span>
            </div>
          ) : null}
          {isUser && replyQuote?.text?.trim() ? (
            <div className="mb-2 border-b border-stroke-neutral-weaker pb-2">
              <p className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-neutral-weak">
                Replying to{" "}
                {replyQuote.role === "user" ? "your message" : "Memento"}
              </p>
              <p className="mt-0.5 line-clamp-2 font-inter text-xs text-text-neutral-strong opacity-90">
                {snippetReplyText(replyQuote.text, 160)}
              </p>
            </div>
          ) : null}
          <span
            className={cn(
              "block min-w-0 max-w-full text-text-neutral-strong font-georgia font-normal break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
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
              "mt-1 flex max-w-[min(470px,100%)] flex-wrap items-center gap-1 px-0.5",
              isUser && "ml-auto justify-end",
              !isUser && "justify-start",
            )}
          >
            {timeLabel ? (
              <time
                className="font-inter text-xs text-text-neutral-weak"
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
                className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 font-inter text-xs font-medium text-text-neutral-weak transition-colors hover:bg-fill-neutral-weakest hover:text-text-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak"
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
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-neutral-weak transition-colors hover:bg-fill-neutral-weakest hover:text-text-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak"
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
                <span className="font-inter text-xs text-text-neutral-weak">
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


export function TypingBubble({ text, streamDone, onFinish, modelLabel }: ITypingBubbleProps) {
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

  return <Bubble role="ai" text={safeText.slice(0, displayLength)} modelLabel={modelLabel} />
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