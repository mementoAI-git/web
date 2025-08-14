import ChatIcon from "@/public/icon/chat.svg";
import GearIcon from "@/public/icon/gear.svg";
import PlusIcon from "@/public/icon/plus.svg";
import WaveIcon from "@/public/icon/wave.svg";
import careerImage from "@/public/image/image-6.png"
import { cn } from "@/utility";
import Image from "next/image";

function SuggestedCategories() {
  return (
    <div className="space-y-6">
      <div className="container w-full">
        <h4 className="font-canela font-medium text-2xl text-sand-12">Suggested Conversations</h4>
      </div>
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar pl-29">
          {
            [1, 2, 3, 4, 5, 6, 7, 8].map(t => (
              <div key={t} className="border border-sand-4 space-y-6 rounded-2xl w-full max-w-[270px] p-6 flex-shrink-0">
                <div className="h-30 relative rounded-lg overflow-hidden">
                  <div className="absolute top-2 left-2 rounded-full bg-gray-50 px-2 border border-gray-200">
                    <span className="font-inter font-medium text-xs text-gray-700">Question</span>
                  </div>
                  <Image alt="" className="size-full object-cover" src={careerImage} />
                </div>
                <div>
                  <span className="font-georgia text-xl text-sand-12 font-normal">In what ways do your family or friends support you when you feel down?</span>
                </div>
              </div>
            ))
          }
        </div>
        <div className="absolute left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  )
}

export default function Chat() {
  return (
    <div className="flex h-screen flex-col">
      <div className="w-full py-3">
        <div className="w-full mx-auto max-w-[1038px] flex items-center justify-between">
          <div className="bg-sand-2 p-3 rounded-xl flex items-center gap-2">
            <div className="size-5 flex items-center justify-center text-sand-8"><ChatIcon /></div>
            <span className="text-sand-10 text-sm font-inter">Recent Conversations</span>
          </div>
          <div className={cn("icon-container", "!rounded-xl")}>
            <GearIcon className="size-5" />
          </div>
        </div>
      </div>
      <div className="flex overflow-y-auto page-viewport flex-1 hide-scrollbar">
        <div className="space-y-16 w-full pb-8">
          <div className="container space-y-16 py-12">
            <h4 className="text-center font-canela text-[32px] leading-[38px] text-sand-12">
              Hey Groot, What’s on your mind today?
            </h4>
            <div className="w-full h-fit flex flex-col max-w-[760px] gap-10 rounded-2xl border border-sand-4 p-6 bg-white mx-auto shadow-[0px_4px_8px_0px_#AB7E2B1C]">
              <textarea className="min-h-25 w-full outline-none resize-none">

              </textarea>
              <div className="flex justify-between">
                <div className="flex items-center gap-4">
                  <div className="icon-container">
                    <PlusIcon className="size-5" />
                  </div>
                  <div className={cn("icon-container", "!rounded-xl")}>
                    <GearIcon className="size-5" />
                  </div>
                </div>
                <div className="bg-blue-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-blue-6">
                  <WaveIcon className="size-5 stroke-2" />
                  <span className="font-inter text-sm font-semibold">Use voice mode</span>
                </div>
              </div>
            </div>
          </div>
          <SuggestedCategories />
          <SuggestedCategories />
          <div className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}