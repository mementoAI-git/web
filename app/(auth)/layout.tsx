"use client";

import { PropsWithChildren } from "react";
import { LogoV2 } from "@/components/Logo";
import Image from "next/image";
import bg5 from "@/public/image/bg/5.png"

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen h-[90%] relative">
      <Image src={bg5} alt="Cloudy BG" className="absolute top-0 bottom-0 left-0 right-0 mx-auto " />
      <div className="absolute size-full top-0 right-0 bottom-0 left-0 overflow-y-auto hide-scrollbar">
        <header className="flex mx-auto w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-20 py-4 sm:py-6">
          <LogoV2 />
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-20 py-8 sm:py-12 lg:py-20">
          {children}
        </main>
      </div>
    </div>
  );
}
