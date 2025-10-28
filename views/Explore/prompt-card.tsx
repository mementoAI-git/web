import Image from "next/image";
import LaunchIcon from "@/public/icon/launch.svg"
import { IPrompt } from "@/utility/interface";
import questionIcon from "@/public/image/question-2.png"
import Link from "next/link";

export default function PromptCard({ title, _id }: IPrompt) {
  return (
    <Link href={`/chat/reply/${_id}`} className="flex-1 size-full sm:min-w-83 flex gap-3 border border-sand-4 rounded-2xl p-3 sm:p-4">
      <div className="size-[56px] sm:size-[72px] flex justify-center items-center shrink-0">
        <Image src={questionIcon} className="size-[36.32px] sm:size-[46.7px] object-contain" alt="" />
      </div>
      <div className="flex-1 flex justify-between flex-col gap-3">
        <span className="font-garamond text-base sm:text-xl text-gray-950/90">{title}</span>
        <div className="text-sand-10 flex items-center gap-[6px] cursor-pointer">
          <span className="font-inter text-xs font-semibold">Continue</span>
          <div className="size-5 p-1">
            <LaunchIcon />
          </div>
        </div>
      </div>
    </Link>
  )
}