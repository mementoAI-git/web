"use client";

import { PropsWithChildren } from "react";
import Logo from "@/components/Logo";
import { OnboardSideBar } from "@/views/Onboard";
import AuthCheck from "@/views/AuthCheck";

export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-screen w-full bg-white flex flex-col">
      <header className="flex max-h-[96px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-20 py-4 sm:py-6 mx-auto">
        <Logo />
      </header>
      <div className="border-t border-grey-100" />
      <main className="flex flex-col lg:flex-row items-stretch max-w-[1440px] w-full flex-1 mx-auto overflow-hidden">
        <div className="flex-1 flex justify-center sm:items-center p-4 sm:p-8 lg:p-12 h-full overflow-y-auto hide-scrollbar">
          <AuthCheck>
            {children}
          </AuthCheck>
        </div>
        <aside className="w-full hidden lg:flex lg:max-w-[446px] h-[300px] lg:h-full flex-shrink-0 flex-col justify-between border-t lg:border-t-0 lg:border-l border-grey-100 px-4 py-6 sm:py-8 pb-8 sm:pb-10 overflow-y-auto hide-scrollbar">
          <OnboardSideBar />
        </aside>
      </main>
    </div>
  );
}
