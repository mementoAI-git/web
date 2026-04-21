import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { startAuthentication } from "@simplewebauthn/browser";
import { Loader2 } from "lucide-react";
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

          toast.success(result?.message);
          setAuth?.(result.data);
          await clearCache();

          const redirectPath = searchParams.get("redirect");
          if (redirectPath && result?.data?.onboarded) {
            navigate(decodeURIComponent(redirectPath));
          } else {
            navigate(result?.data?.onboarded ? "/overview" : "/onboard");
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id, response: authResponse }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        toast.error(completeData?.message ?? "Passkey authentication failed");
        return;
      }

      toast.success(completeData?.message ?? "Logged in");
      setAuth?.(completeData.data);
      await clearCache();
      navigate(completeData.data?.onboarded ? "/overview" : "/onboard", { replace: true });
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
      title="Welcome back. Please login to continue"
      include_auth_socials
      footer={
        <span className="font-inter text-center text-gray-600">
          New user?
          <Link
            to="/register"
            className="font-inter text-sm font-bold text-blue-6 underline"
          >
            {" "}
            Create an account
          </Link>
        </span>
      }
    >
      <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/20 py-0">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="login-email" className="font-inter text-sm">
                Email
              </Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="johndoe@mail.com"
                className="rounded-[12px]"
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
              <Input
                id="login-password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={values.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="font-inter text-xs text-destructive">{errors.password}</p> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="remember_for_30_days" className="font-inter text-sm font-normal text-v3-text-strong">
                <Checkbox
                  id="remember_for_30_days"
                  checked={Boolean(values.remember_for_30_days)}
                  onCheckedChange={(checked) => handleValue("remember_for_30_days", Boolean(checked))}
                />
                Remember for 30 days
              </Label>
              <Link to="/forget-password" className="font-inter text-sm font-semibold text-primary underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="mt-1 w-full rounded-full" disabled={isMutating || passkeyLoading}>
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

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-v3-stroke-weak" />
        <span className="font-inter text-xs text-v3-text-weak">or</span>
        <div className="h-px flex-1 bg-v3-stroke-weak" />
      </div>

      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={passkeyLoading || isMutating}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-v3-stroke-weak bg-white px-4 py-3 font-inter text-sm font-medium text-v3-text-strong transition-colors hover:bg-v3-fill-weaker disabled:cursor-not-allowed disabled:opacity-60"
      >
        {passkeyLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
            <path d="M15.5 14H17a2 2 0 0 1 2 2v1" />
            <path d="M6.5 14H8a2 2 0 0 0 2-2v-1" />
            <path d="M12 14v7" />
            <path d="M9 21h6" />
          </svg>
        )}
        Sign in with a passkey
      </button>
    </AuthLayout>
  );
}
