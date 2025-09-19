import Image from "next/image";
import diamond from "@/public/image/diamond.png"
import bg from "@/public/image/bg/4.png"

export default function UpgradePlan() {
  return (
    <div className="rounded-2xl relative py-3 sm:py-5 px-3 sm:px-4 flex gap-4 bg-black/5 border border-black/6">
      <Image src={bg} alt="BG" className="absolute object-cover top-0 right-0 left-0 size-full" />
      <Image src={diamond} width={61} height={61} className="size-[40px] md:size-[61px] shrink-0" alt="diamond" />
      <div className="flex-1 space-y-1 text-sm">
        <div className="text-secondary flex items-center justify-between w-full">
          <span className="font-canela text-xl text-[#1D2939]">Unlock more with Pro</span>
        </div>
        <span className="text-[#565C79] text-xs inline-block">
          Access more advanced model options and more storage with Memento Pro.
        </span>
        <div className="font-semibold mt-3 space-x-3">
          <span className="text-blue-7 font-inter text-sm inline-block cursor-pointer">Upgrade plan</span>
        </div>
      </div>
    </div>
  )
}