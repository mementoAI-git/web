import { clearReferral, getReferralCode } from "@/features/referrals/attribution";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TimesIcon } from "@/components/icons";
import { AuthLoader } from "@/components/auth-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import { authRedirect } from "@/utility/auth-redirect";
import AuthLayout from "../components/layout";
import { extractSession, normalizeApiError } from "@/api/contract-adapter";

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useStore();

  const { trigger, data, error, isMutating } = useFetcher(
    `${endpoint.oauth}${provider}`,
  );

  const code = searchParams.get("code");
  const started = useRef(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !provider) {
      navigate("/login");
      return;
    }

    if (started.current) return;
    started.current = true;
    trigger({ code, referral_code: getReferralCode() })
      .then(async (result) => {
        // Accounts with two-factor authentication still need their code, as at login.
        const pending = result?.data as { requires_2fa?: boolean; two_fa_token?: string } | undefined;
        if (pending?.requires_2fa && pending.two_fa_token) {
          clearReferral();
          const params = new URLSearchParams({ token: pending.two_fa_token, redirect: authRedirect(null) });
          navigate(`/two-factor?${params.toString()}`);
          return;
        }
        const session = extractSession(result);
        if (result?.success === false || !session)
          throw new Error("Authentication session is missing");
        clearReferral();
        setAuth?.(session);
        await clearCache();
        navigate(session.onboarded ? "/overview" : "/onboarding");
      })
      .catch((error: unknown) => {
        setCallbackError(normalizeApiError(error).message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error || callbackError) {
    return (
      <AuthLayout
        title="Sign in failed"
        className="error"
        icon={<TimesIcon width={32} height={32} />}
        subtitle={
          callbackError ?? normalizeApiError(error).message
        }
      >
        <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
          <CardContent className="p-4 sm:p-5">
            <Button asChild className="h-11 w-full rounded-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLoader
      title={
        isMutating || !data
          ? `Signing you in with ${provider ?? "SSO"}…`
          : "Sign in successful. Redirecting…"
      }
    />
  );
}
