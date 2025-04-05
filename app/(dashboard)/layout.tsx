import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-white w-screen min-h-screen flex">
      <aside className="max-w-70 w-[20%] min-w-[250px] sidebar">
        <DashboardSideBar />
      </aside>
      <main className="flex-1">
        <DashboardHeader />
        <div className="w-full">
          <div className="w-[93%] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}