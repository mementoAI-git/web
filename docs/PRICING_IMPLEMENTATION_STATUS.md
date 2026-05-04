# Pricing & subscription — implementation status (frontend)

**Primary spec:** [PRICING_PRD.md](./PRICING_PRD.md)  
**Payment integration:** Frontend calls `POST /billing/checkout` and redirects to the payment URL returned by backend. Provider routing and available payment methods are backend-controlled (Paystack-first direction).

**Last reviewed:** 2026-04-21 (memento-web repo)

---

## Summary

The **frontend** pricing experience from the PRD is **implemented** through Phase 5 of [PRICING_TODO.md](./PRICING_TODO.md): subscription summary + context, `/pricing`, Billing tab, trial banner, soft gates, checkout client, upload **402** handling, and targeted tests. **Real enforcement, checkout sessions, webhooks, and billing truth** still require **Phase 0 (backend)** — see [PRICING_ATTENTION.md](./PRICING_ATTENTION.md) for a plain-language view.

---

## What exists today (memento-web)

| Area | Status | Where / notes |
| ------ | -------- | ---------------- |
| Subscription summary + types | **Done** | `src/features/pricing/types.ts`, `use-subscription-summary.ts`, profile merge in hook |
| `SubscriptionProvider` / `useSubscription()` / `canAccess` | **Done** | `src/contexts/subscription.tsx`, `can-access.ts` |
| `/pricing` page | **Done** | `src/pages/pricing/` — tiers, NGN/USD, deferred roadmap rows, checkout CTAs |
| `<UpgradePrompt />` + `UPGRADE_COPY` + session dismiss | **Done** | `upgrade-prompt.tsx`, `gate-session.ts` |
| Trial banner | **Done** | `src/components/trial-banner.tsx` |
| Settings → Billing | **Done** | `src/components/modal/settings/billing.tsx`, storage card + Progress when usage exists |
| Checkout client | **Done** | `start-checkout.ts`, calls `POST /billing/checkout`; MSW + unit test |
| Feature gates (launch scope) | **Done (soft + 402 paths)** | Voice paywall, memory create upload gate, capsule window + errors, beneficiaries/timed messages, `supermemory.ts` placeholder for API paths |
| Sidebar upgrade card | **Done** | Links to `/pricing` |
| Tests (Phase 5) | **Done** | e.g. `pricing-deferred-rows`, `start-checkout`, `gate-session`, `subscription-errors`, `can-access`, voice route (Pro), overview no forced pricing redirect, `file-upload-fetcher-subscription` |

---

## Backend dependency

Authoritative tier, usage, webhooks, and checkout creation live in the **API**. The app consumes documented responses and shows soft gates; **402** + JSON on gated routes is required for consistent UX. See [PRICING_BACKEND_HANDOFF.md](./PRICING_BACKEND_HANDOFF.md) and **Phase 0** in [PRICING_TODO.md](./PRICING_TODO.md).

---

## Related docs

- [PRICING_TODO.md](./PRICING_TODO.md) — checklist (Phases 1–5 frontend; Phase 0 backend)
- [PRICING_ATTENTION.md](./PRICING_ATTENTION.md) — non-technical launch and support notes
- [PRICING_BACKEND_HANDOFF.md](./PRICING_BACKEND_HANDOFF.md) — API contract brief
