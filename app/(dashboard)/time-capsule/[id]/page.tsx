"use client"

import endpoint from "@/api/endpoint";
import CapsuleDetails from "@/views/TimeCapsule/Details";
import CapsulesSidebar from "@/views/TimeCapsule/SideBar";
import { use } from "react";
import useSWR from "swr";

export default function CapsulePage({ params }) {
  const { id } = use(params) as { id: string };
  const { data } = useSWR(id ? `${endpoint.capsule}/${id}` : null)
  return (
    <div className="flex">
      <div className="flex-1 py-6 px-6">
        <CapsuleDetails data={data?.data} />
      </div>
      <div className="w-[29%] max-w-[333px] shrink-0">
        <CapsulesSidebar data={data?.data} />
      </div>
    </div>
  )
}