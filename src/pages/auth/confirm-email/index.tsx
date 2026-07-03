"use client";

import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CheckIcon, TimesIcon } from "@/components/icons";
import { AuthLoader } from "@/components/auth-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  }, [token, navigate]);

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
        title="Email verification failed"
        className="error"
        icon={<TimesIcon width={32} height={32} />}
        subtitle="We couldn’t verify your email. Please try again or request a new verification link."
      >
        <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
          <CardContent className="p-4 sm:p-5">
            <Button
              type="button"
              className="h-11 w-full rounded-full"
              disabled={sending}
              onClick={handleResendLink}
            >
              {sending ?
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              : "Resend link"}
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }
  if (data) {
    return (
      <AuthLayout
        title="Email verified successfully"
        className="success"
        icon={<CheckIcon width={32} height={32} />}
        subtitle="Your email has been confirmed. Continue to complete your onboarding."
      >
        <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
          <CardContent className="p-4 sm:p-5">
            <Button asChild className="h-11 w-full rounded-full">
              <Link to="/onboarding">Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }
  return <AuthLoader title="Verifying your email, please wait…" />;
}
