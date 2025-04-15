"use client"

import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { DashboardHeader, DashboardSideBar } from "@/views/Dashboard";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";
import useSWR from "swr";

export default function DashboardLayout({ children }: PropsWithChildren) {
  // const { auth, setUser } = useStore()
  // const router = useRouter()
  // const { data } = useSWR(auth?.access_token ? endpoint.profile : null)

  // useEffect(() => {
  //   if (isEmpty(auth?.access_token)) {
  //     return router.push("/login")
  //   }
  //   if (!isEmpty(data?.data)) {
  //     setUser(data.data)
  //   }

  // }, [data?.data, auth])
  return (
    <div className="bg-white max-w-[1450px] mx-auto w-screen min-h-screen flex">
      <aside className="max-w-70 w-[20%] min-w-[250px] sidebar">
        <DashboardSideBar />
      </aside>
      <main className="flex-1 border-grey-500 border-r">
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