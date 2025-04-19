import family from "@/public/image/family.png"
import Image from "next/image"

function TopicItem() {
  return (
    <div className="relative overflow-hidden p-4 flex-1 min-h-60 min-w-60  rounded-2xl bg-[#EEEEFF]">
      <span className="font-bricolage text-[#101828] font-bold text-base">Family, friends and relationships.</span>
      <Image className="absolute -bottom-2 right-0 size-[163px] object-contain" src={family} alt="" />
    </div>
  )
}

export default function Topics() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-grey-600 font-semibold text-lg font-inter">
        <span>Browse conversations by topics</span>
        <span className="text-sm cursor-pointer">See all</span>
      </div>
      <div className="flex flex-wrap items-stretch gap-3">
        <TopicItem />
        <TopicItem />
      </div>
    </div>
  )
}