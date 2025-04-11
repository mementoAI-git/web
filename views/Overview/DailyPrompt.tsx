import Image from "next/image"
import questionIcon from "@/public/image/question.png"
import quizIcon from "@/public/image/lighten.png"

interface IDailyPrompt {
  onClick?: () => void,
  type: string
}
export default function DailyPrompt({ onClick, type }: IDailyPrompt) {
  return (
    <div className="rounded-2xl h-72.5 max-w-[368.5px] w-1/2 flex-1 p-8 flex group flex-col justify-between bg-grey-700 cursor-pointer">
      <Image className="size-16" src={type === "quiz" ? quizIcon : questionIcon} alt="" />
      <div>
        <span className="inline-block w-fit py-1 px-3 rounded-full bg-black/5 font-inter font-medium text-xs text-[#050709] uppercase mb-2">{type}</span>
        <div className="space-y-3">
          <span className="block text-grey-900 font-inter font-semibold ">What is one of your earliest childhood memories?</span>
          <button onClick={onClick} className="group-hover:block hidden btn disabled:bg-grey-500 disabled:text-grey-800 font-medium text-sm transition-all duration-500">Reply</button>
        </div>
      </div>
    </div>
  )
}