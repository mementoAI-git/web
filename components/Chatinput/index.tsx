"use client"

import GearIcon from "@/public/icon/gear.svg";
import PlusIcon from "@/public/icon/plus.svg";
import WaveIcon from "@/public/icon/wave.svg";
import { cn } from "@/utility";
import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Voiceinput from "./Voiceinput";
import Spinner from "../Spinner";

interface IOnSendPayload {
  attachments?: string[];
  text: string
}

interface IChatinputProps {
  className?: string
  inputClassName?: string
  typing?: boolean
  loading?: boolean
  onChangeText?: (str: string) => void;
  onSend?: (p: IOnSendPayload) => void
  onStop?: () => void
  context?: "default" | "memory" | "chat";
}

export default function Chatinput({
  className = "",
  inputClassName = "",
  typing = false,
  loading = false,
  onStop,
  onSend
}: IChatinputProps) {
  const [text, setText] = useState("")
  const [isVoiceMode, setIsVoiceMode] = useState(false)
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

  const handleSend = () => {
    const payload = { text }
    onSend(payload)
    setText("")

    // Reset textarea height to original size
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.overflowY = 'hidden';
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      text.trim();
      handleSend()
    }
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  if (isVoiceMode) {
    return (
      <Voiceinput
        onCancel={() => setIsVoiceMode(false)}
      />
    );
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
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type text here..."
        className={cn("min-h-10 md:min-h-12 w-full outline-none resize-none text-lg md:text-xl overflow-hidden", inputClassName)}
        onInput={adjustHeight}
        rows={1}
        onKeyDown={handleKeyDown}
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
          typing ?
            <button onClick={onStop} className="btn !bg-blue-6 text-white">Stop</button> :
            (text.length > 0 || loading) ?
              <button
                onClick={handleSend}
                disabled={loading || typing}
                className="btn !bg-blue-6 space-x-2 disabled:opacity-60 text-white"
              >
                {
                  loading ?
                    <>
                      <span>Sending..</span>
                      <Spinner loading className="!size-4" />
                    </> :
                    "Send"
                }
              </button> :
              <button
                onClick={() => setIsVoiceMode(true)}
                className="sm:bg-blue-2 cursor-pointer bg-transparent flex items-center gap-2 rounded-full px-5 py-2.5 text-blue-6"
              >
                <WaveIcon className="size-5 stroke-2" />
                <span className="font-inter hidden sm:inline text-sm font-semibold">
                  Use voice mode
                </span>
              </button>
        }
      </div>
    </div>
  )
}
