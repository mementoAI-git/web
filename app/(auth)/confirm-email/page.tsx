"use client";

import { ConfirmEmail } from "@/views/Auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ConfirmEmailPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!params.has("token")) {
      router.push("/login");
    }
  }, [params, router])
  return <ConfirmEmail email={params.get("email")} token={params.get("token")} />
}
