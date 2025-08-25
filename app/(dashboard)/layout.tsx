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
      <div className="bg-background w-full min-h-screen flex flex-col md:flex-row overflow-hidden hide-scrollbar dynamic-height">
        <Modal />

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 modal-overlay bg-[rgba(94,94,94,0.5)] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Hidden on mobile by default, shown on lg+ */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          transition-transform duration-300 ease-in-out md:transition-none w-full max-w-[322px]
        `}>
          <DashboardSideBar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden dynamic-height-content w-full md:w-auto">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </AuthCheck>
  )
}