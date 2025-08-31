
import questionImage from "@/public/image/question-2.png"
import Image from "next/image"
import LunchIcon from "@/public/icon/lauch.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import EllipseIcon from "@/public/icon/vertical-ellipse.svg"

export default function COnversationHeader() {
  return (
    <div className="border border-sand-4 rounded-2xl p-6 flex items-center gap-10">
      <div className="size-[86px] shrink-0 hidden sm:flex items-center justify-center">
        <Image className="size-full shrink-0 object-contain" alt="Question icon" src={questionImage} />
      </div>

      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
          <button className="rounded-full cursor-pointer hover:scale-[97%] gap-[6px] flex items-center text-xs border-[1.5px] text-sand-10 border-sand-10 px-3 py-1">
            Question
          </button>
          <div className="flex gap-4 items-center text-sand-12">
            <LunchIcon className="size-[18px] stroke-[1.5px] cursor-pointer" />
            <BookmarkIcon className="size-[18px] stroke-2 cursor-pointer" />
            <EllipseIcon className="size-[16px] stroke-1 cursor-pointer" />
          </div>
        </div>
        <h3 className="md:text-xl md:font-medium font-canela text-sand-12">
          Think of a recent happy memory with your family. What happened and why is it meaningful?
        </h3>
      </div>
    </div>
  )
}