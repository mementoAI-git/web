import { useLocation } from "react-router-dom";
import { isSkyCardPage } from "@/pages/dashboard/component/sky-card-page";
import { useEffect, useRef, useState } from "react";

import {
  AudioLines,
  Brain,
  Check,
  HardDrive,
  Lightbulb,
  MessageCircle,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { useSubscription } from "@/contexts/subscription";
import { useModal } from "@/hooks/use-modal";
import { DashboardHeader } from "@/pages/dashboard/component/dashboard-header";
import { DashboardOverlayFrame } from "@/pages/dashboard/component/dashboard-overlay-frame";
import "@/components/modal/memory-insights/insights.css";
import "./pricing-overlay.css";
import { cn } from "@/lib/utils";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { startCheckout } from "./start-checkout";
import posthog from "@/lib/posthog";
import {
  FREE_FEATURES,
  PRO_FEATURES,
  formatPlanPrice,
  type BillingInterval,
} from "./plan-catalog";
import { getPlanState } from "./plan-state";

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

const FEATURE_ICONS: Record<string, LucideIcon> = {
  "Add stories, journals, and thoughts": PenLine,
  "Core chat and memories": MessageCircle,
  "Memory insights": Lightbulb,
  "Standard uploads and storage (200 MB)": HardDrive,
  "Voice mode conversations": AudioLines,
  "Supermemory integration": Brain,
  "Bigger storage (10 GB)": HardDrive,
};

const INTERVAL_ITEM_CLASS =
  "h-8 rounded-full text-muted-foreground data-[state=on]:bg-fill-tab-active data-[state=on]:text-text-tab-active aria-checked:bg-fill-tab-active aria-checked:text-text-tab-active aria-pressed:bg-fill-tab-active aria-pressed:text-text-tab-active data-[state=on]:shadow-sm";

function PlanFeatures({
  items,
  accent = false,
}: {
  items: string[];
  accent?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const Icon = FEATURE_ICONS[item] ?? Check;
        return (
          <li key={item} className="flex items-start gap-2.5">
            <Icon
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0",
                accent ? "text-text-brand-strong" : "text-icon-neutral-weak",
              )}
            />
            <span className="text-balance">{item}</span>
          </li>
        );
      })}
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
    summary,
    refresh,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription();
  const { pathname, key: locationKey } = useLocation();
  const { open: openModal } = useModal();
  const [cancelling, setCancelling] = useState(false);
  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval | null>(null);
  const pending = useRef(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const canViewPricing = canUse("billing.pricing_page", true);
  const canStartCheckout = canUse("billing.checkout", true);
  const plan = getPlanState({
    summary,
    loading: subscriptionLoading,
    error: subscriptionError,
    selectedInterval,
    canCheckout: canStartCheckout,
    canPortal: canUse("billing.portal", true),
    upgradeLabel,
  });
  const interval = plan.interval;

  const runProAction = async () => {
    const action = plan.pro.action;
    if (!action || pending.current) return;
    if (action === "checkout" && onUpgrade) {
      onUpgrade();
      return;
    }
    pending.current = true;
    setCheckoutLoading(true);
    try {
      if (action === "portal") {
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

  const requestClose = () => {
    if (pending.current || cancelBusy) return false;
    setCancelling(false);
    setSelectedInterval(null);
    onOpenChange(false);
    return true;
  };

  // The frame's sidebar can navigate, and the new page would stay hidden behind this.
  const openedAtLocation = useRef(locationKey);
  useEffect(() => {
    if (!open || locationKey === openedAtLocation.current) {
      openedAtLocation.current = locationKey;
      return;
    }
    openedAtLocation.current = locationKey;
    onOpenChange(false);
  }, [locationKey, onOpenChange, open]);

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
        if (value) onOpenChange(true);
        else requestClose();
      }}
    >
      <DialogContent
        data-sky-card-page={isSkyCardPage(pathname) ? "" : undefined}
        showCloseButton={cancelling}
        className={cn(
          cancelling
            ? "sky-card w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto gap-6 p-6 sm:w-[calc(100%-4rem)] sm:max-w-[480px]"
            : "insights-overlay",
          className,
        )}
        {...(!cancelling && canViewPricing && !description
          ? { "aria-describedby": undefined }
          : {})}
        overlayClassName={
          cancelling
            ? "bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
            : "insights-overlay-backdrop z-[100]"
        }
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
          <TooltipProvider>
            <DashboardOverlayFrame>
              <DashboardHeader
                overlay={{
                  title: (
                    <p className="font-garamond text-3xl font-medium text-text-neutral-strong sm:text-4xl">
                      My <em>plan</em>
                    </p>
                  ),
                  searchLabel: "Search memories",
                  closeLabel: "Close",
                  onSearch: () => {
                    // Search opens beneath this page, so leave it first.
                    if (requestClose()) openModal?.("search-memory");
                  },
                  onClose: requestClose,
                }}
              />
              <div className="insights-scroll">
                <main className="insights-main">
                  <DialogHeader className="items-center gap-3 text-center">
                    <DialogTitle className="font-garamond text-3xl font-medium leading-tight text-text-neutral-strong sm:text-4xl">
                      {canViewPricing
                        ? title
                        : "Pricing is currently unavailable"}
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
                      <div className="pricing-plans">
                        <Card className="pricing-plan gap-6 py-7">
                          <CardHeader>
                            {/* Matches the Pro row's height so both cards' content lines up. */}
                            <div className="flex min-h-10 items-center">
                              <CardTitle>
                                <h2 className="font-garamond text-3xl">Free</h2>
                              </CardTitle>
                            </div>
                            <CardDescription>
                              Capture and reflect at your own pace.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-1 flex-col gap-6">
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full rounded-full"
                              disabled={!plan.free.canDowngrade || checkoutLoading}
                              onClick={() => setCancelling(true)}
                            >
                              {plan.free.label}
                            </Button>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-semibold tracking-tight">
                                $0
                              </span>
                              <span className="text-muted-foreground">
                                / month
                              </span>
                            </div>
                            <PlanFeatures items={FREE_FEATURES} />
                          </CardContent>
                        </Card>
                        <Card className="pricing-plan pricing-plan-pro gap-6 py-7">
                          <CardHeader>
                            <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
                              <CardTitle>
                                <h2 className="font-garamond text-3xl">Pro</h2>
                              </CardTitle>
                              {plan.intervalControl !== "hidden" && (
                                <ToggleGroup
                                  type="single"
                                  value={interval}
                                  onValueChange={(value) => {
                                    if (value === "monthly" || value === "annual")
                                      setSelectedInterval(value);
                                  }}
                                  aria-label="Billing period"
                                  disabled={
                                    checkoutLoading ||
                                    plan.intervalControl === "disabled"
                                  }
                                  className="pricing-billing-period grid w-[176px] grid-cols-2 rounded-full bg-fill-neutral-weak p-1"
                                >
                                  <ToggleGroupItem
                                    value="monthly"
                                    className={INTERVAL_ITEM_CLASS}
                                  >
                                    Monthly
                                  </ToggleGroupItem>
                                  <ToggleGroupItem
                                    value="annual"
                                    className={INTERVAL_ITEM_CLASS}
                                  >
                                    Annual
                                  </ToggleGroupItem>
                                </ToggleGroup>
                              )}
                            </div>
                            <CardDescription>
                              For users who want to benefit more.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-1 flex-col gap-6">
                            <Button
                              size="lg"
                              className="w-full rounded-full border-0 bg-fill-tab-active text-text-tab-active hover:bg-fill-tab-active/90 [background-image:none]"
                              disabled={!plan.pro.action || checkoutLoading}
                              onClick={() => void runProAction()}
                            >
                              {(checkoutLoading || subscriptionLoading) && (
                                <Spinner data-icon="inline-start" />
                              )}
                              {checkoutLoading
                                ? "Opening billing…"
                                : plan.pro.label}
                            </Button>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-semibold tracking-tight">
                                {formatPlanPrice(interval)}
                              </span>
                              <span className="text-muted-foreground">
                                / {interval === "monthly" ? "month" : "year"}
                              </span>
                            </div>
                            <PlanFeatures items={PRO_FEATURES} accent />
                          </CardContent>
                        </Card>
                      </div>
                      {plan.note && (
                        <p className="text-sm text-muted-foreground">
                          {plan.note}
                        </p>
                      )}
                      {plan.cancelRow && (
                        <div className="insights-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium">{plan.cancelRow.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {plan.cancelRow.body}
                            </p>
                          </div>
                          <Button
                            variant={
                              plan.cancelRow.action === "resume"
                                ? "outline"
                                : "ghost"
                            }
                            className={
                              plan.cancelRow.action === "resume"
                                ? undefined
                                : "rounded-full bg-fill-error-weak text-text-error-strong hover:bg-fill-error-weak/80"
                            }
                            disabled={
                              checkoutLoading ||
                              subscriptionLoading ||
                              Boolean(subscriptionError)
                            }
                            onClick={() =>
                              plan.cancelRow?.action === "resume"
                                ? void resume()
                                : setCancelling(true)
                            }
                          >
                            {plan.cancelRow.action === "resume"
                              ? "Keep plan"
                              : "Cancel plan"}
                          </Button>
                        </div>
                      )}
                      {dismissLabel && (
                        <Button
                          variant="ghost"
                          className="self-center"
                          disabled={checkoutLoading}
                          onClick={requestClose}
                        >
                          {dismissLabel}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="self-center"
                      onClick={requestClose}
                    >
                      Back to Memento
                    </Button>
                  )}
                </main>
              </div>
            </DashboardOverlayFrame>
          </TooltipProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
