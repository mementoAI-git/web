import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useNavigate, useLocation } from "react-router-dom";
import { CircleArrowUp, CreditCard, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import endpoint from "@/api/endpoint";
import { fetcher, postFetcher } from "@/api/fetcher";
import { normalizeEntityResponse } from "@/api/domain-adapters";
import statusDot from "@/assets/billing/status-dot.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/contexts/subscription";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { openCustomerPortal } from "@/features/pricing/open-customer-portal";
import { PricingOverlay } from "@/features/pricing/pricing-overlay";
import { StorageUsageCard } from "@/features/pricing/storage-usage-card";
import { normalizeInvoices } from "@/features/pricing/billing-adapters";
import type { BillingAccount } from "@/features/pricing/types";
import { cn } from "@/utility";
import { useRequestRecovery } from "@/hooks/use-request-recovery";

const sectionClass =
  "settings-card p-4 sm:p-6";
const actionClass =
  "h-9 rounded-lg border-stroke-neutral-weak bg-transparent px-3 font-geist text-sm text-text-neutral-strong";
const planActionClass =
  "h-auto rounded-full bg-[var(--fill-billing-badge)] px-2.5 py-1.5 font-inter text-xs font-semibold leading-[18px] text-[var(--text-billing-badge)] [background-image:none] hover:bg-[var(--fill-billing-badge)]/90";

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    summary,
    isLoading,
    error: summaryError,
    refresh,
    isProOrAbove,
  } = useSubscription();
  const { canUse } = useFeatureFlags();
  const canViewSummary = canUse("billing.subscription_summary", true);
  const canOpenPortal = canUse("billing.portal", true);
  const canCheckout = canUse("billing.checkout", true);
  const canViewUsage = canUse("billing.usage_limits", true);
  const [manageOpen, setManageOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [promo, setPromo] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const account = useSWR(
    canViewSummary ? endpoint.billingAccount : null,
    async (url: string) => {
      const response = await fetcher<BillingAccount>(url);
      if (!response.success)
        throw new Error(response.message || "Could not load billing account");
      return normalizeEntityResponse<BillingAccount>(response).data;
    },
  );
  const invoices = useSWR(
    tab === "invoices" ? endpoint.billingInvoices : null,
    async (url: string) => {
      const response = await fetcher(url);
      if (!response.success)
        throw new Error(response.message || "Could not load invoices");
      return normalizeInvoices(response);
    },
  );
  const retrySummary = useCallback(async () => { refresh(); }, [refresh]);
  const retryPlan = useRequestRecovery("billing-plan", summaryError, retrySummary, "Could not load your subscription.");
  const retryAccount = useRequestRecovery("billing-account", account.error, account.mutate, "Could not load billing details.");
  const retryInvoices = useRequestRecovery("billing-invoices", tab === "invoices" && invoices.error, invoices.mutate, "Could not load invoices.");
  const refreshAccount = account.mutate;
  const returnHandled = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get("checkout");
    if (returnHandled.current || !["success", "cancelled"].includes(result || "")) return;
    returnHandled.current = true;
    if (result === "success") {
      refresh();
      void refreshAccount().catch(() => undefined);
      toast.info("Checkout returned. Your plan will update when payment is confirmed.", {
        action: { label: "Refresh", onClick: refresh },
      });
    } else {
      toast.info("Checkout cancelled. You can try again whenever you’re ready.");
    }
    params.delete("checkout");
    navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true });
  }, [location, navigate, refresh, refreshAccount]);
  const promoPending = useRef(false);
  const portalPending = useRef(false);
  const hasCustomer = account.data?.has_customer === true;
  const portalDisabled = !canOpenPortal || !hasCustomer || Boolean(account.error) || account.isLoading || portalBusy;
  const handlePortal = async () => {
    if (portalPending.current || portalDisabled) return;
    portalPending.current = true;
    setPortalBusy(true);
    try {
      window.location.assign(
        await openCustomerPortal(`${window.location.origin}/settings/billing`),
      );
    } catch (error) {
      reportFetcherError(error, "Could not open billing portal");
    } finally {
      portalPending.current = false;
      setPortalBusy(false);
    }
  };
  const handlePromo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (promoPending.current) return;
    const code = promo.trim();
    if (!code) {
      toast.error("Enter a promo code");
      return;
    }
    promoPending.current = true;
    setPromoBusy(true);
    try {
      const response = await postFetcher(endpoint.billingPromoRedeem, {
        arg: { code },
      });
      if (!response?.success) {
        toast.error(response?.message || "Could not redeem code");
        return;
      }
      toast.success("Promo applied");
      setPromo("");
      refresh();
      void refreshAccount().catch(() => undefined);
    } catch {
      // The mutation transport already reports the failure as a toast.
    } finally {
      promoPending.current = false;
      setPromoBusy(false);
    }
  };
  const address = account.data?.address;
  const addressText = address
    ? [
        address.line1,
        address.line2,
        [address.city, address.state, address.postal_code]
          .filter(Boolean)
          .join(", "),
        address.country,
      ]
        .filter(Boolean)
        .join("\n")
    : "Not added yet";
  const status = summary?.status;
  const statusLabel =
    status === "trialing"
      ? "Trial"
      : status === "past_due"
        ? "Past due"
        : status === "cancelled"
          ? "Cancelled"
          : status === "paused"
            ? "Paused"
            : "Active";
  const periodEnd =
    status === "trialing"
      ? summary?.trial_ends_at
      : summary?.current_period_end;

  return (
    <div className="page-stagger flex w-full flex-col gap-4 font-geist text-text-neutral-strong">
      <PricingOverlay
        open={manageOpen}
        onOpenChange={setManageOpen}
        title="Manage plan"
        description="Choose the plan that fits your memories."
      />
      <p className="text-sm text-text-neutral-weak">
        Manage your subscription, invoices, and payment methods.
      </p>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(String(value))}
        className="flex-col gap-4"
      >
        <TabsList
          aria-label="Billing sections"
          className="h-auto gap-2 rounded-none bg-transparent p-0"
        >
          {[
            ["overview", "Overview"],
            ["invoices", "Recent invoices"],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-9 flex-none rounded-lg bg-fill-neutral-weaker px-5 text-text-neutral-strong data-active:bg-fill-neutral-strong data-active:text-text-inverse-strong dark:data-active:bg-fill-inverse-strong dark:data-active:text-[var(--text-billing-badge)]"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="flex w-full flex-col gap-5">
          {isLoading ? (
            <p role="status">Loading subscription…</p>
          ) : summaryError || !canViewSummary || !summary ? (
            <div className={sectionClass}>
              <Button variant="link" onClick={retryPlan}>
                Retry subscription
              </Button>
            </div>
          ) : (
            <section
              aria-label="Current plan"
              className={cn(
                "rounded-2xl p-4 text-text-inverse-strong sm:p-6",
                isProOrAbove
                  ? "min-h-[146px] [background-image:var(--gradient-billing-pro)]"
                  : "min-h-24 [background-image:var(--gradient-billing-free)]",
              )}
            >
              {isProOrAbove ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold leading-6">
                        You’re on Memento{" "}
                        {summary.tier === "legacy" ? "Legacy" : "Pro"}
                      </h3>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--fill-billing-badge)] px-2.5 py-1 text-xs font-medium leading-4 text-[var(--text-billing-badge)]">
                        <img src={statusDot} alt="" width={8} height={8} />
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm leading-5">
                      {status === "active" || status === "trialing"
                        ? "You have full access to Pro features, expanded storage, and richer memory context."
                        : "Manage your subscription to review your plan and payment status."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      disabled={!canUse("billing.pricing_page", true)}
                      onClick={() => setManageOpen(true)}
                      className={planActionClass}
                    >
                      Manage plan
                    </Button>
                    {periodEnd && dayjs(periodEnd).isValid() ? (
                      <span className="text-xs">
                        {status === "trialing"
                          ? "Trial ends"
                          : status === "cancelled" ||
                              summary.cancel_at_period_end
                            ? "Access until"
                            : "Renews"}{" "}
                        {dayjs(periodEnd).format("MMM D, YYYY")}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold leading-6">
                      Unlock more with Pro
                    </h3>
                    <p className="mt-1 max-w-[380px] text-xs leading-4">
                      Advanced features, more storage and better memory
                      contextualization with Pro.
                    </p>
                  </div>
                  <Button
                    disabled={!canCheckout}
                    onClick={() =>
                      navigate("/pricing", {
                        state: {
                          returnTo:
                            location.pathname + location.search + location.hash,
                        },
                      })
                    }
                    className={cn(
                      planActionClass,
                      "shrink-0",
                    )}
                  >
                    <CircleArrowUp className="size-4" aria-hidden />
                    Upgrade
                  </Button>
                </div>
              )}
            </section>
          )}
          {!isLoading && summary && canViewUsage ? (
            <StorageUsageCard
              variant="billing"
              usage={summary.usage}
              isProOrAbove={isProOrAbove}
            />
          ) : null}
          <section
            aria-labelledby="billing-details-title"
            className={sectionClass}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3
                id="billing-details-title"
                className="flex items-center gap-3 text-base font-semibold"
              >
                <FileText className="size-6 text-icon-neutral-weak" />
                Billing details
              </h3>
              <Button
                variant="outline"
                className={actionClass}
                disabled={portalDisabled}
                onClick={() => void handlePortal()}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>
            {account.isLoading ? (
              <p role="status" className="text-sm text-text-neutral-weak">
                Loading billing details…
              </p>
            ) : account.error ? (
              <Button variant="link" onClick={retryAccount}>
                Retry billing details
              </Button>
            ) : (
              <dl className="grid gap-4 text-sm sm:grid-cols-[1fr_1fr_1.2fr] sm:divide-x sm:divide-stroke-neutral-weak">
                {[
                  ["Billing email", account.data?.email || "Not added yet"],
                  ["Name", account.data?.name || "Not added yet"],
                  ["Address", addressText],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn("min-w-0", index > 0 && "sm:pl-4")}
                  >
                    <dt className="mb-1 text-xs text-text-neutral-weak">
                      {label}
                    </dt>
                    <dd className="whitespace-pre-line break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          <section
            aria-labelledby="payment-methods-title"
            className={sectionClass}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3
                id="payment-methods-title"
                className="flex items-center gap-3 text-base font-semibold"
              >
                <CreditCard className="size-6 text-icon-neutral-weak" />
                Payment methods
              </h3>
              <Button
                variant="outline"
                className={actionClass}
                disabled={
                  portalBusy ||
                  !canOpenPortal ||
                  (!hasCustomer && !canCheckout) ||
                  account.isLoading ||
                  Boolean(account.error)
                }
                onClick={() =>
                  hasCustomer
                    ? void handlePortal()
                    : navigate("/pricing", {
                        state: {
                          returnTo:
                            location.pathname + location.search + location.hash,
                        },
                      })
                }
              >
                Add new
              </Button>
            </div>
            {account.isLoading ? (
              <p role="status" className="text-sm text-text-neutral-weak">
                Loading payment methods…
              </p>
            ) : account.error ? (
              null
            ) : account.data?.payment_methods.length ? (
              <ul className="divide-y divide-stroke-neutral-weak">
                {account.data.payment_methods.map((method) => (
                  <li
                    key={method.id}
                    className="flex items-center gap-3 py-3 text-sm"
                  >
                    <CreditCard className="size-6 shrink-0 text-icon-neutral-weak" />
                    <span className="font-medium capitalize">
                      {method.brand}
                    </span>
                    <span className="text-text-neutral-weak">
                      {method.last4 ? `•••• ${method.last4}` : ""}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {method.is_default ? (
                        <span className="rounded-full bg-fill-success-weak px-2.5 py-1 text-xs text-text-success-strong">
                          Default
                        </span>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${method.brand} ${method.last4 || ""}`}
                        disabled={portalDisabled}
                        onClick={() => void handlePortal()}
                      >
                        <Pencil className="size-4 text-icon-neutral-weak" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-sm text-text-neutral-weak">
                No payment methods added yet.
              </p>
            )}
          </section>
        </TabsContent>
        <TabsContent value="invoices">
          <section aria-label="Recent invoices" className={sectionClass}>
            {invoices.isLoading ? (
              <p role="status">Loading invoices…</p>
            ) : invoices.error ? (
              <Button variant="link" onClick={retryInvoices}>
                Retry invoices
              </Button>
            ) : invoices.data?.length ? (
              <ul className="divide-y divide-stroke-neutral-weak">
                {invoices.data.map((invoice, index) => (
                  <li
                    key={invoice.id || index}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {invoice.label || `Invoice ${index + 1}`}
                      </p>
                      <p className="mt-1 text-xs text-text-neutral-weak">
                        {invoice.created_at &&
                        dayjs(invoice.created_at).isValid()
                          ? dayjs(invoice.created_at).format("MMM D, YYYY")
                          : ""}{" "}
                        {invoice.status
                          ? `· ${invoice.status.replace(/_/g, " ")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {typeof invoice.amount === "number" ? (
                        <span>
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: invoice.currency || "USD",
                          }).format(invoice.amount / 100)}
                        </span>
                      ) : null}
                      {invoice.url ? (
                        <a
                          href={invoice.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-text-brand-strong underline underline-offset-4"
                        >
                          View invoice
                        </a>
                      ) : (
                        <span className="text-xs text-text-neutral-weak">
                          Invoice pending
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-neutral-weak">
                No invoices yet. Your invoices will appear here after a
                purchase.
              </p>
            )}
          </section>
        </TabsContent>
      </Tabs>
      <section aria-labelledby="promo-title" className={sectionClass}>
        <h3 id="promo-title" className="text-base font-semibold">
          Promo code
        </h3>
        <p className="mt-1 text-sm text-text-neutral-weak">
          Have a promo code? Apply it to your account.
        </p>
        <form
          onSubmit={(event) => void handlePromo(event)}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs text-text-neutral-weak">
            Code
            <Input
              disabled={promoBusy}
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
              placeholder="Enter code"
              autoComplete="off"
              maxLength={128}
              className="h-10 rounded-lg text-text-neutral-strong"
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            className="h-10 rounded-lg border border-stroke-neutral-weak bg-fill-neutral-weak px-5 text-text-neutral-strong hover:bg-fill-neutral-weaker"
            disabled={promoBusy || !promo.trim()}
          >
            {promoBusy ? "Applying…" : "Redeem"}
          </Button>
        </form>
      </section>
    </div>
  );
}
