"use client";

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Buttons";
import { hashEmail, openMailBox } from "@/utility";
import AuthLayout from "../components/layout";

export default function CheckMailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      navigate("/forget-password");
    }
  }, [email, navigate]);

  return (
    <AuthLayout
      title="Check your inbox"
      can_go_back
      subtitle={`We’ve sent an email containing the password reset instructions to ${hashEmail(
        email || "",
      )}. Please check your inbox or spam folders.`}
    >
      <Button
        className="!rounded-full"
        onClick={() => email && openMailBox(email)}
        title="Open Mailbox"
      />
    </AuthLayout>
  );
}


