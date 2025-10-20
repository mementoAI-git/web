"use client"

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import useSWR from "swr";

export default function AuthCheck({ children }: PropsWithChildren) {
  const router = useRouter()
  const { auth, hydrated, setUser } = useStore()
  const [loading, setLoading] = useState(true);

  useSWR(endpoint.profile, fetcher, {
    onSuccess(data) {
      if (data?.data) {
        setUser(data.data)
      }
    }
  })

  useEffect(() => {
    if (!hydrated) return;
    if (isEmpty(auth?.access_token) || dayjs().isAfter(auth.expires_at)) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [auth, hydrated, router]);

  if (!hydrated || loading) {
    return null
  }

  return children
}