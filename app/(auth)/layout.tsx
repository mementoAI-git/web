"use client";

import { PropsWithChildren } from "react";
import CircleQuestionMarkIcon from "@/public/icon/circl-question-mark.svg";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen h-[90%] overflow-y-auto hide-scrollbar mx-auto w-full bg-surface">
      <header className="flex mx-auto w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-20 py-4 sm:py-6">
        <Logo />
        <button className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#0011661A] px-3 py-2 sm:px-4 sm:py-3 shadow-btn transition-all hover:shadow-lg">
          <CircleQuestionMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-geist text-sm sm:text-base font-bold text-grey-200 capitalize hidden sm:inline">
            Get Help
          </span>
        </button>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-20 py-8 sm:py-12 lg:py-20">
        {children}
      </main>
    </div>
  );
}
