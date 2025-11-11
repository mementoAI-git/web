import { Outlet } from "react-router-dom";
import AuthCheck from "@/components/layouts/auth-check";
import { DashboardHeader } from "./component/dashboard-header";
import { useState } from "react";
import { DashboardSideBar } from "./component/dashboard-sidebar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <AuthCheck>
      <div className="bg-background w-full min-h-screen flex flex-col md:flex-row overflow-hidden hide-scrollbar dynamic-height">
        {/* <Modal /> */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 modal-overlay bg-[rgba(94,94,94,0.5)] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          transition-transform duration-300 ease-in-out md:transition-none w-full md:w-[22.3%] max-w-[322px]
        `}>
          <DashboardSideBar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden dynamic-height-content w-full md:w-auto">
          <DashboardHeader />
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </AuthCheck>
  );
}

