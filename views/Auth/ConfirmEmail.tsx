"use client"

import { AuthFormLayout } from "./AuthFormLayout"
import { AuthLoader } from "./AuthLoader"
import TimesIcon from "@/public/icon/times.svg"
import CheckIcon from "@/public/icon/check.svg"
import { Button } from "@/components/Buttons"
import useSWRMutation from "swr/mutation"
import endpoint from "@/api/endpoint"
import { postFetcher } from "@/api/fetcher"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface IConfirmEmail {
  token: string | null
  email: string | null
}

export function ConfirmEmail({ email, token }: IConfirmEmail) {
  const router = useRouter()
  const { trigger, data, error } = useSWRMutation(endpoint.verifyEmail, postFetcher)
  const { trigger: sendLink, isMutating: sending } = useSWRMutation(endpoint.sendLink, postFetcher)

  const handleResendLink = () => {
    if (!email) {
      return router.push("/login")
    }
    return sendLink({ email, type: "verify" })
      .then(result => {
        router.push(`/verify-email?email=${result?.data?.email}`)
      })
      .catch(() => router.push("/login"))
  }

  useEffect(() => {
    if (token) {
      trigger({ token })
    }
  }, [token])

  if (error) {
    return (
      <AuthFormLayout
        title="Email Verification Failed"
        className="error"
        icon={<TimesIcon width={33.33} />}
        subtitle="We couldn’t verify your email. Please try again or request a new verification link."
      >
        <Button loading={sending} onClick={handleResendLink} title="Resend link" />
      </AuthFormLayout>
    )

  }
  if (data) {
    return (
      <AuthFormLayout
        title="Email verified successfully"
        icon={<CheckIcon width={33.33} />}
        className="success"
        subtitle="Your email has been confirmed. Click on the continue button to complete your onboarding process"
      >
        <Button href="/onboard/profile" title="Continue" />
      </AuthFormLayout>
    )
  }
  return <AuthLoader title="Verifying your email, Please wait..." />
}