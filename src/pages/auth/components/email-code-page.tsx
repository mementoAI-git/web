import { AuthFieldMotion } from "./auth-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { reportFetcherError } from "@/api/report-fetcher-error";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFetcher from "@/hooks/use-fetcher";
import AuthEntryLayout from "./entry-layout";
import { extractSession } from "@/api/contract-adapter";
import { useStore } from "@/hooks/use-store";

const emptyCode = () => Array<string>(6).fill("");

export default function EmailCodePage({ purpose }: { purpose: "recovery" | "verification" }) {
  const [params] = useSearchParams();
  return <EmailCodeForm key={`${purpose}:${params.get("email")}`} purpose={purpose} />;
}

function EmailCodeForm({
  purpose,
}: {
  purpose: "recovery" | "verification";
}) {
  const isVerification = purpose === "verification";
  const { setAuth } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState(emptyCode);
  const pending = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const [notice, setNotice] = useState("");
  const [resendAt, setResendAt] = useState(
    () =>
      Number(
        (isVerification
          ? location.state?.verificationSentAt
          : location.state?.recoverySentAt) || 0,
      ) + 60000,
  );
  const [now, setNow] = useState(Date.now);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verify = useFetcher(
    isVerification ? endpoint.verifyEmail : endpoint.verifyRecoveryCode,
  );
  const resend = useFetcher(
    isVerification ? endpoint.sendLink : endpoint.sendRecoveryCode,
  );
  const busy = verify.isMutating || resend.isMutating;
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    if (!email)
      navigate(isVerification ? "/login" : "/forget-password", {
        replace: true,
      });
  }, [email, navigate, isVerification]);

  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  function updateDigits(index: number, value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (!digits) {
      setCode((current) =>
        current.map((digit, i) => (i === index ? "" : digit)),
      );
      return;
    }
    const start = digits.length === 6 ? 0 : index;
    setCode((current) => {
      const next = [...current];
      [...digits].forEach((digit, offset) => {
        if (start + offset < 6) next[start + offset] = digit;
      });
      return next;
    });
    inputRefs.current[Math.min(start + digits.length, 5)]?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || busy || !/^\d{6}$/.test(code.join(""))) return;
    pending.current = true;
    try {
      const result = await verify.trigger(
        isVerification
          ? { email, token: code.join(""), type: "verify" }
          : { email, code: code.join("") },
      );
      if (!active.current) return;
      if (!result?.success) throw new Error(result?.message || "Unable to verify this code. Please try again.");
      if (isVerification) {
        const session = extractSession(result);
        if (session) {
          setAuth?.(session);
          navigate(session.onboarded ? "/overview" : "/onboarding", {
            replace: true,
          });
          return;
        }
        // A previously verified address may return email without a new session.
        if ((result?.data as { email?: string } | undefined)?.email) {
          navigate("/login", { replace: true });
          return;
        }
        throw new Error("Unable to verify this code. Please try again.");
      }
      const data = result?.data as { token?: string } | undefined;
      if (!data?.token)
        throw new Error("Unable to verify this code. Please try again.");
      navigate(`/set-password?token=${encodeURIComponent(data.token)}`, {
        replace: true,
      });
    } catch (cause) {
      if (!active.current) return;
      reportFetcherError(cause, "Unable to verify this code. Please try again.");
      inputRefs.current[0]?.focus();
    } finally { pending.current = false; }
  }

  async function handleResend() {
    if (pending.current || busy || remaining > 0) return;
    pending.current = true;
    try {
      const result = await resend.trigger(
        isVerification
          ? { email, type: "verify", delivery: "code" }
          : { email },
      );
      if (!active.current) return;
      if (!result?.success) throw new Error(result?.message || "Unable to resend the code. Please try again.");
      const sentAt = Date.now();
      setNow(sentAt);
      setResendAt(sentAt + 60000);
      setCode(emptyCode());
      setNotice("A new code has been requested. Please check your inbox.");
      inputRefs.current[0]?.focus();
    } catch (cause) {
      if (!active.current) return;
      reportFetcherError(cause, "Unable to resend the code. Please try again shortly.");
    } finally { pending.current = false; }
  }

  return (
    <AuthEntryLayout
      title={
        <>
          Check your <em>inbox</em>
        </>
      }
      recovery
      subtitle={
        <>
          {isVerification
            ? "Verify your email using a six-digit code for "
            : "We’ve sent a code to "}
          <strong className="break-all font-semibold text-text-neutral-strong">
            {email}
          </strong>
          . Haven’t received an email? Try searching in the spam or social
          folder.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset disabled={busy} className="min-w-0">
          <legend className="sr-only">
            {isVerification
              ? "Six-digit email verification code"
              : "Six-digit password recovery code"}
          </legend>
          <AuthFieldMotion className="auth-recovery-code flex gap-2 px-4">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={6}
                value={digit}
                aria-label={`Digit ${index + 1} of 6`}
                onChange={(event) => updateDigits(index, event.target.value)}
                onFocus={(event) => event.target.select()}
                onPaste={(event) => {
                  event.preventDefault();
                  updateDigits(index, event.clipboardData.getData("text"));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digit && index > 0)
                    inputRefs.current[index - 1]?.focus();
                  if (event.key === "ArrowLeft" && index > 0)
                    inputRefs.current[index - 1]?.focus();
                  if (event.key === "ArrowRight" && index < 5)
                    inputRefs.current[index + 1]?.focus();
                }}
                className="min-w-0 flex-1 rounded-[10px] text-center tabular-nums"
              />
            ))}
          </AuthFieldMotion>
        </fieldset>
        <div className="text-center text-xs text-text-neutral-weak">
          Didn’t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={busy || remaining > 0}
            className="min-h-8 rounded font-semibold text-text-brand-strong underline underline-offset-4 disabled:no-underline disabled:opacity-60"
          >
            {resend.isMutating
              ? "Sending..."
              : remaining > 0
                ? `Resend code in ${remaining}s`
                : "Resend code"}
          </button>
        </div>
        <p
          role="status"
          className={notice ? "text-xs text-text-neutral-weak" : "sr-only"}
        >
          {notice}
        </p>
        <Button
          type="submit"
          disabled={busy || code.some((digit) => !digit)}
          className="h-11 w-full rounded-lg"
        >
          {verify.isMutating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify code"
          )}
        </Button>
      </form>
    </AuthEntryLayout>
  );
}
