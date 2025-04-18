"use client";

import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import Modal from "@/views/Modal";
import { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto flex min-h-screen w-screen max-w-[1450px] bg-white">
      <Modal />
      <aside className="sidebar w-[20%] max-w-70 min-w-[250px]">
        <DashboardSideBar />
      </aside>
      <main className="flex-1 border-r border-grey-500">
        <DashboardHeader />
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
