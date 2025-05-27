import { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown'

export default function Message({ text, isUser = false }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`rounded-xl ${isUser ? "bg-[#E9ECFC52]" : "bg-black/4"} w-fit px-4 py-2 max-w-[80%] min-w-81 text-[#475467] font-inter font-normal`}>
        <Markdown>{text || ""}</Markdown>
      </div>
      <span></span>
    </div>
  )
}

export function TypeMessage({ text, onFinish }) {
  const [displayedText, setDisplayedText] = useState("");
  const lastLength = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    if (!text || lastLength.current >= text.length || done.current) return;

    const newText = text.slice(lastLength.current);
    let i = 0;

    const interval = setInterval(() => {
      if (i < newText.length) {
        setDisplayedText((prev) => prev + newText[i]);
        i++;
      } else {
        clearInterval(interval);

        lastLength.current = text.length;
        if (!done.current) {
          done.current = true;
          onFinish(text);
        }
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text]);

  return <Message text={displayedText} />
}