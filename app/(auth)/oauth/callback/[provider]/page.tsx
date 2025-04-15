"use client"

import endpoint from "@/api/endpoint"
import useFetcher from "@/hooks/use-fetcher";
import { AuthLoader } from "@/views/Auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const { provider } = useParams<{ provider: string }>()
  const { trigger } = useFetcher(`${endpoint.oauth}${provider}`)

  useEffect(() => {
    if (params.has("code")) {
      trigger({ code: params.get("code") })
        .then(data => router.replace("/overview"))
    }
  }, [])
  return (
    <AuthLoader title="Redirecting...." />
  )
}