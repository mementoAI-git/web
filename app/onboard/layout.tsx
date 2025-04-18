"use client";

import { PropsWithChildren } from "react";
import Logo from "@/components/Logo";
import { OnboardSideBar } from "@/views/Onboard";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen w-screen bg-white">
      <header className="flex max-h-[96px] w-full max-w-[1440px] items-center justify-between px-20 py-6">
        <Logo />
      </header>
      <div className="border-t border-grey-100" />
      <main className="flex h-full max-w-[1440px]">
        <div className="flex min-h-[950px] flex-1 items-center justify-center p-12">
          {children}
        </div>
        <aside className="flex max-w-[446px] flex-1 flex-col justify-between border-l border-grey-100 px-4 py-8">
          <OnboardSideBar />
        </aside>
      </main>
    </div>
  );
}
