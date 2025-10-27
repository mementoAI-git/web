"use client"

import { PropsWithChildren } from "react";
import { LogoV2 } from "@/components/Logo";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";

export default function PostLayout({ children }: PropsWithChildren) {
  const { auth, hydrated } = useStore()
  return (
    <div className="min-h-screen bg-background w-screen">
      <header className="flex max-h-[96px] border-b border-[#0011661A] w-full max-w-[1440px] items-center justify-between px-20 py-6">
        <LogoV2 />
        {
          !hydrated ?
            <div className="bg-gray-200 h-12 min-w-38 rounded-lg" /> :
            isEmpty(auth?.access_token) &&
            <button className="bg-primary text-white font-geist font-bold cursor-pointer rounded-lg px-4 h-12 flex justify-center items-center">
              Join Memento
            </button>
        }
      </header>
      <main className="p-8 mx-auto">
        <div className="max-w-235 mx-auto w-full">
          {children}
        </div>
      </main>
    </div >
  )
}