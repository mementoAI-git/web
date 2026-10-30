import { useLocation } from "react-router-dom";
import { isSkyCardPage } from "@/pages/dashboard/component/sky-card-page";
import { useRef, useState } from "react";

import { Check } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelPlanContent } from "./cancel-plan-content";
import { openCustomerPortal } from "./open-customer-portal";
import { resumeSubscription } from "./subscription-actions";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { useSubscription } from "@/contexts/subscription";
import { cn } from "@/lib/utils";
import { ProCardBackground } from "./pro-card-background";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { startCheckout } from "./start-checkout";
import posthog from "@/lib/posthog";
import {
  FREE_FEATURES,
  PRO_FEATURES,
  formatPlanPrice,
  type BillingInterval,
} from "./plan-catalog";

interface PricingOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onUpgrade?: () => void;
  upgradeLabel?: string;
  className?: string;
  dismissLabel?: string;
}

function PlanFeatures({
  items,
  inverse = false,
}: {
  items: string[];
  inverse?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check
            aria-hidden
            className={cn(
              "mt-0.5 size-4 shrink-0",
              inverse ? "text-icon-inverse-strong" : "text-icon-neutral-weak",
            )}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingOverlay({
  open,
  onOpenChange,
  title = "Plans that grow with your memories",
  description,
  onUpgrade,
  upgradeLabel = "Start 14-day trial",
  className,
  dismissLabel,
}: PricingOverlayProps) {
  const { canUse } = useFeatureFlags();
  const {
    isProOrAbove,
    summary,
    refresh,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription();
  const { pathname } = useLocation();
  const [cancelling, setCancelling] = useState(false);
  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval | null>(null);
  const interval =
    selectedInterval ??
    (summary?.billing_interval === "annual" ? "annual" : "monthly");
  const current = isProOrAbove && summary?.billing_interval === interval;
  const pending = useRef(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const canViewPricing = canUse("billing.pricing_page", true);
  const canStartCheckout = canUse("billing.checkout", true);
  const canChangePlan = summary?.can_manage_subscription
    ? canUse("billing.portal", true)
    : canStartCheckout;

  const checkout = async (interval: BillingInterval) => {
    if (
      !canChangePlan ||
      pending.current ||
      subscriptionLoading ||
      subscriptionError
    )
      return;
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    pending.current = true;
    setCheckoutLoading(true);
    try {
      if (isProOrAbove && summary?.can_manage_subscription) {
        window.location.assign(
          await openCustomerPortal(
            `${window.location.origin}/settings/billing`,
          ),
        );
        return;
      }
      const origin = window.location.origin;

      const url = await startCheckout({
        tier: "pro",
        interval,
        success_url: `${origin}/settings/billing?checkout=success`,
        cancel_url: `${origin}/settings/billing?checkout=cancelled`,
      });
      if (posthog.__loaded) {
        posthog.capture("checkout_started", {
          plan_tier: "pro",
          billing_interval: interval,
        });
      }
      window.location.href = url;
    } catch (error) {
      reportFetcherError(error, "Could not start checkout");
    } finally {
      pending.current = false;
      setCheckoutLoading(false);
    }
  };

  const canManage = summary?.can_manage_subscription === true;
  const scheduled = summary?.cancel_at_period_end === true;
  const resume = async () => {
    if (pending.current) return;
    pending.current = true;
    setCheckoutLoading(true);
    try {
      const response = await resumeSubscription();
      if (!response.success)
        throw new Error(response.message || "Could not keep your plan");
      refresh();
      toast.success("Your subscription will continue renewing.");
    } catch (error) {
      reportFetcherError(error, "Could not keep your plan");
    } finally {
      pending.current = false;
      setCheckoutLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (pending.current || cancelBusy) return;
        if (!value) {
          setCancelling(false);
          setSelectedInterval(null);
        }
        onOpenChange(value);
      }}
    >
      <DialogContent
        data-sky-card-page={isSkyCardPage(pathname) ? "" : undefined}
        className={cn(
          "sky-card w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto gap-8 p-6 sm:w-[calc(100%-4rem)] sm:max-w-[880px] sm:p-10 lg:gap-8 lg:px-10 lg:py-8",
          cancelling && "sm:max-w-[480px] sm:p-6 lg:px-6 lg:py-6 lg:gap-6",
          className,
        )}
        {...(!cancelling && canViewPricing && !description
          ? { "aria-describedby": undefined }
          : {})}
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
      >
        {cancelling ? (
          <CancelPlanContent
            onBusyChange={setCancelBusy}
            onBack={() => setCancelling(false)}
            onComplete={() => {
              refresh();
              setCancelling(false);
            }}
          />
        ) : (
          <>
            <DialogHeader className="gap-3 pr-8">
              <DialogTitle className="font-garamond text-3xl font-medium leading-tight sm:text-4xl">
                {canViewPricing ? title : "Pricing is currently unavailable"}
              </DialogTitle>
              {(!canViewPricing || description) && (
                <DialogDescription>
                  {canViewPricing
                    ? description
                    : "Billing access is currently disabled for your account."}
                </DialogDescription>
              )}
            </DialogHeader>
            {canViewPricing ? (
              <>
                <ToggleGroup
                  type="single"
                  value={interval}
                  onValueChange={(value) => {
                    if (value === "monthly" || value === "annual")
                      setSelectedInterval(value);
                  }}
                  aria-label="Billing period"
                  disabled={checkoutLoading}
                  className="pricing-billing-period mx-auto grid w-full max-w-[280px] grid-cols-2 rounded-xl bg-fill-neutral-weak p-1"
                >
                  <ToggleGroupItem
                    value="monthly"
                    className="rounded-lg text-muted-foreground data-[state=on]:bg-fill-tab-active data-[state=on]:text-text-tab-active aria-checked:bg-fill-tab-active aria-checked:text-text-tab-active aria-pressed:bg-fill-tab-active aria-pressed:text-text-tab-active data-[state=on]:shadow-sm"
                  >
                    Monthly
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="annual"
                    className="rounded-lg text-muted-foreground data-[state=on]:bg-fill-tab-active data-[state=on]:text-text-tab-active aria-checked:bg-fill-tab-active aria-checked:text-text-tab-active aria-pressed:bg-fill-tab-active aria-pressed:text-text-tab-active data-[state=on]:shadow-sm"
                  >
                    Annual
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="grid w-full gap-6 md:grid-cols-2">
                  <Card className="sky-card rounded-3xl bg-fill-neutral-weaker gap-5 py-6">
                    <CardHeader>
                      <CardTitle>
                        <h2 className="font-garamond text-3xl">Free</h2>
                      </CardTitle>
                      <CardDescription>
                        Capture and reflect at your own pace.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-6">
                      <PlanFeatures items={FREE_FEATURES} />
                      <div className="mt-auto flex items-baseline gap-2">
                        <span className="text-4xl font-semibold tracking-tight text-text-brand-strong">
                          $0
                        </span>
                        <span className="text-muted-foreground">/ month</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        disabled={
                          !isProOrAbove ||
                          checkoutLoading ||
                          subscriptionLoading ||
                          Boolean(subscriptionError) ||
                          !canManage ||
                          scheduled
                        }
                        onClick={() => setCancelling(true)}
                      >
                        {subscriptionLoading
                          ? "Loading your plan…"
                          : subscriptionError
                            ? "Plan unavailable"
                            : isProOrAbove
                              ? "Downgrade to free"
                              : "Current plan"}
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="relative isolate rounded-3xl bg-fill-brand-strong gap-5 py-6 text-text-inverse-strong ring-stroke-brand-weak [&>[data-slot]]:relative">
                    <ProCardBackground />
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle>
                          <h2 className="font-garamond text-3xl">Pro</h2>
                        </CardTitle>
                        {current && (
                          <Badge
                            variant="outline"
                            className="border-stroke-inverse-weak bg-fill-inverse-weak text-text-inverse-strong"
                          >
                            Current plan
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-text-inverse-strong">
                        For users who want to benefit more.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-6">
                      <PlanFeatures items={PRO_FEATURES} inverse />
                      <div className="mt-auto flex items-baseline gap-2">
                        <span className="text-4xl font-semibold tracking-tight">
                          {formatPlanPrice(interval)}
                        </span>
                        <span>
                          / {interval === "monthly" ? "month" : "year"}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        size="lg"
                        className="w-full border-0 bg-[var(--fill-billing-badge)] text-[var(--text-billing-badge)] hover:bg-[var(--fill-billing-badge)]/90 disabled:opacity-100 disabled:text-[var(--text-billing-badge)]/50 [background-image:none]"
                        disabled={
                          subscriptionLoading ||
                          Boolean(subscriptionError) ||
                          checkoutLoading ||
                          current ||
                          (isProOrAbove && summary?.tier === "legacy") ||
                          !canChangePlan
                        }
                        onClick={() => void checkout(interval)}
                      >
                        {(checkoutLoading || subscriptionLoading) && (
                          <Spinner data-icon="inline-start" />
                        )}
                        {subscriptionLoading
                          ? "Loading your plan…"
                          : subscriptionError
                            ? "Plan unavailable"
                            : current
                              ? "Current plan"
                              : summary?.tier === "legacy"
                                ? "Included in Legacy"
                                : checkoutLoading
                                  ? "Opening billing…"
                                  : !canChangePlan
                                    ? canManage
                                      ? "Plan changes unavailable"
                                      : "Checkout unavailable"
                                    : isProOrAbove
                                      ? interval === "annual"
                                        ? "Upgrade"
                                        : "Switch to monthly"
                                      : upgradeLabel}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                {isProOrAbove && (
                  <div className="sky-card flex flex-col gap-3 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">
                        {scheduled ? "Cancellation scheduled" : "Cancel plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {canManage
                          ? "You’ll keep Pro features until the end of your billing period."
                          : "Your Pro access has no recurring web subscription to cancel."}
                      </p>
                    </div>
                    <Button
                      variant={scheduled ? "outline" : "destructive"}
                      disabled={
                        !canManage ||
                        checkoutLoading ||
                        subscriptionLoading ||
                        Boolean(subscriptionError)
                      }
                      onClick={() =>
                        scheduled ? void resume() : setCancelling(true)
                      }
                    >
                      {scheduled ? "Keep plan" : "Cancel plan"}
                    </Button>
                  </div>
                )}
                {isProOrAbove && !summary?.billing_interval && (
                  <p className="text-sm text-muted-foreground">
                    Current plan:{" "}
                    {summary?.tier === "legacy" ? "Legacy" : "Pro access"}. No
                    monthly or annual billing period is attached to this
                    account.
                  </p>
                )}
                {dismissLabel && (
                  <Button
                    variant="ghost"
                    className="justify-self-center"
                    disabled={checkoutLoading}
                    onClick={() => onOpenChange(false)}
                  >
                    {dismissLabel}
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                className="justify-self-start"
                onClick={() => onOpenChange(false)}
              >
                Back to Memento
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
