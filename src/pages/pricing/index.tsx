import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utility";
import { startCheckout } from "@/features/pricing/start-checkout";
import type { PlanTier } from "@/features/pricing/types";

type BillingInterval = "monthly" | "annual";

function detectCurrency(): "USD" | "NGN" {
  if (typeof navigator === "undefined") return "USD";
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return region === "NG" ? "NGN" : "USD";
  } catch {
    return "USD";
  }
}

const USD = {
  pro: { monthly: 9.99, annual: 79 },
  legacy: { monthly: 19.99, annual: 179, lifetime: 999 },
} as const;

const NGN = {
  pro: { monthly: 8000, annual: 60000 },
  legacy: { monthly: 20000, annual: 400000, lifetime: 400000 },
} as const;

type DeferredRow = { name: string; tier: string; target: string };

const DEFERRED_FEATURES: DeferredRow[] = [
  { name: "Weekly insights (server-generated)", tier: "Pro + Legacy", target: "V2" },
  { name: "Advanced privacy controls", tier: "Pro + Legacy", target: "V2" },
  { name: "Memory integrations (Drive, Gmail)", tier: "Pro / Legacy", target: "V2" },
  { name: "Legacy vault", tier: "Legacy", target: "V3" },
  { name: "Curator", tier: "Legacy", target: "V3" },
  { name: "50-year hosting guarantee", tier: "Legacy", target: "V3" },
  { name: "Family archive", tier: "Legacy", target: "V3" },
  { name: "Voice cloning", tier: "Legacy", target: "V3" },
];

function formatMoney(amount: number, currency: "USD" | "NGN") {
  const locale = currency === "NGN" ? "en-NG" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(amount);
}

export default function PricingPage() {
  const navigate = useNavigate();
  const currency = useMemo(() => detectCurrency(), []);
  const table = currency === "NGN" ? NGN : USD;
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [checkoutLoading, setCheckoutLoading] = useState<PlanTier | null>(null);
  const [lifetimeLoading, setLifetimeLoading] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const runCheckout = useCallback(
    async (tier: PlanTier, billing: BillingInterval | "lifetime") => {
      if (!origin) return;
      if (billing === "lifetime") {
        setLifetimeLoading(true);
      } else {
        setCheckoutLoading(tier);
      }
      try {
        const url = await startCheckout({
          success_url: `${origin}/settings/billing?checkout=success`,
          cancel_url: `${origin}/pricing?checkout=cancel`,
          tier,
          interval: billing,
        });
        window.location.href = url;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not start checkout");
      } finally {
        setCheckoutLoading(null);
        setLifetimeLoading(false);
      }
    },
    [origin],
  );

  const proPrice =
    interval === "annual" ? table.pro.annual / 12 : table.pro.monthly;
  const legacyPrice =
    interval === "annual" ? table.legacy.annual / 12 : table.legacy.monthly;

  return (
    <div className="page-viewport hide-scrollbar w-full px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="font-garamond text-3xl font-medium text-v3-text-strong sm:text-4xl">
            Plans that grow with your memories
          </h1>
          <p className="mt-3 font-inter text-sm text-v3-text-weak sm:text-base">
            {currency === "NGN" ?
              "Prices shown in Nigerian Naira." :
              "Prices shown in US dollars."}{" "}
            Checkout supports multiple payment methods through provider-supported options.
          </p>
          <div
            className="mt-6 inline-flex rounded-full border border-v3-stroke-weak bg-v3-fill-weaker p-1"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              className={cn(
                "rounded-full px-4 py-2 font-inter text-sm font-medium motion-safe:transition-colors",
                interval === "monthly" ?
                  "bg-white text-v3-text-strong shadow-sm" :
                  "text-v3-text-weak hover:text-v3-text-strong",
              )}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-4 py-2 font-inter text-sm font-medium motion-safe:transition-colors",
                interval === "annual" ?
                  "bg-white text-v3-text-strong shadow-sm" :
                  "text-v3-text-weak hover:text-v3-text-strong",
              )}
              onClick={() => setInterval("annual")}
            >
              Annual
            </button>
          </div>
          {interval === "annual" ? (
            <p className="mt-2 font-inter text-xs text-v3-text-weak">
              Annual billing — per-month equivalent shown below.
            </p>
          ) : null}
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free */}
          <section
            className="flex flex-col rounded-3xl border border-v3-stroke-weak bg-white p-6 shadow-sm"
            aria-labelledby="plan-free"
          >
            <h2 id="plan-free" className="font-garamond text-xl font-semibold text-v3-text-strong">
              Free
            </h2>
            <p className="mt-1 font-inter text-sm text-v3-text-weak">
              Capture and reflect at your own pace.
            </p>
            <p className="mt-6 font-garamond text-3xl font-medium text-v3-text-strong">
              {formatMoney(0, currency)}
              <span className="font-inter text-sm font-normal text-v3-text-weak">/mo</span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 rounded-full"
              onClick={() => navigate("/overview")}
            >
              Get started free
            </Button>
            <ul className="mt-8 flex flex-col gap-3 font-inter text-sm text-v3-text-strong">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                Core chat &amp; memories
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                Standard uploads &amp; limits (PRD)
              </li>
            </ul>
          </section>

          {/* Pro */}
          <section
            className="relative flex flex-col rounded-3xl border-2 border-v3-fill-strong bg-white p-6 shadow-md md:-mt-2 md:pb-8"
            aria-labelledby="plan-pro"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-v3-fill-strong px-3 py-1 font-inter text-xs font-semibold text-white">
              Most popular
            </span>
            <h2 id="plan-pro" className="font-garamond text-xl font-semibold text-v3-text-strong">
              Pro
            </h2>
            <p className="mt-1 font-inter text-sm text-v3-text-weak">
              For power users who live in Memento daily.
            </p>
            <p className="mt-6 font-garamond text-3xl font-medium text-v3-text-strong">
              {formatMoney(proPrice, currency)}
              <span className="font-inter text-sm font-normal text-v3-text-weak">/mo</span>
            </p>
            {interval === "annual" ? (
              <p className="mt-1 font-inter text-xs text-v3-text-weak">
                Billed as {formatMoney(table.pro.annual, currency)} per year
              </p>
            ) : null}
            <Button
              type="button"
              className="mt-6 rounded-full"
              disabled={checkoutLoading !== null || lifetimeLoading}
              onClick={() => void runCheckout("pro", interval)}
            >
              {checkoutLoading === "pro" ? "Opening checkout…" : "Start 14-day trial"}
            </Button>
            <ul className="mt-8 flex flex-col gap-3 font-inter text-sm text-v3-text-strong">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                Voice mode
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                Supermemory
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                Higher limits &amp; storage
              </li>
            </ul>
          </section>

          {/* Legacy */}
          <section
            className="flex flex-col rounded-3xl border border-v3-stroke-weak bg-white p-6 shadow-sm"
            aria-labelledby="plan-legacy"
          >
            <h2 id="plan-legacy" className="font-garamond text-xl font-semibold text-v3-text-strong">
              Legacy
            </h2>
            <p className="mt-1 font-inter text-sm text-v3-text-weak">
              Maximum preservation and future roadmap perks.
            </p>
            <p className="mt-6 font-garamond text-3xl font-medium text-v3-text-strong">
              {formatMoney(legacyPrice, currency)}
              <span className="font-inter text-sm font-normal text-v3-text-weak">/mo</span>
            </p>
            {interval === "annual" ? (
              <p className="mt-1 font-inter text-xs text-v3-text-weak">
                Billed as {formatMoney(table.legacy.annual, currency)} per year
              </p>
            ) : null}
            <p className="mt-4 font-inter text-sm text-v3-text-weak">
              Lifetime:{" "}
              {currency === "NGN" ? (
                <span className="font-medium text-v3-text-strong">—</span>
              ) : (
                <span className="font-medium text-v3-text-strong">
                  {formatMoney(table.legacy.lifetime, currency)}
                </span>
              )}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 rounded-full"
              disabled={checkoutLoading !== null || lifetimeLoading}
              onClick={() => void runCheckout("legacy", interval)}
            >
              {checkoutLoading === "legacy" ? "Opening checkout…" : "Start 14-day trial"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full rounded-full"
              disabled={checkoutLoading !== null || lifetimeLoading}
              onClick={() => void runCheckout("legacy", "lifetime")}
            >
              {lifetimeLoading ? "Opening checkout…" : "Buy lifetime"}
            </Button>
          </section>
        </div>

        <section className="mt-14" aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading" className="font-garamond text-2xl font-medium text-v3-text-strong">
            On the roadmap
          </h2>
          <p className="mt-2 max-w-2xl font-inter text-sm text-v3-text-weak">
            These items are shown for transparency. They are not available to purchase yet and have no enforcement in the app.
          </p>
          <ul className="mt-6 divide-y divide-v3-stroke-weak rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker/40">
            {DEFERRED_FEATURES.map((row) => (
              <li
                key={row.name}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span
                  className="pointer-events-none select-none font-inter text-sm text-v3-text-strong/50"
                  title="This feature is on our roadmap and coming soon."
                >
                  {row.name}
                  <span className="ml-2 inline-flex rounded-full bg-v3-fill-weak px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-v3-text-weak">
                    Coming soon
                  </span>
                </span>
                <span className="font-inter text-xs text-v3-text-weak/70">
                  {row.tier} · {row.target}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
