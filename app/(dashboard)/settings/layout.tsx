import { PropsWithChildren } from "react";

export default function SettingLayout({ children }: PropsWithChildren) {
  return (
    <div className="px-9 h-page w-[93%]">
      <div className="py-8 size-full overflow-y-auto hide-scrollbar">
        {children}
      </div>
    </div>
  )
}