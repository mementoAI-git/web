import { PropsWithChildren } from "react";

export default function SettingLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-full w-full max-w-[1160px] mx-auto lg:w-[93%] flex flex-col overflow-hidden">
      <div className="flex-1 py-4 sm:py-6 lg:py-8 overflow-y-auto hide-scrollbar">
        {children}
      </div>
    </div>
  )
}