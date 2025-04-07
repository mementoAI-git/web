"use client"

import { AuthFormLayout, AuthLoader } from "@/views/Auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import LockIcon from "@/public/icon/lock.svg"
import CheckIcon from "@/public/icon/check.svg"
import useSWRMutation from "swr/mutation"
import endpoint from "@/api/endpoint"
import { postFetcher } from "@/api/fetcher"
import { Button } from "@/components/Buttons"

export default function ConfirmEmail() {
  const params = useSearchParams()
  const router = useRouter()
  const { trigger, isMutating, data } = useSWRMutation(endpoint.verifyEmail, postFetcher)

  useEffect(() => {
    if (!params.has("token")) {
      router.push("/login")
    } else {
      trigger({ token: params.get("token") })
    }
  }, [])
  if (isMutating) {
    return <AuthLoader title="Verifying your email, Please wait..." />
  }
  if (data) {
    return <AuthFormLayout
      title="Email verified successfully"
      icon={<CheckIcon width={33.33} />}
      className="success"
      subtitle="Your email has been confirmed. Click on the continue button to complete your onboarding process"
    >
      <Button title="Continue" />
    </AuthFormLayout>
  }
  return (
    <AuthFormLayout
      title="Set new password"
      can_go_back
      icon={<LockIcon />}
      subtitle="Your new password must be different from previously used passwords on this platform."
    >
      {/* <SetPassword token={String(params.get("token"))} /> */}
    </AuthFormLayout>
  )
}