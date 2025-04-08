"use client"

import { PropsWithChildren } from "react";
import Logo from "@/components/Logo";
import { OnboardSideBar } from "@/views/Onboard";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-white w-screen min-h-screen">
      <header className="max-w-[1440px] max-h-[96px] py-6 px-20 flex justify-between items-center w-full">
        <Logo />
      </header>
      <div className="border-t border-grey-100" />
      <main className="h-full flex max-w-[1440px]">
        <div className="flex-1 flex min-h-screen p-12 justify-center items-center">
          {children}
        </div>
        <aside className="max-w-[446px] px-4 py-8 flex flex-col justify-between flex-1 border-l border-grey-100">
          <OnboardSideBar />
        </aside>
      </main>
    </div>
  )
}