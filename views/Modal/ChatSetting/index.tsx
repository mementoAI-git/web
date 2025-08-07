import { useModal } from "@/hooks/use-modal";

import TimesIcon from "@/public/icon/times.svg";
import ChevronDownIcon from "@/public/icon/chevron-down.svg"

import BackgroundMusic from "./BackgroudMusic";
import UpgradePlan from "./UpgradePlan";
import Temperament from "./Temperament";

export default function ChatSettings() {
  const { close } = useModal()
  return (
    <div className="size-full flex flex-1 justify-end items-end font-inter p-4 sm:p-6">
      <div className="w-full sm:w-96 md:w-120 size-fit max-h-full bg-white rounded-2xl py-4 sm:py-6 border border-grey-500 flex flex-col gap-4 sm:gap-6">
        <div className="text-secondary flex items-center justify-between w-full px-4 sm:px-6">
          <span className="font-semibold text-lg sm:text-xl">Chat settings</span>
          <div onClick={() => close("chat-settings")} className="cursor-pointer p-1">
            <TimesIcon width={12} height={12} />
          </div>
        </div>
        <div className="overflow-y-auto px-4 sm:px-6 w-full overflow-hidden h-full flex flex-col gap-4 sm:gap-6">
          <UpgradePlan />
          <BackgroundMusic />
          <Temperament />
          <div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-secondary text-lg sm:text-xl">Profile</span>
              <ChevronDownIcon width={12} height={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}