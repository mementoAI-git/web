import { useCallback, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

import endpoint from "@/api/endpoint";
import { fetcher, postFetcher } from "@/api/fetcher";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/subscription";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { openCustomerPortal } from "@/features/pricing/open-customer-portal";
import { cn } from "@/utility";
import { SettingsSectionCard } from "./settings-section-card";
import { StorageUsageCard } from "@/features/pricing/storage-usage-card";
import { normalizeInvoices } from "@/features/pricing/billing-adapters";
import type { BillingInvoice } from "@/features/pricing/types";

export default function Billing() {
  const navigate = useNavigate();
  const { summary, isLoading, refresh, isProOrAbove } = useSubscription();
  const { canUse } = useFeatureFlags();
  const canViewSummary = canUse("billing.subscription_summary", true);
  const canOpenPortal = canUse("billing.portal", true);
  const canCheckout = canUse("billing.checkout", true);
  const canViewUsage = canUse("billing.usage_limits", true);
  const [promo, setPromo] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const { data: invoicesEnvelope } = useSWR(
    isProOrAbove ? endpoint.billingInvoices : null,
    async (url: string) => normalizeInvoices(await fetcher(url)),
  );

  const renewLabel = useCallback(() => {
    if (!summary) return "—";
    if (summary.trial_ends_at && summary.status === "trialing") {
      const d = dayjs(summary.trial_ends_at);
      return d.isValid() ? `Trial ends ${d.format("MMM D, YYYY")}` : "Trial active";
    }
    if (summary.current_period_end) {
      const d = dayjs(summary.current_period_end);
      return d.isValid() ? `Renews ${d.format("MMM D, YYYY")}` : "—";
    }
    return "—";
  }, [summary]);

  const handlePortal = async () => {
    const origin = window.location.origin;
    setPortalBusy(true);
    try {
      const url = await openCustomerPortal(`${origin}/settings/billing`);
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setPortalBusy(false);
    }
  };

  const handlePromo = async () => {
    const code = promo.trim();
    if (!code) {
      toast.error("Enter a promo code");
      return;
    }
    setPromoBusy(true);
    try {
      const res = await postFetcher(endpoint.billingPromoRedeem, { arg: { code } });
      if (!res?.success) {
        toast.error(typeof res?.message === "string" ? res.message : "Could not redeem code");
        return;
      }
      toast.success("Promo applied");
      setPromo("");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not redeem code");
    } finally {
      setPromoBusy(false);
    }
  };

  const invoices: BillingInvoice[] | undefined = invoicesEnvelope;

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h2 className="font-garamond text-2xl font-medium text-v3-text-strong">Billing</h2>
        <p className="mt-1 font-inter text-sm text-v3-text-weak">
          Manage your subscription, trials, and invoices.
        </p>
      </div>

      <SettingsSectionCard title="Current plan">
        {isLoading ? (
          <p className="font-inter text-sm text-v3-text-weak">Loading subscription…</p>
        ) : !canViewSummary ? (
          <p className="font-inter text-sm text-v3-text-weak">
            Subscription summary is currently unavailable.
          </p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-inter text-xs font-medium uppercase tracking-wide text-v3-text-weak">
                Plan
              </dt>
              <dd className="mt-1 font-inter text-sm font-semibold capitalize text-v3-text-strong">
                {summary?.tier ?? "free"}
              </dd>
            </div>
            <div>
              <dt className="font-inter text-xs font-medium uppercase tracking-wide text-v3-text-weak">
                Status
              </dt>
              <dd className="mt-1 font-inter text-sm font-semibold capitalize text-v3-text-strong">
                {summary?.status?.replace(/_/g, " ") ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-inter text-xs font-medium uppercase tracking-wide text-v3-text-weak">
                Billing / trial
              </dt>
              <dd className="mt-1 font-inter text-sm text-v3-text-strong">{renewLabel()}</dd>
            </div>
          </dl>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className={cn("rounded-full")}
            disabled={!canOpenPortal || !isProOrAbove || portalBusy}
            onClick={() => void handlePortal()}
          >
            {!canOpenPortal ? "Portal unavailable" : portalBusy ? "Opening…" : "Manage billing"}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canCheckout}
            onClick={() => navigate("/pricing")}
          >
            {!canCheckout ? "Checkout unavailable" : isProOrAbove ? "Change plan" : "Upgrade"}
          </Button>
        </div>
      </SettingsSectionCard>

      {!isLoading && summary && canViewUsage ? (
        <StorageUsageCard usage={summary.usage} isProOrAbove={isProOrAbove} />
      ) : null}

      <SettingsSectionCard title="Promo code">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 font-inter text-sm">
            <span className="text-v3-text-weak">Code</span>
            <input
              type="text"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              className={cn(
                "h-10 rounded-xl border border-v3-stroke-weak bg-bg-neutral px-3 font-inter text-sm text-v3-text-strong",
                "outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong",
              )}
              placeholder="Enter code"
              autoComplete="off"
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            disabled={promoBusy}
            onClick={() => void handlePromo()}
          >
            {promoBusy ? "Applying…" : "Redeem"}
          </Button>
        </div>
      </SettingsSectionCard>

      {isProOrAbove ? (
        <SettingsSectionCard title="Invoices">
          {invoices && invoices.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {invoices.map((inv, i) => (
                <li key={i}>
                  {inv.url ?
                    <a
                      href={inv.url}
                      className="font-inter text-sm font-medium text-v3-text-strong underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {inv.label ?? `Invoice ${i + 1}`}
                    </a>
                  :
                    <span className="font-inter text-sm text-v3-text-weak">
                      {inv.label ?? `Invoice ${i + 1}`}
                    </span>
                  }
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-inter text-sm text-v3-text-weak">
              No invoices returned yet. They appear here when your billing provider exposes them.
            </p>
          )}
        </SettingsSectionCard>
      ) : null}
    </div>
  );
}
