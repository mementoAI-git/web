"use client";

import { PropsWithChildren } from "react";
import Logo from "@/components/Logo";
import { OnboardSideBar } from "@/views/Onboard";
import AuthCheck from "@/views/AuthCheck";

export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-screen w-screen bg-white">
      <header className="flex max-h-[96px] w-full max-w-[1440px] items-center justify-between px-20 py-6">
        <Logo />
      </header>
      <div className="border-t border-grey-100" />
      <main style={{ height: "calc(100vh - 96px)" }} className="mx-auto overflow-y-auto hide-scrollbar flex items-stretch max-w-[1440px]">
        <div className="flex-1 flex h-screen p-12 justify-center items-center">
          <AuthCheck>
            {children}
          </AuthCheck>
        </div>
        <aside className="flex max-w-[446px] h-screen flex-1 flex-col justify-between border-l border-grey-100 px-4 py-8 pb-10">
          <OnboardSideBar />
        </aside>
      </main>
    </div>
  );
}
