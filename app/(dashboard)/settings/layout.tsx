"use client";

import SegmentedController from "@/components/SegmentedController";
import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

const segments = [
  { label: "My Profile", key: "/settings/profile" },
  { label: "Security", key: "/settings/security" },
  { label: "Notifications", key: "/settings/notifications" },
  { label: "Beneficiaries", key: "/settings/beneficiaries" }
]
export default function SettingLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div className="h-full w-[93%] max-w-[1160px] mx-auto lg:w-[93%] flex flex-col overflow-hidden">
      <div className="h-full px-2 sm:px-0 py-4 sm:py-6 lg:py-8">
        <div className="h-full flex flex-col gap-2 md:gap-6">
          <h4 className="page-title">Settings</h4>
          <div className="w-full hide-scrollbar overflow-x-auto">
            <SegmentedController segments={segments} initial={pathname} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}