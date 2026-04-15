import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { startAuthentication } from "@simplewebauthn/browser";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/Buttons";
import { Checkbox, Passwordinput, Textinput } from "@/components/Form";
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

  const { handleSubmit, handleChange, values, getField } = useForm({
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
      } catch (err: any) {
        if (err && err.data?.requires_verification) {
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
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
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
      title="Login to continue"
      subtitle="Welcome back. Login to access your account"
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Textinput
          label="Email"
          placeholder="johndoe@mail.com"
          {...getField("email")}
          value={values.email}
        />
        <Passwordinput
          label="Password"
          {...getField("password")}
          value={values.password}
        />

        <div className="flex items-center justify-between font-inter text-sm">
          <Checkbox
            label="Remember for 30 days"
            name="remember_for_30_days"
            checked={values.remember_for_30_days}
            onChange={handleChange}
          />
          <Link to="/forget-password" className="cursor-pointer font-bold text-primary">
            Forgot password?
          </Link>
        </div>
        <Button
          loading={isMutating}
          type="submit"
          title="Login"
          className="mt-3 !rounded-full"
        />
      </form>

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
