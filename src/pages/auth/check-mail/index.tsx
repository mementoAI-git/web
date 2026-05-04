"use client";

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      icon={<Mail className="size-7 sm:size-8" strokeWidth={1.75} aria-hidden />}
      subtitle={`We’ve sent an email containing the password reset instructions to ${hashEmail(
        email || "",
      )}. Please check your inbox or spam folders.`}
    >
      <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <Button
            type="button"
            className="h-11 w-full rounded-full font-inter"
            onClick={() => email && openMailBox(email)}
          >
            Open mailbox
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
