import Image from "next/image"
import questionIcon from "@/public/image/question.png"
import quizIcon from "@/public/image/lighten.png"
import { usePrompt } from "@/hooks/use-prompt"

interface IDailyPrompt {
  type: string
  title: string
  _id: string
}
export default function DailyPrompt({ type, title, _id }: IDailyPrompt) {
  const { push, set } = usePrompt()

  const handleReplyClick = () => {
    push("prompt")
    set("data", { title, prompt: _id, type })
  }
  return (
    <div className="rounded-2xl h-72.5 max-w-[368.5px] w-1/2 flex-1 p-8 flex group flex-col justify-between bg-grey-700 cursor-pointer">
      <Image className="size-16" src={type === "quiz" ? quizIcon : questionIcon} alt="" />
      <div>
        <span className="inline-block w-fit py-1 px-3 rounded-full bg-black/5 font-inter font-medium text-xs text-[#050709] uppercase mb-2">{type}</span>
        <div className="space-y-3">
          <span className="block text-grey-900 font-inter font-semibold ">{title}</span>
          <button onClick={handleReplyClick} className="hidden group-hover:block cursor-pointer rounded-full bg-secondary py-2 px-5 text-white font-inter disabled:bg-grey-500 disabled:text-grey-800 font-medium text-sm transition-all duration-500">Reply</button>
        </div>
      </div>
    </div>
  )
}