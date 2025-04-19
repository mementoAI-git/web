"use client"

import { AuthFormLayout, SetPassword } from "@/views/Auth";
import LockIcon from "@/public/icon/lock.svg"
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (!params.has("token")) {
      router.push("/forget-password")
    }
  }, [params, router])
  return (
    <AuthFormLayout
      title="Set new password"
      can_go_back
      icon={<LockIcon />}
      subtitle="Your new password must be different from previously used passwords on this platform."
    >
      <SetPassword token={String(params.get("token"))} />
    </AuthFormLayout>
  )
}