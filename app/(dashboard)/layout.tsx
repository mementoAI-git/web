import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-white w-screen min-h-screen flex">
      <aside className="max-w-70 w-full group sidebar">
        <DashboardSideBar />
      </aside>
      <main className="flex-1">
        <DashboardHeader />
        {children}
      </main>
    </div>
  )
}