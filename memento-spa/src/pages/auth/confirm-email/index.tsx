"use client";

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckIcon, TimesIcon } from "@/components/icons";
import { Button } from "@/components/Buttons";
import { AuthLoader } from "@/components/auth-loader";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import AuthLayout from "../components/layout";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { unsetAuth, setAuth } = useStore();
  const { trigger, data, error } = useFetcher(endpoint.verifyEmail);
  const { trigger: sendLink, isMutating: sending } = useFetcher(
    endpoint.sendLink,
  );
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  const handleResendLink = () => {
    if (!email) {
      navigate("/login");
      return;
    }
    sendLink({ email, type: "verify" })
      .then((result) => {
        if (result?.data?.email) {
          navigate(`/verify-email?email=${result.data.email}`);
        }
      })
      .catch(() => navigate("/login"));
  };

  useEffect(() => {
    if (token) {
      trigger({ token })
        .then((res) => {
          unsetAuth?.();
          setAuth?.(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [token, trigger, unsetAuth, setAuth]);

  if (error) {
    return (
      <AuthLayout
        title="Email Verification Failed"
        className="error"
        icon={<TimesIcon width={32} height={32} />}
        subtitle="We couldn’t verify your email. Please try again or request a new verification link."
      >
        <Button loading={sending} onClick={handleResendLink} title="Resend link" />
      </AuthLayout>
    );
  }
  if (data) {
    return (
      <AuthLayout
        title="Email verified successfully"
        className="success"
        icon={<CheckIcon width={32} height={32} />}
        subtitle="Your email has been confirmed. Click on the continue button to complete your onboarding process"
      >
        <Button href="/onboard" title="Continue" className="!rounded-full" />
      </AuthLayout>
    );
  }
  return <AuthLoader title="Verifying your email, Please wait..." />;
}


