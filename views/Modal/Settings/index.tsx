import GearIcon from "@/public/icon/gear.svg"
import LockIcon from "@/public/icon/lock-2.svg"
import General from "./General";
import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import { useState } from "react";
import { cn } from "@/utility";
import Security from "./Security";
import { Sheet } from "react-modal-sheet";
import Beneficiary from "./Beneficiary";
import UserIcon from "@/public/icon/users.svg";

const settings = {
  general: {
    label: "General",
    icon: <GearIcon strokeWidth={1.5} width={16.67} height={16.67} />,
    component: <General />
  },
  security: {
    label: "Security",
    icon: <LockIcon strokeWidth={2} width={13.37} height={15} />,
    component: <Security />
  },
  beneficiary: {
    label: "Beneficiary",
    icon: <UserIcon strokeWidth={1.5} width={16} height={15} />,
    component: <Beneficiary />
  }
}

export default function Settings() {
  const { close } = useModal()
  const [active, setActive] = useState("general")
  return (
    <>
      <div className="w-full relative max-w-[953px] h-full max-h-[640px] bg-sand-1 items-stretch rounded-3xl hidden sm:flex">
        <ModalCloseBtn onClick={() => close("settings")} />
        <div className="w-full max-w-[260px] border-r border-black/5 px-6 py-[30px] flex flex-col gap-6">
          <span className="font-inter text-sm font-bold text-[#1E1E1E66]">Settings</span>
          <ul className="flex flex-col gap-2 w-full">
            {
              Object.entries(settings).map(([key, setting]) => (
                <li
                  onClick={() => setActive(key)}
                  key={key}
                  className={cn("flex text-gray-500 cursor-pointer hover:bg-gray-950/4 rounded-lg items-center gap-2 w-full py-2 px-3", { "bg-gray-950/4": active === key })}
                >
                  {setting.icon}
                  <span
                    className={cn("font-inter text-sm font-medium text-gray-950/70 capitalize", { "text-gray-950/90 font-semibold": active === key })}>{setting.label}</span>
                </li>
              ))
            }
          </ul>
        </div>
        <div className="flex-1 py-[30px] px-6">
          {settings[active].component}
        </div>
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close("settings")}
        snapPoints={[0.5, 0.75, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="bg-sand-1" >
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1 px-3 pb-6">
            <ModalCloseBtn className="!relative ml-auto !right-0 !top-0 mb-2" onClick={() => close("settings")} />
            <h4 className="modal-title mb-5 !text-4xl">
              Settings
            </h4>
            <div className="flex w-full my-5 flex-nowrap overflow-x-auto gap-2">
              {
                Object.entries(settings).map(([key, setting]) => (
                  <div
                    onClick={() => setActive(key)}
                    className={cn("shrink-0 py-2 px-3 bg-black/4 text-gray-900 text-sm font-semibold rounded-full", { "bg-gray-950 text-white flex items-center gap-1 justify-center": active === key })}
                    key={key}
                  >
                    {key === active ? setting.icon : null}
                    {setting.label}
                  </div>
                ))
              }
            </div>
            <div className="flex-1 py-[30px]">
              {settings[active].component}
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </>
  )
}