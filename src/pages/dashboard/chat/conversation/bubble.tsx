import { cn, getDuration, isEmpty } from "@/utility";
import { WaveIcon } from "@/components/icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";

interface IBubbleProps {
  role?: "user" | "ai" | string
  attatchments?: { url: string, name: string }[]
  text?: string
  duration?: number
  is_voice?: boolean
  /** Compact variant for sidebar: 16px regular text, user messages use bg-black/5 */
  compact?: boolean
}

interface ITypingBubbleProps extends Pick<IBubbleProps, "text"> {
  onFinish: (text: string) => void
}

export default function Bubble({
  role = "user",
  attatchments = [],
  duration = 0,
  text = "",
  is_voice = false,
  compact = false,
}: IBubbleProps) {

  const isUser = role === "user"
  const { mins, secs } = useMemo(() => {
    if (!is_voice) return getDuration(0)
    return getDuration(duration)
  }, [is_voice, duration])
  return (
    <div className={cn("flex flex-col space-y-1", isUser && "items-end")}>
      {
        !isEmpty(attatchments) &&
        <div className={cn("px-4 py-3 rounded-xl flex gap-2 w-fit max-w-[85%]", compact ? "bg-black/5" : "bg-sand-3")}>
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
            "w-full",
            isUser && compact && "py-1 px-2 rounded-lg md:rounded-xl",
            isUser && !compact && "py-1 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl",
            !isUser && "py-1 md:py-3",
            {
              "bg-black/5": isUser && compact,
              "bg-sand-3": isUser && !compact,
            }
          )}
        >
          <span className={cn(
            "text-sand-12",
            compact ? "font-georgia text-base font-normal" : "font-georgia md:text-xl"
          )}>
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mem-tags text-sm! inline-flex items-center max-w-full normal-case! cursor-pointer!",
                      "text-primary dark:text-primary/80 hover:opacity-80",
                      "truncate break-all"
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