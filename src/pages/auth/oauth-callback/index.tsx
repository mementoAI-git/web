import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TimesIcon } from "@/components/icons";
import { Button } from "@/components/Buttons";
import { AuthLoader } from "@/components/auth-loader";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import type { IAuth } from "@/utility/interface";
import AuthLayout from "../components/layout";

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useStore();

  const { trigger, data, error, isMutating } = useFetcher(
    `${endpoint.oauth}${provider}`,
  );

  const code = searchParams.get("code");

  useEffect(() => {
    if (!code || !provider) {
      navigate("/login");
      return;
    }

    trigger({ code }).then(async (result) => {
      if (result?.data) {
        // Extract only the IAuth-shaped fields for the store
        const { access_token, refresh_token, expires_at, refresh_expires_at } =
          result.data as IAuth & { onboarded: boolean; onboarding_status: string };

        setAuth?.({ access_token, refresh_token, expires_at, refresh_expires_at });
        await clearCache();
        navigate(result.data?.onboarded ? "/overview" : "/onboard");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AuthLayout
        title="Sign in failed"
        className="error"
        icon={<TimesIcon width={32} height={32} />}
        subtitle={
          error?.message ??
          "We couldn't sign you in with that provider. Please try again."
        }
        can_go_back
      >
        <Button href="/login" title="Back to login" className="!rounded-full" />
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
