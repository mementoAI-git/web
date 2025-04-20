"use client"

import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

export default function AuthCheck({ children }: PropsWithChildren) {
  const router = useRouter()
  const { auth, hydrated } = useStore()
  const [loading, setLoading] = useState(true);

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