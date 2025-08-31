"use client"

import GearIcon from "@/public/icon/gear.svg";
import PlusIcon from "@/public/icon/plus.svg";
import WaveIcon from "@/public/icon/wave.svg";
import MicIcon from "@/public/icon/mic.svg"
import TImesMarkIcon from "@/public/icon/times.svg"
import { cn } from "@/utility";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface IChatinputProps {
  className?: string
  inputClassName?: string
}

export default function Chatinput({ className = "", inputClassName = "" }: IChatinputProps) {
  const [text, setText] = useState("")
  const [isVoicMode, setIsVoiceMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300); // Max height of 200px
      textarea.style.height = `${newHeight}px`;

      // Show scrollbar when content exceeds max height
      if (textarea.scrollHeight > 200) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, []);

  if (isVoicMode) {
    return createPortal(
      <div className="fixed border bg-background h-screen w-screen top-0 bottom-0 right-0 left-0 flex justify-center items-center">
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="size-30 rounded-full border" />
            <span className="font-georgia text-2xl text-center text-sand-12">00:13:00</span>
          </div>
          <div className="flex gap-6 items-center">
            <div className={cn("icon-container !bg-blue-2", "!rounded-xl")}>
              <MicIcon className="size-5 text-blue-6" />
            </div>

            <div onClick={() => setIsVoiceMode(false)} className={cn("icon-container !bg-blue-2", "!rounded-xl")}>
              <TImesMarkIcon className="size-4 text-blue-6" />
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div
      className={
        cn(
          "w-full h-fit flex flex-col gap-3 md:gap-10 rounded-2xl border border-sand-4 py-3 px-4 md:p-6 bg-white mx-auto shadow-[0px_4px_8px_0px_#AB7E2B1C]",
          className
        )
      }
    >
      <textarea
        ref={textareaRef}
        onChange={e => setText(e.target.value)}
        placeholder="Type text here..."
        className={cn("min-h-10 md:min-h-12 w-full outline-none resize-none text-lg md:text-xl overflow-hidden", inputClassName)}
        onInput={adjustHeight}
        rows={1}
      >

      </textarea>
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <div className="icon-container !size-8 md:!size-11">
            <PlusIcon className="size-3 md:size-5" />
          </div>
          <div className={cn("icon-container", "!rounded-xl !size-8 md:!size-11")}>
            <GearIcon className="size-4 md:size-5" />
          </div>
        </div>
        {
          text.length > 0 ?
            <button className="btn !bg-blue-6 text-white">Send</button> :
            <button onClick={() => setIsVoiceMode(true)} className="sm:bg-blue-2 cursor-pointer bg-transparent flex items-center gap-2 rounded-full px-5 py-2.5 text-blue-6">
              <WaveIcon className="size-5 stroke-2" />
              <span className="font-inter hidden sm:inline text-sm font-semibold">Use voice mode</span>
            </button>
        }
      </div>
    </div>
  )
}