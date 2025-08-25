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
        <h4 className="font-canela font-medium text-xl md:text-2xl text-sand-12">Suggested Conversations</h4>
      </div>
      <div className="relative w-full">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar lg:pl-29">
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
                  <span className="font-georgia md:text-xl text-sand-12 font-normal">In what ways do your family or friends support you when you feel down?</span>
                </div>
              </div>
            ))
          }
        </div>
        <div className="absolute hidden md:block left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute hidden md:block  right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>
    </div>
  )
}

export default function Chat() {
  return (
    <div className="flex h-screen flex-col">
      <div className="w-full px-2 py-3">
        <div className="w-full px-2 mx-auto max-w-[1038px] flex items-center justify-between">
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
        <div className="space-y-10 md:space-y-16 w-full pb-8">
          <div className="container space-y-10 md:space-y-16 py-6 md:py-12">
            <h4 className="hidden md:block text-center font-canela text-[32px] leading-[38px] text-sand-12">
              Hey Groot, What’s on your mind today?
            </h4>
            <h4 className="md:hidden font-medium font-canela text-2xl text-sand-12">
              Hey <span className="italic font-light gray-500">Groot</span>, <br />
              What’s on your mind today?
            </h4>
            <div className="w-full h-fit flex flex-col max-w-[760px] gap-3 md:gap-10 rounded-2xl border border-sand-4 py-3 px-4 md:p-6 bg-white mx-auto shadow-[0px_4px_8px_0px_#AB7E2B1C]">
              <textarea
                placeholder="Type text here..."
                className="min-h-10 md:min-h-25 w-full outline-none resize-none text-lg md:text-2xl"
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
                <div className="sm:bg-blue-2 bg-transparent flex items-center gap-2 rounded-full px-5 py-2.5 text-blue-6">
                  <WaveIcon className="size-5 stroke-2" />
                  <span className="font-inter hidden sm:inline text-sm font-semibold">Use voice mode</span>
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