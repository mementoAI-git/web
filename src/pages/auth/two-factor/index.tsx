import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Buttons";
import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import { toast } from "sonner";
import AuthLayout from "../components/layout";
import endpoint from "@/api/endpoint";

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useStore();

  const twoFaToken = searchParams.get("token") ?? "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!twoFaToken) navigate("/login", { replace: true });
    inputRefs.current[0]?.focus();
  }, [twoFaToken, navigate]);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 6) {
      setCode(digits);
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) return;

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint.verify2FALogin}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ two_fa_token: twoFaToken, code: fullCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.message ?? "Invalid code");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      toast.success(result?.message ?? "Logged in");
      setAuth?.(result.data);
      await clearCache();
      navigate(result.data?.onboarded ? "/overview" : "/onboard", { replace: true });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app."
      footer={
        <button
          type="button"
          className="font-inter text-sm text-gray-500 underline"
          onClick={() => navigate("/login")}
        >
          Back to login
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-full rounded-xl border border-v3-stroke-weak bg-white text-center font-inter text-xl font-semibold text-v3-text-strong outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
        <Button
          loading={loading}
          type="submit"
          title="Verify"
          className="mt-2 !rounded-full"
          disabled={code.join("").length < 6}
        />
      </form>
    </AuthLayout>
  );
}
