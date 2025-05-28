import { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown'

export default function Message({ text, isUser = false }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`rounded-xl ${isUser ? "bg-[#E9ECFC52]" : "bg-black/4"}  whitespace-pre-wrap break-words w-fit px-4 py-2 max-w-[80%] text-[#475467] font-inter font-normal`}>
        <Markdown>{text || ""}</Markdown>
      </div>
      <span></span>
    </div>
  )
}

export function TypeMessage({ text, onFinish }) {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    clearInterval(intervalRef.current);
    done.current = false;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(prev => prev + text[indexRef.current]);
        indexRef.current++;
      } else {
        clearInterval(intervalRef.current);
        if (!done.current) {
          done.current = true;
          onFinish?.(text);
        }
      }
    }, 10);

    return () => clearInterval(intervalRef.current);
  }, [text]);

  return <Message text={displayedText} />
}