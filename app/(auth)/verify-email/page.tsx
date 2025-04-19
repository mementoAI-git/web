'use client';

import { Button } from "@/components/Buttons";
import { AuthFormLayout, AuthLoader } from "@/views/Auth";
import EvelopIcon from "@/public/icon/evelop.svg"
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { hashEmail } from "@/utility";

function VerifyMail() {
  const params = useSearchParams()
  const router = useRouter()

  const email = params.get("email")

  useEffect(() => {
    if (!email) {
      router.push('/login')
    }
  }, [email, router])
  return (
    <AuthFormLayout
      title="Verify your email"
      can_go_back
      icon={<EvelopIcon width={33.33} />}
      subtitle={`We’ve sent verification instructions to ${hashEmail(String(email))}. Please check your inbox or spam folders.`}
    >
      <Button title="Open Mailbox" />
    </AuthFormLayout>
  )
}

export default function VerifyMailPage() {
  return (
    <Suspense fallback={<AuthLoader title="Loading...." />}>
      <VerifyMail />
    </Suspense>
  )
}