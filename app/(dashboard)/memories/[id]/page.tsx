"use client"

import endpoint from "@/api/endpoint";
import MemoryDetails from "@/views/Memories/Details";
import MemoryDetailsSidebar from "@/views/Memories/DetailsSideBar";
import { use } from "react";
import useSWR from "swr";

export default function Memory({ params }) {
  const { id } = use(params) as { id: string };
  const { data } = useSWR(id ? `${endpoint.memories}/${id}` : null)
  return (
    <div className="flex">
      <div className="max-w-207 flex-1 py-6 px-6">
        <MemoryDetails memory={data?.data} />
      </div>
      <div className="w-[29%] max-w-[333px] shrink-0">
        <MemoryDetailsSidebar memory={data?.data} />
      </div>
    </div>
  );
}
