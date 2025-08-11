"use client";

import SegmentedController from "@/components/SegmentedController";
import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/utility";

const segments = [
  { label: "My Profile", key: "/settings/profile" },
  { label: "Security", key: "/settings/security" },
  { label: "Notifications", key: "/settings/notifications" },
  { label: "Beneficiaries", key: "/settings/beneficiaries" }
]
export default function SettingLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div className="page-viewport hide-scrollbar  mx-auto overflow-hidden">
      <div className="h-full px-2 sm:px-0 py-4 sm:py-6 lg:py-8">
        <div className={cn("h-full flex flex-col gap-2 sm:gap-4 md:gap-6")}>
          <h4 className="page-title text-lg sm:text-xl md:text-2xl">Settings</h4>
          <div className="w-full hide-scrollbar overflow-x-auto pb-2 sm:pb-0">
            <SegmentedController segments={segments} initial={pathname} />
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar mt-2 sm:mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}