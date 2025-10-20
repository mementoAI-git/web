"use client";

import AuthCheck from "@/views/AuthCheck";
import { PropsWithChildren } from "react";

export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-screen w-screen flex justify-center overflow-y-auto hide-scrollbar bg-background">
      <AuthCheck>
        <div className="py-[100px] mx-auto h-fit w-full max-w-[640px]">
          {children}
        </div>
      </AuthCheck>
    </div>
  );
}
