"use client";

import { PropsWithChildren } from "react";
import CircleQuestionMarkIcon from "@/public/icon/circl-question-mark.svg";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen border-4 mx-auto w-screen bg-surface">
      <header className="flex max-h-[96px] w-full max-w-[1440px] items-center justify-between px-5 lg:px-20 py-6">
        <Logo />
        <button className="flex max-h-[48px] max-w-[133px] cursor-pointer items-center gap-1 rounded-lg border border-[#0011661A] p-4 shadow-btn">
          <CircleQuestionMarkIcon />
          <span className="font-geist text-base font-bold text-grey-200 capitalize">
            Get Help
          </span>
        </button>
      </header>
      <main className="mt-3 max-w-[1440px] py-20">{children}</main>
    </div>
  );
}
