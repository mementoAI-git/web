import questionImage from "@/public/image/question-2.png"
import Image from "next/image"
import Link from "next/link"

export default function CategoryPromptCard({ title, _id }) {
  return (
    <Link href={`/chat/reply/${_id}`} className="w-full p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 rounded-2xl bg-sand-2 border border-sand-4">
      <div className="flex items-start justify-between w-full sm:w-fit">
        <div className="size-18 sm:size-37 shrink-0 p-0 sm:p-6 flex items-center justify-center">
          <Image className="size-full shrink-0 object-contain" alt="Question icon" src={questionImage} />
        </div>
        <span className="text-gray-700 text-xs font-medium font-inter text-center inline-block rounded-full py-0.5 px-2.5 bg-sand-4 sm:hidden">
          Question
        </span>
      </div>
      <div className="space-y-2 sm:space-y-4">
        <button className="rounded-full cursor-pointer hover:scale-[97%] gap-[6px] hidden sm:flex items-center text-xs sm:text-sm border-[1.5px] text-sand-10 border-sand-10 px-3 py-1">
          Question
        </button>
        <h3 className="md:text-2xl font-canela text-sand-12">
          {title}
        </h3>
        <Link href={`/chat/reply/${_id}`} className="bg-transparent inline-block border border-[#84663366] cursor-pointer hover:scale-[95%] py-2 sm:py-2 px-4 rounded-full">
          <span className="text-sand-10 text-sm font-semibold">Reply question</span>
        </Link>
      </div>
    </Link>
  )
}