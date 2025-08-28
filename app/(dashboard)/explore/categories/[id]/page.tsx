import image6 from "@/public/image/image-6.png"
import Image from "next/image"
import { cn } from "@/utility"
import CategoryPrompt from "@/components/CategoryPrompt"

export default function CategoryDetail() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-12 space-y-6">
          <div className="w-full min-h-[253px] gap-6 rounded-xl bg-sand-2 flex flex-col md:flex-row border border-sand-3 p-4">
            <div className="overflow-hidden border border-[#EAECF0] w-full md:max-w-[346px] rounded-[10px]">
              <Image src={image6} className="size-full object-cover" alt="Career and ambition" />
            </div>
            <div className="flex-1 flex flex-col gap-3 sm:gap-6">
              <h5 className="font-canela text-2xl sm:text-[32px] leading-[38px] text-sand-12">Career and Ambition</h5>
              <p className="text-sand-11 sm:text-xl font-georgia font-normal">
                Lorem ipsum dolor sit amet consectetur. Etiam vulputate commodo proin porttitor diam. Egestas purus vestibulum eros consequat tincidunt.</p>
              <div className="flex gap-3">
                <button className="rounded-full cursor-pointer hover:scale-[97%] gap-[6px] flex items-center text-xs sm:text-sm border-[1.5px] text-sand-10 border-sand-10 px-3 py-1">
                  <div className="rounded-full size-[6px] bg-sand-10" />
                  40 topics
                </button>
                <button></button>
              </div>
            </div>
          </div>
        </div>
        <div className="py-12">
          <div className="space-y-6">
            <div className="w-full overflow-x-auto hide-scrollbar gap-6 flex items-center">
              {
                [
                  "Uploaded",
                  "Answered",
                  "Unanswered"
                ].map((tab, i) => (
                  <div key={i} className={cn("p-4 cursor-pointer text-gray-500 hover:text-blue-6 hover:font-bold font-inter font-normal transition-all duration-200 ease-in-out", {
                    "font-bold text-blue-6 border-b-2": i === 0
                  })}>
                    <span>{tab}</span>
                  </div>
                ))
              }
            </div>
            <CategoryPrompt />
            <CategoryPrompt />
            <CategoryPrompt />
          </div>
        </div>
      </div>
    </div>
  )
}