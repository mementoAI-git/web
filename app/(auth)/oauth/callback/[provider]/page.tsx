"use client";

import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { AuthLoader } from "@/views/Auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Callback() {
  const { setAuth } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const { provider } = useParams<{ provider: string }>();
  const { trigger } = useFetcher(`${endpoint.oauth}${provider}`);

  useEffect(() => {
    if (params.has("code")) {
      trigger({ code: params.get("code") }).then((result) => {
        setAuth(result.data);
        router.replace("/overview");
      });
    }
  }, [params, router, trigger, setAuth])
  return (
    <AuthLoader title="Redirecting...." />
  )
}
