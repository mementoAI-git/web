"use client";

import AuthCheck from "@/views/AuthCheck";
import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import Modal from "@/views/Modal";
import { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <AuthCheck>
      <div className="bg-white max-w-[1450px] mx-auto w-screen min-h-screen flex">
        <Modal />
        <DashboardSideBar />
        <main className="flex-1 border-grey-500 border-r">
          <DashboardHeader />
          <div className="w-full">
            <div className="mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthCheck>
  )
}
