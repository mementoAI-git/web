"use client"

import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import Modal from "@/views/Modal";
import { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-white max-w-[1450px] mx-auto w-screen min-h-screen flex">
      <Modal />
      <aside className="max-w-70 w-[20%] min-w-[250px] sidebar">
        <DashboardSideBar />
      </aside>
      <main className="flex-1 border-grey-500 border-r">
        <DashboardHeader />
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}