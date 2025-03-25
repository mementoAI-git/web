import { PropsWithChildren } from "react";
import CircleQuestionMarkIcon from "@/public/icon/circl-question-mark.svg"
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-surface w-screen min-h-screen">
      <header className="max-w-[1440px] max-h-[96px] py-6 px-20 flex justify-between items-center w-full">
        <Logo />
        <button className="border cursor-pointer flex items-center shadow-btn gap-1 p-4 max-w-[133px] max-h-[48px] border-[#0011661A] rounded-lg">
          <CircleQuestionMarkIcon />
          <span className="font-bold capitalize font-geist text-grey-200 text-base">Get Help</span>
        </button>
      </header>
      <main className="py-20 max-w-[1440px]">
        {children}
      </main>
    </div>
  )
}