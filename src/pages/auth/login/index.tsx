import { authRedirect } from "@/utility/auth-redirect";
import { AuthFieldMotion, PasswordVisibilityIcon } from "../components/auth-motion";
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import { clearCache } from "@/utility";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";
import * as yup from "yup";
import AuthEntryLayout from "../components/entry-layout";
import PasswordResetSuccess from "../components/password-reset-success";
import AuthSocials from "../components/auth-social";

import { extractSession } from "@/api/contract-adapter";
import { getMementoClientHeaders } from "@/api/client-metadata";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  password: yup.string().required("Password is required"),
  remember_for_30_days: yup.boolean().default(false),
});

const initial = {
  email: "",
  password: "",
  remember_for_30_days: false,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccessful = location.state?.passwordReset === true;
  const [searchParams] = useSearchParams();
  const { setAuth } = useStore();
  const { trigger, isMutating } = useFetcher(endpoint.login);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { handleSubmit, handleChange, handleValue, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      try {
        const result = await trigger(payload);
        if (result?.data) {
          // 2FA required — redirect to code entry page
          if (result.data.requires_2fa) {
            const params = new URLSearchParams({ token: result.data.two_fa_token, redirect: authRedirect(searchParams.get("redirect")) });
            navigate(`/two-factor?${params.toString()}`);
            return;
          }

          const session = extractSession(result);
          if (!session) throw new Error("Authentication session is missing");
          toast.success(result?.message);
          setAuth?.(session);
          await clearCache();

          const redirectPath = searchParams.get("redirect");
          if (redirectPath && session.onboarded) {
            navigate(authRedirect(redirectPath), { replace: true });
          } else {
            navigate(session.onboarded ? "/overview" : "/onboarding");
          }
        }
      } catch (err) {
        const e = err as { data?: { requires_verification?: boolean } } | null;
        if (e && e.data?.requires_verification) {
          navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
        }
      }
    },
  });

  async function handlePasskeyLogin() {
    setPasskeyLoading(true);
    try {
      // 1. Get authentication options from server
      const beginRes = await fetch(`${API_BASE}${endpoint.passkeyLoginBegin}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getMementoClientHeaders(),
        },
        body: JSON.stringify({ email: values.email || undefined }),
      });
      const beginData = await beginRes.json();
      if (!beginRes.ok) {
        toast.error(beginData?.message ?? "Could not start passkey login");
        return;
      }

      const { challenge_id, ...options } = beginData.data;

      // 2. Browser prompts biometric / device passkey
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 3. Complete verification on server
      const completeRes = await fetch(
        `${API_BASE}${endpoint.passkeyLoginComplete}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getMementoClientHeaders(),
          },
          body: JSON.stringify({ challenge_id, response: authResponse }),
        },
      );
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        toast.error(completeData?.message ?? "Passkey authentication failed");
        return;
      }

      const session = extractSession(completeData);
      if (!session) throw new Error("Authentication session is missing");
      toast.success(completeData?.message ?? "Logged in");
      setAuth?.(session);
      await clearCache();
      navigate(session.onboarded ? authRedirect(searchParams.get("redirect")) : "/onboarding", {
        replace: true,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        // User cancelled the biometric prompt — silent
        return;
      }
      toast.error("Passkey login failed. Try signing in with your password.");
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <>
      <AuthEntryLayout
        title={
          <>
            Welcome <em>back</em>
          </>
        }
        subtitle="Please sign in to continue"
        footer={
          <Link to="/register" className="rounded-lg px-6 py-3 hover:underline">
            I don’t have an account
          </Link>
        }
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={passkeyLoading || isMutating}
            className="auth-entry-passkey flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-stroke-neutral-weak bg-bg-neutral px-4 font-geist text-sm font-medium text-text-neutral-strong transition-colors hover:bg-bg-neutral-weaker disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passkeyLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Fingerprint
                className="size-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
            )}
            Sign in with a passkey
          </button>
          <AuthSocials showDivider={false} />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-stroke-neutral-weak" />
          <span className="font-geist text-xs text-text-neutral-weak">or</span>
          <div className="h-px flex-1 bg-stroke-neutral-weak" />
        </div>

        <Card className="overflow-visible rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
          <CardContent className="w-full p-0">
            <form
              onSubmit={handleSubmit}
              className="box-content flex flex-col gap-3"
            >
              <AuthFieldMotion error={errors.email} className="grid gap-1.5">
                <Label htmlFor="login-email" className="font-geist text-sm">
                  Email
                </Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="janedoe@mail.com"
                  className="rounded-[8px]"
                  value={values.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? (
                  <p className="font-geist text-xs text-destructive">
                    {errors.email}
                  </p>
                ) : null}
              </AuthFieldMotion>

              <AuthFieldMotion error={errors.password} className="grid gap-1.5">
                <Label htmlFor="login-password" className="font-geist text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="rounded-[8px] pr-11"
                    value={values.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.password)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-text-neutral-weak transition-colors hover:bg-fill-neutral-weaker hover:text-text-neutral-strong"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <PasswordVisibilityIcon visible={showPassword} />
                  </button>
                </div>
                {errors.password ? (
                  <p className="font-geist text-xs text-destructive">
                    {errors.password}
                  </p>
                ) : null}
              </AuthFieldMotion>

              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="remember_for_30_days"
                  className="font-geist text-xs font-normal text-text-neutral-strong"
                >
                  <Checkbox
                    id="remember_for_30_days"
                    checked={Boolean(values.remember_for_30_days)}
                    onCheckedChange={(checked) =>
                      handleValue("remember_for_30_days", Boolean(checked))
                    }
                  />
                  Remember for 30 days
                </Label>
                <Link
                  to="/forget-password"
                  className="flex font-geist text-xs font-semibold text-text-brand-strong underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-[8px] bg-fill-brand-strong text-text-inverse-strong hover:opacity-90"
                disabled={isMutating || passkeyLoading}
              >
                {isMutating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </AuthEntryLayout>
      <PasswordResetSuccess
        open={resetSuccessful}
        onOpenChange={(open) => {
          if (!open)
            navigate(`${location.pathname}${location.search}`, {
              replace: true,
              state: { ...location.state, passwordReset: false },
            });
        }}
      />
    </>
  );
}
