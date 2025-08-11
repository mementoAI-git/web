"use client"

import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import MemoryDetails from "@/views/Memories/Details";
import MemoryDetailsSidebar from "@/views/Memories/DetailsSideBar";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import useSWR from "swr";
import { addToRecentMemories } from "@/utility";
import { useStore } from "@/hooks/use-store";

export default function MemoryPage({ params }) {
  const { id } = use(params) as { id: string };
  const router = useRouter()
  const { user } = useStore()
  const { data, error, isLoading } = useSWR(id ? `${endpoint.memories}/${id}` : null)

  useEffect(() => {
    if (error && isEmpty(data) && !isLoading) {
      router.push("/memories")
    }
  }, [error, data, router, isLoading])

  // Track when memory is opened
  useEffect(() => {
    if (data?.data && !isLoading) {
      addToRecentMemories(data.data, user.email);
    }
  }, [data?.data, user.email, isLoading]);

  return (
    <div className="flex max-w-[1160px] mx-auto">
      <div className="flex-1 min-h-screen py-6 px-6">
        <MemoryDetails memory={data?.data} />
      </div>
      <div className="w-[29%] max-w-[333px] shrink-0">
        <MemoryDetailsSidebar memory={data?.data} />
      </div>
    </div>
  );
}
