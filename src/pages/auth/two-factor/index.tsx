import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import { toast } from "sonner";
import AuthLayout from "../components/layout";

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
      icon={<ShieldCheck className="size-7 sm:size-8" strokeWidth={1.75} aria-hidden />}
      subtitle="Enter the 6-digit code from your authenticator app."
      footer={
        <button
          type="button"
          className="font-inter text-sm text-primary underline underline-offset-4"
          onClick={() => navigate("/login")}
        >
          Back to login
        </button>
      }
    >
      <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 rounded-xl px-0 text-center font-inter text-lg font-semibold tabular-nums sm:h-14 sm:text-xl"
                  aria-label={`Digit ${i + 1} of 6`}
                />
              ))}
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-full"
              disabled={code.join("").length < 6 || loading}
            >
              {loading ?
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </>
              : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
