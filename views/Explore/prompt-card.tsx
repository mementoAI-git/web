import image6 from "@/public/image/image-6.png"
import Image from "next/image";
import LaunchIcon from "@/public/icon/launch.svg"

export default function PromptCard() {
  return (
    <div className="flex-1 flex gap-3 items-stretch bg-sand-2 border border-sand-4 rounded-2xl p-4 pr-4">
      <div className="w-[193.5px] h-[176px] rounded-lg overflow-hidden relative">
        <div className="absolute top-2 left-2 rounded-full bg-gray-50 px-2 border border-gray-200">
          <span className="font-inter font-medium text-xs text-gray-700">Question</span>
        </div>
        <Image src={image6} className="size-full object-cover" alt="" />
      </div>
      <div className="flex-1 flex flex-col justify-end gap-3">
        <span className="font-georgia font-bold text-base text-sand-12">What are your career ambitions?</span>
        <div className="text-sand-10 flex items-center gap-[6px] cursor-pointer">
          <span className="font-inter text-xs font-semibold">Continue</span>
          <div className="size-5 p-1">
            <LaunchIcon />
          </div>
        </div>
      </div>
    </div>
  )
}