import { useModal } from "@/hooks/use-modal";

import TimesIcon from "@/public/icon/times.svg";
import ChevronDownIcon from "@/public/icon/chevron-down.svg"

import BackgroundMusic from "./BackgroudMusic";
import UpgradePlan from "./UpgradePlan";
import Temperament from "./Temperament";

export default function ChatSettings() {
  const { close } = useModal()
  return (
    <div className="size-full flex flex-1 justify-end items-end font-inter">
      <div className="w-120 size-fit max-h-full bg-white rounded-2xl py-6 border border-grey-500 flex flex-col gap-6">
        <div className="text-secondary flex items-center justify-between w-full px-6">
          <span className="font-semibold text-xl">Chat settings</span>
          <div onClick={() => close("chat-settings")} className="cursor-pointer">
            <TimesIcon width={12} height={12} />
          </div>
        </div>
        <div className="overflow-y-auto px-6 w-full overflow-hidden h-full flex flex-col gap-6">
          <UpgradePlan />
          <BackgroundMusic />
          <Temperament />
          <div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-secondary text-xl">Profile</span>
              <ChevronDownIcon width={12} height={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}