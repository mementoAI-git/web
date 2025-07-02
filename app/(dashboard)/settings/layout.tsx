import { PropsWithChildren } from "react";

export default function SettingLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-full w-full lg:w-[93%] flex flex-col overflow-hidden">
      <div className="flex-1 px-4 sm:px-6 lg:px-9 py-4 sm:py-6 lg:py-8 overflow-y-auto hide-scrollbar">
        {children}
      </div>
    </div>
  )
}