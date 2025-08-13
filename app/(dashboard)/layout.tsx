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
      <div className="bg-background w-full min-h-screen flex flex-col lg:flex-row overflow-hidden hide-scrollbar dynamic-height">
        <Modal />
        {sidebarOpen && (
          <div
            className="fixed inset-0 modal-overlay bg-[rgba(94,94,94,0.5)] z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <DashboardSideBar onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden dynamic-height-content">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </AuthCheck>
  )
}