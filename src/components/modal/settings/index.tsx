import { useState } from "react";
import { ModalCloseBtn } from "../modalLayout";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";
import General from "./general";
import Security from "./security";
import Beneficiary from "./beneficiary&group";
import Privacy from "./privacy";
import { GearIcon, Lock2Icon, ShieldIcon, UsersIcon } from "@/components/icons";
import { Sheet } from "react-modal-sheet";

const settings = {
  general: {
    label: "General",
    icon: <GearIcon strokeWidth={1.5} width={16.67} height={16.67} />,
    component: <General />,
  },
  security: {
    label: "Security",
    icon: <Lock2Icon strokeWidth={1.4} width={13.37} height={15} />,
    component: <Security />,
  },
  beneficiary: {
    label: "Beneficiary & Group",
    icon: <UsersIcon strokeWidth={1.5} width={16} height={15} />,
    component: <Beneficiary />,
  },
  privacy: {
    label: "Privacy & account",
    icon: <ShieldIcon strokeWidth={1.5} width={16} height={15} />,
    component: <Privacy />,
  },
} as const;

type SettingKey = keyof typeof settings;

export default function Settings({ isMobile }: { isMobile: boolean }) {
  const { close } = useModal();
  const [active, setActive] = useState<SettingKey>("general");
  return (
    <>
      <div className="relative hidden h-full max-h-[640px] w-full max-w-[953px] items-stretch rounded-3xl bg-white sm:flex">
        <ModalCloseBtn onClick={() => close?.("settings")} />
        <div className="flex max-w-[260px] flex-col gap-6 border-r border-black/5 px-6 py-[30px]">
          <span className="font-inter text-sm font-bold text-[#1E1E1E66]">Settings</span>
          <ul className="flex w-full flex-col gap-2">
            {(Object.entries(settings) as [SettingKey, (typeof settings)[SettingKey]][]).map(([key, setting]) => (
              <li
                key={key}
                onClick={() => setActive(key)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-950/4",
                  {
                    "bg-gray-950/4": active === key,
                  },
                )}
              >
                {setting.icon}
                <span
                  className={cn(
                    "font-inter text-sm font-medium capitalize text-gray-950/70",
                    {
                      "font-semibold text-gray-950/90": active === key,
                    },
                  )}
                >
                  {setting.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-[30px] hide-scrollbar">
          {settings[active].component}
        </div>
      </div>

      <Sheet
        detent="content"
        className="block !z-[100] sm:hidden"
        isOpen={isMobile}
        onClose={() => close?.("settings")}
        snapPoints={[1]}
        initialSnap={1}
      >
        <Sheet.Container className="relative bg-white hide-scrollbar">
          <Sheet.Header className="rounded-3xl bg-white" />
          <Sheet.Content className="hide-scrollbar bg-white px-4 pb-6">
            <ModalCloseBtn
              className="!relative ml-auto mb-2 !right-0 !top-0"
              onClick={() => close?.("settings")}
            />
            <div className="mb-4 space-y-4">
              <h4 className="modal-title mb-5 !text-4xl">Settings</h4>
              <div className="hide-scrollbar flex w-full gap-2 overflow-x-auto">
                {(Object.entries(settings) as [SettingKey, (typeof settings)[SettingKey]][]).map(([key, setting]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setActive(key)}
                    className={cn(
                      "shrink-0 rounded-full bg-black/4 px-3 py-2 text-sm font-semibold text-gray-900",
                      {
                        "flex items-center gap-1 justify-center bg-gray-950 text-white": active === key,
                      },
                    )}
                  >
                    {key === active ? setting.icon : null}
                    {setting.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 pb-[30px]">{settings[active].component}</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </>
  );
}

