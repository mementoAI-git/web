import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utility";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { startCheckout } from "./start-checkout";
import upgradeHeroImage from "@/assets/image/upgradecard.png";

import type { FeatureKey } from "./types";
import { UPGRADE_COPY } from "./upgrade-copy";

export type UpgradePromptVariant = "modal" | "inline" | "tooltip";

export interface UpgradePromptProps {
  feature: FeatureKey;
  variant: UpgradePromptVariant;
  /** Controlled open state for modal variant */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  onUpgrade?: () => void;
  upgradeLabel?: string;
  className?: string;
  /** Tooltip / inline: wraps trigger content */
  children?: ReactNode;
}

type BillingChoice = "monthly" | "annual" | "lifetime";

const USD = {
  monthly: 9.99,
  annual: 79,
  lifetime: 999,
} as const;

const NGN = {
  monthly: 8000,
  annual: 60000,
  lifetime: 400000,
} as const;

function detectCurrency(): "USD" | "NGN" {
  if (typeof navigator === "undefined") return "USD";
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return region === "NG" ? "NGN" : "USD";
  } catch {
    return "USD";
  }
}

function formatMoney(amount: number, currency: "USD" | "NGN") {
  const locale = currency === "NGN" ? "en-NG" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(amount);
}

const PLAN_COPY: Record<
  BillingChoice,
  { label: string; badge?: string; helper: string; tier: "pro" | "legacy" }
> = {
  monthly: {
    label: "Monthly",
    helper: "/month",
    tier: "pro",
  },
  annual: {
    label: "Annual",
    badge: "Save 15%",
    helper: "/year",
    tier: "pro",
  },
  lifetime: {
    label: "Lifetime",
    badge: "Best value",
    helper: "once",
    tier: "legacy",
  },
};

export function UpgradePrompt({
  feature,
  variant,
  open,
  onOpenChange,
  onDismiss,
  onUpgrade,
  upgradeLabel = "Upgrade to Pro",
  className,
  children,
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const { canUse } = useFeatureFlags();
  const [selectedPlan, setSelectedPlan] = useState<BillingChoice>("annual");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const copy = UPGRADE_COPY[feature];
  const currency = useMemo(() => detectCurrency(), []);
  const pricingTable = currency === "NGN" ? NGN : USD;
  const canStartCheckout = canUse("billing.checkout", true);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const planPrice = (choice: BillingChoice) => pricingTable[choice];

  const startSelectedCheckout = async () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    if (!canStartCheckout || !origin) {
      navigate("/pricing");
      return;
    }

    const tier = PLAN_COPY[selectedPlan].tier;
    const interval = selectedPlan;

    setCheckoutLoading(true);
    try {
      const currentUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/overview";

      const url = await startCheckout({
        success_url: `${origin}/settings/billing?checkout=success`,
        cancel_url: `${origin}${currentUrl}`,
        tier,
        interval,
      });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange?.(false);
  };

  const handleUpgrade = () => {
    onUpgrade?.();
  };

  if (variant === "tooltip") {
    return (
      <span
        className={cn("inline-flex", className)}
        title={`${copy.title} — ${copy.description}`}
      >
        {children}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <div
        role="region"
        aria-label={copy.title}
        className={cn(
          "rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 font-inter text-sm text-v3-text-strong",
          className,
        )}
      >
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-v3-text-weak">{copy.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" className="rounded-full" onClick={handleUpgrade}>
            {upgradeLabel}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
      }}
    >
      <DialogContent
        className={cn(
          "w-[calc(100vw-1.5rem)] max-w-none max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[32px] border border-v3-stroke-weak bg-white p-0 shadow-2xl sm:w-[min(96vw,1080px)] md:h-[min(720px,calc(100dvh-2rem))] md:w-[min(92vw,1040px)] md:max-w-[1040px] md:overflow-hidden",
          className,
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{copy.title}</DialogTitle>
        <DialogDescription className="sr-only">{copy.description}</DialogDescription>
        <div className="grid min-h-0 md:h-full md:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <div className="relative min-h-[220px] overflow-hidden bg-v3-fill-weaker sm:min-h-[260px] md:h-full md:min-h-0">
            <img
              src={upgradeHeroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
          </div>

          <div className="relative flex min-h-0 min-w-0 flex-col bg-white px-5 py-5 sm:px-7 sm:py-6 md:h-full md:min-w-[420px] md:overflow-y-auto md:px-8 md:py-8">
            <button
              type="button"
              aria-label="Close upgrade modal"
              onClick={handleDismiss}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-v3-stroke-weak bg-white text-v3-text-weak transition-colors hover:bg-v3-fill-weaker hover:text-v3-text-strong md:right-6 md:top-6"
            >
              <X className="size-5" />
            </button>

            <div className="pr-12 md:pr-14">
              <p className="max-w-[9ch] font-garamond text-[30px] leading-[1.12] text-v3-text-strong md:text-[46px] md:leading-[1.02]">
                {copy.title}
              </p>
              <p className="mt-3 max-w-[32ch] font-inter text-sm leading-6 text-v3-text-weak md:text-[15px]">
                {copy.description}
              </p>
            </div>

            <div className="mt-6 space-y-3 text-v3-text-strong md:mt-7">
              {[
                "Save more stories, photos, and recordings",
                "Unlock richer memory context and deeper reflection tools",
                "Access the full experience across voice and advanced features",
                "Keep building without hitting free-plan limits",
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <span className="mt-[7px] inline-block h-2.5 w-2.5 rounded-full bg-v3-fill-strong" />
                  <p className="font-inter text-sm leading-6 text-v3-text-strong md:text-[15px]">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:mt-7 md:grid-cols-3">
              {(["monthly", "annual", "lifetime"] as BillingChoice[]).map((plan) => {
                const selected = selectedPlan === plan;
                const copyForPlan = PLAN_COPY[plan];
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "rounded-[22px] border px-4 py-4 text-left transition-[border-color,background-color,box-shadow] duration-150",
                      selected
                        ? "border-v3-fill-strong bg-v3-fill-weaker shadow-sm"
                        : "border-v3-stroke-weak bg-white hover:border-v3-fill-strong/30 hover:bg-v3-fill-weaker/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-inter text-[15px] font-semibold text-v3-text-strong">
                        {copyForPlan.label}
                      </span>
                      {copyForPlan.badge ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 font-inter text-[11px] font-semibold",
                            selected
                              ? "bg-v3-fill-strong text-white"
                              : "bg-v3-fill-weak text-v3-text-strong",
                          )}
                        >
                          {copyForPlan.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="font-inter text-[28px] font-semibold leading-none text-v3-text-strong">
                        {formatMoney(planPrice(plan), currency)}
                      </span>
                      <span className="pb-0.5 font-inter text-sm text-v3-text-weak">
                        {copyForPlan.helper}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-3 md:mt-7">
              <Button
                type="button"
                onClick={() => void startSelectedCheckout()}
                disabled={checkoutLoading}
                className="h-14 w-full rounded-[999px] !bg-v3-fill-strong font-inter text-lg font-semibold !text-white transition-opacity hover:opacity-95"
              >
                {checkoutLoading
                  ? "Opening checkout…"
                  : canStartCheckout
                    ? upgradeLabel
                    : "View plans"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDismiss}
                className="h-14 w-full rounded-[999px] border-v3-stroke-weak bg-white font-inter text-lg font-medium text-v3-text-strong shadow-none hover:bg-v3-fill-weaker"
              >
                Let me think about it
              </Button>
            </div>

            <p className="mt-5 text-center font-inter text-xs leading-5 text-v3-text-weak md:mt-6">
              Terms of Service &amp; Privacy Policy | Have a question? Contact us
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
