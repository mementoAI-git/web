"use client";

import { Button } from "@/components/Buttons";
import { AuthFormLayout } from "@/views/Auth";
import EvelopIcon from "@/public/icon/evelop.svg";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { hashEmail } from "@/utility";

export default function VerifyMailPage() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/login");
    }
  }, [email]);
  return (
    <AuthFormLayout
      title="Verify your email"
      can_go_back
      icon={<EvelopIcon width={33.33} />}
      subtitle={`We’ve sent verification instructions to ${hashEmail(String(email))}. Please check your inbox or spam folders.`}
    >
      <Button title="Open Mailbox" />
    </AuthFormLayout>
  );
}
