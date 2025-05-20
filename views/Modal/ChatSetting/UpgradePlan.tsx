import Image from "next/image";
import diamond from "@/public/image/diamond.png"
import TimesIcon from "@/public/icon/times.svg";

export default function UpgradePlan() {
  return (
    <div className="rounded-2xl py-5 px-4 flex gap-4 border border-black/6">
      <Image src={diamond} width={61} height={61} className="size-[61px] shrink-0" alt="diamond" />
      <div className="flex-1 space-y-3 text-sm">
        <div className="text-secondary flex items-center justify-between w-full">
          <span className="font-semibold">Unlock more with Pro</span>
          <TimesIcon width={10} height={10} />
        </div>
        <span className="text-[#565C79] inline-block">
          Access more advanced model options and more storage with Memento Pro.
        </span>
        <div className="font-semibold space-x-3">
          <span className="text-grey-600 inline-block cursor-pointer">Dismiss</span>
          <span className="text-primary inline-block cursor-pointer">Upgrade plan</span>
        </div>
      </div>
    </div>
  )
}