import { IMessage } from '@/utility/interface';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown'

export default function Message({ created_at, text, role }: Partial<IMessage>) {
  const isUser = role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} w-fit max-w-[80%]`}>
        <div className={`rounded-xl ${isUser ? "bg-[#E9ECFC52]" : "bg-black/4"}  whitespace-pre-wrap break-words px-4 py-2 text-[#475467] font-inter font-normal`}>
          <Markdown>{text || ""}</Markdown>
        </div>
        <span className='text-[#475467] text-sm font-inter'>{dayjs(created_at).format("HH:mm")}</span>
      </div>
    </div>
  )
}

export function TypeMessage({ text, onFinish }) {
  const [displayText, setDisplayText] = useState("");
  const intervalRef = useRef(null);
  const previousTextRef = useRef("");
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!text) return;

    // If this is a new message (not an update to existing text)
    if (previousTextRef.current === "") {
      setDisplayText("");
      previousTextRef.current = text;
      isTypingRef.current = true;

      // Start typing from the beginning
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
          isTypingRef.current = false;
          onFinish(text);
        }
      }, 20);
    } else {
      // This is an update to existing text (new chunks arriving)
      const newChars = text.slice(previousTextRef.current.length);

      if (newChars.length > 0) {
        // Add new characters immediately without typing effect
        setDisplayText(text);
        previousTextRef.current = text;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, onFinish]);

  // Reset when text becomes empty (new message starting)
  useEffect(() => {
    if (!text) {
      previousTextRef.current = "";
      setDisplayText("");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [text]);

  return <Message text={displayText} />
}