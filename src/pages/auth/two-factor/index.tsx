import { authRedirect } from "@/utility/auth-redirect";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import { toast } from "sonner";
import AuthEntryLayout from "../components/entry-layout";
import { AuthFieldMotion } from "../components/auth-motion";
import { extractSession } from "@/api/contract-adapter";
import { getMementoClientHeaders } from "@/api/client-metadata";

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useStore();

  const twoFaToken = searchParams.get("token") ?? "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
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
    if (pending.current || !twoFaToken || fullCode.length < 6) return;
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint.verify2FALogin}`, {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getMementoClientHeaders(),
        },
        body: JSON.stringify({ two_fa_token: twoFaToken, code: fullCode }),
      });
      const result = await res.json();
      if (controller.signal.aborted) return;
      if (!res.ok || result?.success === false) {
        toast.error(result?.message ?? "Invalid code");
        if (res.status === 400 || res.status === 401) setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      const session = extractSession(result);
      if (!session) throw new Error("Authentication session is missing");
      toast.success(result?.message ?? "Logged in");
      setAuth?.(session);
      await clearCache().catch(() => undefined);
      if (controller.signal.aborted) return;
      navigate(session.onboarded ? authRedirect(searchParams.get("redirect")) : "/onboarding", { replace: true });
    } catch {
      if (!controller.signal.aborted) toast.error("Something went wrong. Please try again.");
    } finally {
      pending.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <AuthEntryLayout
      title={<>Two-factor <em>authentication</em></>}
      recovery
      subtitle="Enter the 6-digit code from your authenticator app."
    >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <fieldset disabled={loading} className="min-w-0" onPaste={handlePaste}>
              <legend className="sr-only">Six-digit authenticator code</legend>
              <AuthFieldMotion className="auth-recovery-code flex gap-2 px-4">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="min-w-0 flex-1 rounded-[10px] text-center tabular-nums"
                  onFocus={(event) => event.target.select()}
                  aria-label={`Digit ${i + 1} of 6`}
                />
              ))}
              </AuthFieldMotion>
            </fieldset>
            <Button
              type="submit"
              className="h-11 w-full rounded-lg"
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
    </AuthEntryLayout>
  );
}
