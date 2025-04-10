import family from "@/public/image/family.png"
import Image from "next/image"

export default function Topics() {
  return (
    <div className="relative overflow-hidden p-4 flex-1 min-h-60 min-w-60  rounded-2xl bg-[#EEEEFF]">
      <span className="font-bricolage text-[#101828] font-bold text-base">Family, friends and relationships.</span>
      <Image className="absolute -bottom-2 right-0 size-[163px] object-contain" src={family} alt="" />
    </div>
  )
}