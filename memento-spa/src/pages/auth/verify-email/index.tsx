"use client";

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Buttons";
import AuthLayout from "../components/layout";
import { hashEmail, openMailBox } from "@/utility";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  return (
    <AuthLayout
      title="Verify your email"
      can_go_back
      subtitle={`We’ve sent verification instructions to ${hashEmail(
        String(email),
      )}. Please check your inbox or spam folders.`}
    >
      <Button
        title="Open Mailbox"
        className="!rounded-full"
        onClick={() => email && openMailBox(email)}
      />
    </AuthLayout>
  );
}


