"use client"

import { Button } from "@/components/Buttons";
import { AuthFormLayout } from "@/views/Auth";
import EvelopIcon from "@/public/icon/evelop.svg"
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hashEmail, openMailBox } from "@/utility";

export default function CheckMailPage() {
  const params = useSearchParams()
  const router = useRouter()

  const email = params.get("email")

  useEffect(() => {
    if (!email) {
      router.push('/forget-password')
    }
  }, [email])
  return (
    <AuthFormLayout
      title="Check your inbox"
      can_go_back
      icon={<EvelopIcon width={33.33} />}
      subtitle={`We’ve sent an email containing the password reset instructions to ${hashEmail(email || "")}. Please check your inbox or spam folders.`}
    >
      <Button onClick={() => openMailBox(String(email))} title="Open Mailbox" />
    </AuthFormLayout>
  )
}