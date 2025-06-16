"use client";

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import AuthCheck from "@/views/AuthCheck";
import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import Modal from "@/views/Modal";
import { PropsWithChildren } from "react";
import useSWR from "swr";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { setUser } = useStore()
  useSWR(endpoint.profile, fetcher, {
    onSuccess(data) {
      if (data?.data) {
        setUser(data.data)
      }
    }
  })
  return (
    <AuthCheck>
      <div className="bg-white max-w-[1450px] mx-auto w-screen h-screen flex">
        <Modal />
        <DashboardSideBar />
        <main className="flex-1 flex flex-col border-grey-500 border-r h-screen">
          <DashboardHeader />
          <div className="size-full">
            <div className="mx-auto h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthCheck>
  )
}
