"use client";

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import AuthCheck from "@/views/AuthCheck";
import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import Modal from "@/views/Modal";
import { PropsWithChildren, useState } from "react";
import useSWR from "swr";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { setUser } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useSWR(endpoint.profile, fetcher, {
    onSuccess(data) {
      if (data?.data) {
        setUser(data.data)
      }
    }
  })

  return (
    <AuthCheck>
      <div className="bg-white w-full h-screen flex flex-col lg:flex-row overflow-hidden">
        <Modal />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 modal-overlay bg-[rgba(94,94,94,0.5)] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <DashboardSideBar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:border-l border-grey-500 overflow-hidden">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </AuthCheck>
  )
}
