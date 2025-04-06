"use client"

import endpoint from "@/api/endpoint"
import { postFetcher } from "@/api/fetcher"
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import useSWRMutation from "swr/mutation"

export default function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const { provider } = useParams<{ provider: string }>()
  const { trigger } = useSWRMutation(`${endpoint.oauth}${provider}`, postFetcher)

  useEffect(() => {
    if (params.has("code")) {
      trigger({ code: params.get("code") })
        .then(data => router.replace("/overview"))
    }
  }, [])
  return (
    <div>Redirecting....</div>
  )
}