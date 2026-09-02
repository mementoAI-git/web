import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { startAuthentication } from "@simplewebauthn/browser";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
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
import AuthLayout from "../components/layout";
import AuthSocials from "../components/auth-social";
import { TypographyMuted } from "@/components/ui/typography";
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
            navigate(`/two-factor?token=${result.data.two_fa_token}`);
            return;
          }

          const session = extractSession(result);
          if (!session) throw new Error("Authentication session is missing");
          toast.success(result?.message);
          setAuth?.(session);
          await clearCache();

          const redirectPath = searchParams.get("redirect");
          if (redirectPath && session.onboarded) {
            navigate(decodeURIComponent(redirectPath));
          } else {
            navigate(session.onboarded ? "/overview" : "/onboarding");
          }
        }
      } catch (err) {
        const e = err as { data?: { requires_verification?: boolean } } | null;
        if (e && e.data?.requires_verification) {
          navigate(`/verify-email?email=${payload.email}`);
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
      const completeRes = await fetch(`${API_BASE}${endpoint.passkeyLoginComplete}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getMementoClientHeaders(),
        },
        body: JSON.stringify({ challenge_id, response: authResponse }),
      });
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
      navigate(session.onboarded ? "/overview" : "/onboarding", { replace: true });
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
    <AuthLayout
      title="Welcome back"
      subtitle="Please login to continue"
      footer={
        <TypographyMuted className="text-center font-inter text-xs text-v3-text-weak">
          New user?
          <Link
            to="/register"
            className="font-inter text-xs font-semibold text-primary underline underline-offset-2"
          >
            {" "}
            Create an account
          </Link>
        </TypographyMuted>
      }
    >
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={passkeyLoading || isMutating}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-v3-stroke-weak bg-white px-4 font-inter text-sm font-medium text-v3-text-strong transition-colors hover:bg-v3-fill-weaker disabled:cursor-not-allowed disabled:opacity-60"
        >
          {passkeyLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Fingerprint className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
          Sign in with a passkey
        </button>
        <AuthSocials showDivider={false} />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-v3-stroke-weak" />
        <span className="font-inter text-xs text-v3-text-weak">or</span>
        <div className="h-px flex-1 bg-v3-stroke-weak" />
      </div>

      <Card className="rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
        <CardContent className="w-full p-0">
          <form onSubmit={handleSubmit} className="box-content flex flex-col gap-3.5 px-0.5">
            <div className="grid gap-2">
              <Label htmlFor="login-email" className="font-inter text-sm">
                Email
              </Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="johndoe@mail.com"
                className="rounded-[8px]"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="font-inter text-xs text-destructive">{errors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-password" className="font-inter text-sm">
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
                  className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-v3-text-weak transition-colors hover:bg-v3-fill-weaker hover:text-v3-text-strong"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ?
                    <EyeOff className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  : <Eye className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
                </button>
              </div>
              {errors.password ? <p className="font-inter text-xs text-destructive">{errors.password}</p> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="remember_for_30_days" className="font-inter text-xs font-normal text-v3-text-strong">
                <Checkbox
                  id="remember_for_30_days"
                  checked={Boolean(values.remember_for_30_days)}
                  onCheckedChange={(checked) => handleValue("remember_for_30_days", Boolean(checked))}
                />
                Remember for 30 days
              </Label>
              <Link
                to="/forget-password"
                className="flex font-inter text-xs font-semibold text-primary underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-[8px] bg-v3-brand-strong text-white hover:bg-v3-brand-strong/90"
              disabled={isMutating || passkeyLoading}
            >
              {isMutating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
