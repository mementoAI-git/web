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
  const [index, setIndex] = useState(0)
  const intervalRef = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIndex(prev => {
        if (prev < text.length) {
          return prev + 1
        } else {
          return prev
        }
      })

    }, 10);

    if (index >= text.length) {
      clearInterval(intervalRef.current);
      onFinish(text);
    }

    return () => clearInterval(intervalRef.current);
  }, [text]);

  return <Message text={text.slice(0, index)} />
}