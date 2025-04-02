"use client"

import TextIcon from "@/public/icon/text.svg"
import VideoIcon from "@/public/icon/video.svg"
import MicIcon from "@/public/icon/mic.svg"
import PlusIcon from "@/public/icon/plus.svg"
import { useState } from "react"
import AudioRec from "./AudioRec"
import VideoRec from "./VideoRec"

type PromptTypes = "text" | "video" | "audio";
interface IPromptValue {
  icon: React.ReactElement
  input: React.ReactElement
}

const inputTypes: Record<PromptTypes, IPromptValue> = {
  "text": {
    icon: <TextIcon width={11} />,
    input: <textarea className="placeholder:text-[#C7C9C8] w-full outline-0 p-3 rounded-2xl bg-grey-700 text-xs font-inter min-h-[425px]" placeholder="Tap to start typing..."></textarea>
  },
  "video": {
    icon: <VideoIcon width={14} height={10} />,
    input: <VideoRec />
  },
  "audio": {
    icon: <MicIcon width={9} height={13} />,
    input: <AudioRec />
  }
}

export default function PromptInput() {
  const [type, setType] = useState<PromptTypes>("text")

  return (
    <div>
      <h4 className="modal-title">What is one of your earliest childhood memories</h4>
      <div className="mt-5">
        <div className="w-full">
          {inputTypes[type].input}
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="w-10 cursor-pointer aspect-square rounded-full border border-[#EAECF0] flex items-center justify-center">
            <PlusIcon width={12} height={12} />
          </div>
          <div className="flex items-center gap-2">
            {
              Object.entries(inputTypes).map(([key, value]: any) => (
                <div
                  key={key}
                  onClick={() => setType(key)}
                  className={`bg-grey-500 w-10 cursor-pointer aspect-square rounded-full border border-[#344054] flex items-center justify-center text-[#344054] ${key === type ? "border" : "border-0"}`}
                >
                  {value.icon}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}