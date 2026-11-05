import { StripBannerFrame } from "./strip-banner-frame";
/**
 * SecurityNudgeBanner — shown periodically to users who have neither
 * a passkey nor 2FA enabled. Dismissable for 14 days.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, X } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/utility";

const STORAGE_KEY = "memento:security:nudge:dismissed_at";
const DISMISS_DAYS = 14;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function SecurityNudgeBanner() {
  const { user, hydrated } = useStore();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hydrated || !user) return;
    const has2FA = user.two_factor?.enabled;
    const hasPasskey =
      (user as import("@/utility/interface").IUser).passkeys?.length > 0;
    if (!has2FA && !hasPasskey && !isDismissed()) {
      setVisible(true);
    }
  }, [hydrated, user]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <StripBannerFrame>
      <div
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-stroke-warning-strong/20 bg-fill-warning-weak px-4 py-3",
          "font-inter text-sm text-text-warning-strong",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300",
        )}
        role="status"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Shield
            size={15}
            className="shrink-0 text-icon-warning-strong"
            strokeWidth={1.5}
          />
          <span>
            Secure your account — set up a{" "}
            <button
              type="button"
              className="rounded-sm font-semibold underline underline-offset-2 hover:text-text-warning-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-warning-strong"
              onClick={() => {
                navigate("/settings/security");
                dismiss();
              }}
            >
              passkey or 2FA
            </button>
          </span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss security reminder"
          className="shrink-0 rounded-full p-1 text-icon-warning-strong transition-colors hover:bg-fill-warning-strong/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-warning-strong motion-reduce:transition-none"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    </StripBannerFrame>
  );
}
