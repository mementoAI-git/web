"use client"

import Streak from "./Streak";
import TextIcon from "@/public/icon/text.svg"
import CameraIcon from "@/public/icon/camera.svg"
import MicIcon from "@/public/icon/mic.svg"
import ImageIcon from "@/public/icon/image.svg"
import ClipIcon from "@/public/icon/clip.svg"
import PlanepaperIcon from "@/public/icon/plane-paper.svg"
import DailyPrompt from "./DailyPrompt";
import PromptResponseModal from "./OverviewModal";
import { useState } from "react";

export default function Overview() {
  const [open, setOpen] = useState(false)
  return (
    <div className="w-full">
      <PromptResponseModal open={open} onClose={() => setOpen(false)} />
      <div className="flex items-stretch gap-3 py-8">
        <div className="bg-grey-700 flex flex-1 justify-between flex-col rounded-2xl p-10">
          <textarea
            placeholder="What’s on your mind today? click below to start typing"
            className="outline-0 h-fit resize-none bg-transparent flex-1 w-full placeholder:text-[#949494] placeholder:font-inter"
          ></textarea>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#344054]">
              {
                [
                  <TextIcon width={16} height={16} />,
                  <CameraIcon width={20} height={19} />,
                  <ImageIcon width={18} height={18} />,
                  <MicIcon width={14} height={20} />,
                  <ClipIcon width={17.98} height={19} />,
                  <PlanepaperIcon width={19.23} height={19.23} />
                ].map((d, i) => <div className="w-12 aspect-square flex justify-center cursor-pointer shrink-0 items-center" key={i}>{d}</div>)
              }
            </div>
            <button className="bg-secondary rounded-full py-3 px-5 font-inter font-semibold text-grey-400 text-base">Add new</button>
          </div>
        </div>
        <div className="max-w-[335px] w-full flex flex-col gap-5 flex-1 font-inter rounded-2xl p-10 border-grey-700 bg-[#FCFCFD] border">
          <span className="text-grey-800 font-medium text-xs">✌🏽 MY WEEKLY STREAK</span>
          <Streak />
          <span className="text-grey-600 text-left">Great start so far! Keep going.</span>
          <span className="text-center block text-primary font-medium text-xs cursor-pointer">See more stats</span>
        </div>
      </div>

      <div className="py-8">
        <span className="text-lg font-inter font-semibold text-grey-900">
          Today’s memory prompts
          <span className="text-grey-800"> 0/2</span>
        </span>
        <div className="flex items-stretch gap-3 mt-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-stretch gap-3">
              <DailyPrompt onClick={() => setOpen(true)} />
              <DailyPrompt onClick={() => setOpen(true)} />
            </div>
          </div>

          <div className="max-w-[335px] w-full bg-grey-700 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <span className="text-grey-800 font-inter font-medium text-xs">RECENT ACTIVITIES</span>
              <span className="text-grey-600 cursor-pointer text-sm font-semibold">See all</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}