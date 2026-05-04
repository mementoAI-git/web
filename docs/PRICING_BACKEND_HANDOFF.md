# Backend handoff: Memento subscription & pricing

**Audience:** Backend implementer or Claude Code in the **API/backend repository**  
**Product spec:** Frontend repo [PRICING_PRD.md](./PRICING_PRD.md) (tiers, limits, trials, promo, jobs, testing ideas)  
**Frontend status:** [PRICING_IMPLEMENTATION_STATUS.md](./PRICING_IMPLEMENTATION_STATUS.md)

**Payment stack (confirmed direction):**

- **Paystack-first**: maximize supported checkout methods (card, transfer, wallet, USSD, and other methods Paystack enables per market/account).
- **Polar optional**: retain only if backend still needs a secondary provider for specific products/regions.

Replace any remaining PRD references to **Lemon Squeezy** with current providers.

---

## 1. Data model (persist)

Align with PRD §4.1–4.3.

### 1.1 `subscription` (per user)

- `user_id`  
- `tier`: `free` | `pro` | `legacy`  
- `status`: `active` | `trialing` | `past_due` | `cancelled` | `paused`  
- `billing_interval`: `monthly` | `annual` | `lifetime` | null  
- `current_period_start`, `current_period_end` (nullable for lifetime)  
- `trial_ends_at` (nullable)  
- `has_used_trial` (boolean)  
- `cancelled_at` (nullable)  
- `payment_provider`: **`polar`** | **`paystack`** (not `lemonsqueezy`)  
- `provider_customer_id`, `provider_subscription_id` (nullable; store Polar customer/subscription IDs or Paystack equivalents)  
- `promo_code_used`, `promo_expires_at` (nullable)  
- `currency`: `USD` | `NGN`  
- `country`: ISO country code  

**Migration:** Existing users → `tier = free`, `status = active`, sensible defaults for `has_used_trial`.

### 1.2 `usage` (per user)

Per PRD §4.2: `storage_used_bytes`, `beneficiary_count`, `timed_message_count`, `time_capsule_count`, `memory_integration_count`, `last_updated`.

### 1.3 `promo_code`

Per PRD §4.3.

---

## 2. Enforcement (`checkFeatureAccess`)

Implement PRD §6.1 behavior:

1. Load subscription + apply rules: trialing, promo window, past_due/cancelled after `current_period_end` → effective **free** for gating.  
2. Map **feature** → required tier + numeric limits (PRD §3.3 launch gates only).  
3. Return `{ allowed: boolean, reason?: string, requiredTier?: "pro" | "legacy" }`.

**Call this (or equivalent) from every gated path** — PRD §6.2–6.5:

- Voice / Live session initiation  
- Supermemory sync/write (free: skip silently, PRD §6.4)  
- Upload acceptance + storage accounting  
- Time capsule create (6-month rule for free)  
- Beneficiary add (max 2 free)  
- Timed message create (max 5 free)  

**HTTP:** On deny, return **402** (or team-standard) with JSON stable for frontend:

```json
{
  "error": "subscription_required",
  "feature": "voice_mode",
  "requiredTier": "pro",
  "message": "Short user-facing reason"
}
```

---

## 3. Paystack (primary)

Follow PRD §5.2:

- Plans for Pro/Legacy monthly/annual (and lifetime strategy if offered)  
- `transaction/initialize` + `metadata.user_id`  
- Webhooks: HMAC verify; `charge.success`, `subscription.create`, `subscription.disable`, `invoice.payment_failed`  
- Trials: backend-enforced (`trial_ends_at`, `has_used_trial`, scheduled downgrade if unpaid)  
- Enable as many supported payment methods as possible in Paystack dashboard/config

Set `payment_provider = paystack` at checkout initiation for Paystack flows.

---

## 4. Polar.sh (optional / secondary)

**Docs:** [Polar docs — webhooks](https://docs.polar.sh/integrate/webhooks/events), [Checkout sessions](https://docs.polar.sh/features/checkout/session)

### 4.1 Setup

- Organization + **Products** (and catalog **Prices**) for: Pro monthly, Pro annual, Legacy monthly, Legacy annual, Legacy lifetime (one-time) as product model allows.  
- Server-side **access token** (e.g. Personal Access Token or org token).  
- Webhook endpoint registered in Polar dashboard; subscribe to subscription + order + checkout events you need (see §3.3).

### 4.2 Suggested environment variables

```
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
# Catalog product IDs (or price IDs — match Polar API you use)
POLAR_PRODUCT_PRO_MONTHLY=
POLAR_PRODUCT_PRO_ANNUAL=
POLAR_PRODUCT_LEGACY_MONTHLY=
POLAR_PRODUCT_LEGACY_ANNUAL=
POLAR_PRODUCT_LEGACY_LIFETIME=
```

(Adjust names if you key checkouts by `price_id` instead of `product_id`.)

### 4.3 Checkout

- Create a **checkout session** via Polar API/SDK with the correct product(s) for the selected tier + interval.  
- Pass **`external_customer_id`** (or Polar’s documented field) = your `user.id` so webhooks reconcile to the right user.  
- Return **`checkout.url`** to the frontend for redirect.  
- Trials: implement per PRD (14 days, `has_used_trial`, card at start). Use Polar’s trial/discount features if available, or encode trial end in your DB and sync on `subscription.*` / `order.*` events — **confirm in Polar docs** for your catalog setup.

### 4.4 Webhooks (verify signature)

Polar sends a signature header (e.g. **`Polar-Signature`** — confirm current header name in Polar docs). Verify with the webhook secret before processing.

**Subscribe to events that cover at least:**

| Intent | Polar events (examples — verify names in current docs) |
|--------|--------------------------------------------------------|
| Checkout completed | `checkout.updated` / confirmed / paid flow per docs |
| Subscription created / trialing | `subscription.created`, `subscription.active` |
| Renewal / paid cycle | `order.created`, `order.paid`; check `billing_reason` where applicable |
| Payment failed | `subscription.past_due` |
| Cancel / end of access | `subscription.canceled`, `subscription.revoked`, `subscription.updated` |
| Refund | `order.refunded`, `refund.*` |

**Map events → DB** (mirror PRD Lemon Squeezy table conceptually):

- Create / trialing → set `status`, `trial_ends_at`, `provider_subscription_id`  
- Paid / active → `status = active`, tier from product mapping  
- Past due → `past_due` + notify  
- Canceled → `cancelled_at`, retain access until `current_period_end`  
- Revoked / expired → downgrade to `free` when appropriate  
- Refunded → downgrade + audit  

**Idempotency:** Store Polar `event.id` (or delivery id) and skip duplicates.

### 4.5 Provider field

When a Polar flow is used, set `payment_provider = polar` and keep provider stable for that subscription lifecycle.

---


## 5. HTTP API for frontend (contract)

Define and document:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/billing/subscription` (or under `/users/me`) | Current tier, status, trial end, renewal end, currency |
| GET | `/api/billing/usage` (optional) | Usage bytes + counts |
| POST | `/api/billing/checkout` | Body: `{ tier, interval }` (+ locale); returns `{ url }` for provider-selected checkout (Paystack-first) |
| POST | `/api/billing/promo/redeem` | Body: `{ code }` |
| GET | `/api/billing/invoices` | Optional proxy |

---

## 6. Webhooks route

PRD §9.1 pattern:

- `POST /api/webhooks/payments?provider=polar`  
- `POST /api/webhooks/payments?provider=paystack`  

Verify signature → enqueue work → respond **200** quickly. Process subscription updates in a **job queue** (BullMQ, Inngest, etc.).

---

## 7. Scheduled jobs (PRD §9.2)

- Trial expiry (hourly)  
- Promo expiry (daily)  
- Past-due > 7 days → free (daily)  
- Optional weekly `storage_used_bytes` reconciliation  

---

## 8. Promo & admin (PRD §8)

- Redemption validates code, sets tier + `promo_expires_at`, marks redemption  
- Admin code generation + CSV + campaign tags (scope per product decision)

---

## 9. Testing (backend-focused)

- Paystack webhook tamper rejection  
- Polar webhook signature rejection + idempotent replay (if Polar retained)  
- `checkFeatureAccess` matrix for all launch features × tiers  
- Trial downgrade job with test clock / fixture dates  
- 402 payload shape stable for frontend

---

## 10. Clarifications to close (PRD §11)

- Paystack method matrix: which methods are enabled by market/account  
- Trial implementation detail (Paystack flow + DB/job enforcement)
- Pro/Legacy max upload byte limit  
- Job queue choice  

---

*This document is maintained in memento-web for visibility; implementation lives in the backend repository.*
