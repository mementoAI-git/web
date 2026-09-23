# PRD: Memento Subscription & Pricing System

**Version:** 1.0
**Status:** Ready for implementation
**Stack:** React + TypeScript (frontend), Node.js (backend), Gemini (AI), Supermemory, Cloudinary, DigitalOcean Spaces
**Payment provider:** **Polar**. Checkout creation, customer portal sessions, subscription state, and webhooks are backend-owned. See [PRICING_BACKEND_HANDOFF.md](./PRICING_BACKEND_HANDOFF.md) for implementation notes.

**Implementation tracking:** [PRICING_IMPLEMENTATION_STATUS.md](./PRICING_IMPLEMENTATION_STATUS.md) · [PRICING_TODO.md](./PRICING_TODO.md)

> **Runtime implementation note (2026-08-31):** the API currently defaults to 200 MiB total storage for Free and 10 GiB for Pro and Legacy. Server-provided subscription and usage metadata is authoritative, and an administrative per-user override may change an individual limit. These implemented quotas supersede earlier aspirational storage figures in this document.

---

## 1. Overview

This PRD defines the full subscription and paywall system for Memento. The goal is to introduce three tiers — **Free**, **Pro**, and **Legacy** — with soft-gated paywalls, trial logic, promo code support, and robust checkout payment options. All existing functionality must remain intact for free users; no current behaviour should break.

---

## 2. Subscription Tiers

### 2.1 Tier Definitions

| Tier | Monthly | Annual | Lifetime |
|------|---------|--------|----------|
| Free | $0 | — | — |
| Pro | $9.99 | $79 | — |
| Legacy | $19.99 | $179 | $999 |

**Nigeria (NGN):**

| Tier | Monthly | Annual | Lifetime |
|------|---------|--------|----------|
| Pro | ₦8,000 | ₦60,000 | — |
| Legacy | ₦20,000 | ₦400,000 | — |

### 2.2 Trial
- 14-day free trial on Pro and Legacy
- Trial available once per account (tracked by `has_used_trial` flag)
- Card collected at trial start
- Auto-downgrades to Free on day 14 if no payment confirmed
- In-app nudge at day 10; email reminder at day 13

---

## 3. Feature Gates

### 3.1 Gating Philosophy
All paywalled features use **soft gates**: the feature is visible to free users but triggers an upgrade prompt when interacted with. No hard redirects. No hiding features entirely. The goal is aspiration, not punishment.

### 3.2 Feature Status

Features fall into three categories for this implementation:

- **Launch gates** — live in the codebase, gated now
- **Coming soon (V2)** — deferred 3–6 months, shown greyed out on pricing page
- **Coming soon (V3)** — deferred 6–12 months, shown greyed out on pricing page

### 3.3 Launch Gates (Implement Now)

These are the only features to gate in this sprint. Everything else is UI-only.

| Feature | Free Limit | Pro | Legacy |
|---------|-----------|-----|--------|
| Voice mode in chat | ❌ | ✅ | ✅ |
| Supermemory integration | ❌ | ✅ | ✅ |
| Upload quality | Client may compress; server enforces quota | Client may retain higher quality; server enforces quota | Client may retain higher quality; server enforces quota |
| Total storage | 200 MiB default | 10 GiB default | 10 GiB default |
| Time capsule window | 6 months max from creation date | Unlimited | Unlimited |
| Beneficiaries | 2 | Unlimited | Unlimited |
| Timed messages | 5 | 50 | Unlimited |

### 3.4 Deferred Features (Coming Soon — Do Not Gate Yet)

These should appear on the pricing page greyed out with a "Coming soon" or "On the roadmap" label. Do not build enforcement logic for these in this sprint — no stubs, no placeholders in the access control layer.

| Feature | Planned Tier | Target |
|---------|-------------|--------|
| Weekly insights (server-generated) | Pro + Legacy | V2 |
| Advanced privacy controls | Pro + Legacy | V2 |
| Memory integrations (Drive, Gmail) | Pro (1–3) / Legacy (unlimited) | V2 |
| Legacy vault | Legacy | V3 |
| Curator | Legacy | V3 |
| 50-year hosting guarantee | Legacy | V3 |
| Family archive | Legacy | V3 |
| Voice cloning | Legacy | V3 |

### 3.5 Pricing Page Treatment for Deferred Features

Render deferred features in the pricing table as:
- Greyed out text (opacity ~50%)
- Small "Coming soon" pill badge next to the feature name
- No interactive element — not clickable, no upgrade prompt
- Tooltip on hover: "This feature is on our roadmap and coming soon."

This signals future value to convert Legacy subscribers early without overpromising.

### 3.6 Upgrade Prompt Behaviour
When a free user hits a gate:
- A modal or inline prompt appears: short benefit statement + CTA ("Upgrade to Pro")
- Prompt must not interrupt data entry already in progress (e.g. if user is typing a reflection, gate triggers on submit, not on keystroke)
- Prompt is dismissible; user can close and stay on Free
- Prompts should not appear more than once per session per feature gate (suppress repeat prompts within the same session)

---

## 4. Data Model (Suggested — Implementation Agnostic)

These are the fields your team needs to store and keep in sync. How they're structured (SQL tables, document collections, etc.) is at your devs' discretion.

### 4.1 User Subscription Record

```
subscription {
  user_id
  tier                    // "free" | "pro" | "legacy"
  status                  // "active" | "trialing" | "past_due" | "cancelled" | "paused"
  billing_interval        // "monthly" | "annual" | "lifetime" | null
  current_period_start    // timestamp
  current_period_end      // timestamp
  trial_ends_at           // timestamp | null
  has_used_trial          // boolean
  cancelled_at            // timestamp | null
  payment_provider        // "polar"
  provider_customer_id    // external ID from payment provider
  provider_subscription_id
  promo_code_used         // string | null
  promo_expires_at        // timestamp | null (for gifted/promo access)
  currency                // "USD" | "NGN"
  country                 // ISO country code
}
```

### 4.2 Usage Tracking Record

Track usage against limits in real time. Check these before allowing an action.

```
usage {
  user_id
  storage_used_bytes      // increment on upload, decrement on delete
  beneficiary_count       // increment/decrement as beneficiaries are added/removed
  timed_message_count     // increment on creation
  time_capsule_count      // increment on creation
  memory_integration_count
  last_updated            // timestamp
}
```

### 4.3 Promo Code Record

```
promo_code {
  code                    // unique string e.g. "MEMENTO-WIN-XXXX"
  grants_tier             // "pro" | "legacy"
  duration_days           // e.g. 30 | 60 | 90
  created_by              // admin user ID
  redeemed_by             // user_id | null
  redeemed_at             // timestamp | null
  expires_at              // timestamp (code expiry if unredeemed)
  campaign_tag            // string for tracking e.g. "instagram-may-2025"
}
```

---

## 5. Payment Provider Integration

### 5.1 Checkout strategy

Use a backend-controlled Polar checkout strategy.

- The frontend should call one checkout endpoint (`POST /billing/checkout`) and redirect to the returned URL.
- The backend selects the Polar product and interval.
- Do not hardcode provider logic in frontend.

Store `payment_provider` on the subscription record at checkout initiation when applicable.

### 5.2 Polar (Current provider)

**Billing platform** for non–Nigeria checkouts: products, checkout sessions, subscriptions, and webhooks. Confirm current tax and compliance posture for your regions in [Polar’s documentation](https://docs.polar.sh); do not assume MoR parity with legacy Lemon Squeezy without verification.

**Setup:**
- Polar organization; create **Products** (and catalog **Prices**) for: Pro Monthly, Pro Annual, Legacy Monthly, Legacy Annual, Legacy Lifetime (one-time or subscription per Polar’s model).
- Server-side **access token** and webhook endpoint registered in the Polar dashboard.
- Map each sellable SKU to a stable identifier (e.g. `product_id` or `price_id`) stored in environment variables.

**Key environment variables (names are illustrative — align with your Polar API usage):**
```
POLAR_ACCESS_TOKEN
POLAR_WEBHOOK_SECRET
POLAR_PRODUCT_PRO_MONTHLY
POLAR_PRODUCT_PRO_ANNUAL
POLAR_PRODUCT_LEGACY_MONTHLY
POLAR_PRODUCT_LEGACY_ANNUAL
POLAR_PRODUCT_LEGACY_LIFETIME
```

**Checkout creation:**
- Use Polar’s **Checkout API** or SDK to create a checkout session for the selected product(s).
- Pass **`external_customer_id`** (or the field Polar documents for your user id) = your app’s `user.id` so webhooks and customer records reconcile.
- Return the session **`url`** to the frontend for redirect.

**14-day trial (PRD §2.2):** Implement using Polar’s supported trial or introductory pricing options where available; otherwise record `trial_ends_at` in your DB when checkout completes and enforce downgrade via scheduled jobs (see §9.2). Ensure `has_used_trial` is enforced in your backend.

**Webhooks to handle (Polar event names — subscribe to the full set your integration needs; confirm in current Polar docs):**

| Polar event (examples) | Action |
|------------------------|--------|
| `subscription.created` | Create or link subscription; set `provider_subscription_id`; if trialing, set `status = trialing`, `trial_ends_at` |
| `subscription.active` | Set `status = active`, sync tier from product mapping, sync period dates |
| `subscription.updated` | Catch-all for status transitions (cancel scheduled, uncancel, etc.); sync `current_period_*` |
| `subscription.past_due` | Set `past_due`, trigger in-app + email alert |
| `subscription.canceled` | Set `cancelled_at` where applicable; keep access until `current_period_end` (end-of-period cancel) |
| `subscription.revoked` | Subscription ended; downgrade to `free` when access must end |
| `order.created` / `order.paid` | Confirm payment; use `billing_reason` where documented (`subscription_create`, `subscription_cycle`, etc.) |
| `order.refunded` | Downgrade tier, mark refunded |

**Verify all webhooks** using Polar’s documented signature scheme and **`POLAR_WEBHOOK_SECRET`** before processing. Process deliveries **idempotently** (e.g. store event id, ignore duplicates).

---


## 6. Enforcement Layer (Backend)

### 6.1 `checkFeatureAccess(userId, feature)` Utility

Create a single reusable utility function that all feature endpoints call before executing. This is the single source of truth for access control.

```
checkFeatureAccess(userId, feature) → { allowed: boolean, reason?: string, requiredTier?: string }
```

This function should:
1. Fetch the user's current `tier` and `status` from the subscription record
2. If `status` is `past_due` or `cancelled` and `current_period_end` has passed → treat as Free
3. If `promo_expires_at` is set and not expired → honour promo tier
4. Cross-reference against the feature gate map
5. Return `{ allowed: true }` or `{ allowed: false, requiredTier: "pro" }`

All API routes that touch gated features must call this before proceeding.

### 6.2 Storage Enforcement

Before every upload:
1. Fetch `usage.storage_used_bytes` for the user
2. Compare against the effective API limit (defaults: Free 200 MiB, Pro/Legacy 10 GiB; configuration or an admin override may differ)
3. If limit exceeded → reject upload with `402` status and upgrade prompt payload
4. On successful upload → increment `storage_used_bytes`
5. On file deletion → decrement `storage_used_bytes`

**Cloudinary:** Apply transformation restrictions at upload time. Free users: pass `quality: "auto", fetch_format: "auto", width: 1920` (caps at 1080p effective). Pro/Legacy: pass original quality flag.

**DigitalOcean Spaces:** Used for documents, exports, raw files. Apply size caps at the API layer before sending to DO — do not rely on DO-side enforcement.

### 6.3 Time Capsule Enforcement

On time capsule creation:
- Free users: reject any `delivery_date` more than 6 months from `created_at`
- Return soft gate payload if violated (do not silently cap the date)

### 6.4 Supermemory Enforcement

The Supermemory sync pipeline should check tier before writing:
```
if (user.tier === "free") → skip sync, return silently (do not error)
```
Free users can still use chat — Supermemory just doesn't persist their context cross-session. This is invisible to the user unless they're on Pro and notice the difference.

### 6.5 Voice Mode Enforcement

Before initiating a voice session in chat:
- Call `checkFeatureAccess(userId, "voice_mode")`
- If `allowed: false` → return upgrade prompt payload to frontend, do not initiate session

---

## 7. Frontend Implementation

### 7.1 Subscription Context

Create a `SubscriptionContext` (React context) available app-wide:

```ts
{
  tier: "free" | "pro" | "legacy"
  status: "active" | "trialing" | "past_due" | "cancelled"
  trialEndsAt: Date | null
  isProOrAbove: boolean
  isLegacy: boolean
  canAccess: (feature: FeatureKey) => boolean
}
```

All components check `canAccess(feature)` from context — never hardcode tier checks inline.

### 7.2 `<UpgradePrompt />` Component

A reusable component that renders the soft gate prompt. Props:

```ts
{
  feature: FeatureKey         // e.g. "voice_mode", "supermemory"
  requiredTier: "pro" | "legacy"
  variant: "modal" | "inline" | "tooltip"
  onDismiss: () => void
}
```

- **modal:** Full overlay with benefit description + CTA. Use for high-value features (voice, Supermemory).
- **inline:** Banner within the UI element. Use for limits (storage, beneficiaries).
- **tooltip:** Hover/tap tooltip. Use for locked settings or toggle switches.

The component should pull copy from a central `UPGRADE_COPY` map keyed by `FeatureKey` so copy is easy to update without touching component logic.

### 7.3 Trial Banner

Show a persistent but dismissible banner in the app header during trial:

```
"You're on a 14-day Pro trial — X days remaining. [Upgrade now →]"
```

- Visible from day 1 of trial
- Changes urgency tone from day 10: "Your trial ends in X days."
- Disappears on active paid subscription

### 7.4 Pricing Page (`/pricing`)

- Three columns: Free, Pro (highlighted "Most Popular"), Legacy
- Toggle: Monthly / Annual (default to Annual)
- Annual shows per-month equivalent price + "Pay for X months, get Y free" label
- Legacy shows Lifetime option as a third billing option
- Detect locale and render ₦ or $ pricing automatically
- CTA states: "Get started free" / "Start 14-day trial" / "Start 14-day trial"
- All CTAs route to backend checkout URL; backend decides provider/method availability

### 7.5 Settings → Billing Tab

- Current plan + status
- Next billing date / trial end date
- Upgrade / downgrade / cancel controls
- Invoice history (pull from provider API)
- Promo code redemption field

---

## 8. Promo Code & Gifting System

### 8.1 Redemption Flow

1. User enters promo code in Settings → Billing or at signup
2. Backend validates: code exists, not expired, not already redeemed
3. On valid code: set `tier` to granted tier, set `promo_expires_at = now + duration_days`
4. On `promo_expires_at`: run a scheduled job to revert tier to Free (or previous paid tier if applicable)
5. Mark code as `redeemed_by` + `redeemed_at`

### 8.2 Code Generation (Admin)

Admin dashboard needs a simple UI to:
- Generate N codes for a given tier + duration
- Assign a `campaign_tag` for tracking
- Export codes as CSV for social/marketing use
- View redemption rate per campaign

---

## 9. Webhooks & Scheduled Jobs

### 9.1 Webhook Endpoint

Single endpoint: `POST /api/webhooks/payments`

Route to provider-specific handler based on a `provider` query param or header:
```
POST /api/webhooks/payments?provider=polar
```

Always verify signature before processing. Return `200` immediately even if processing is async — use a job queue for actual subscription updates to avoid timeout issues.

### 9.2 Scheduled Jobs

| Job | Frequency | Action |
|-----|-----------|--------|
| Trial expiry check | Every hour | Find users where `trial_ends_at < now` and `status = trialing` with no successful charge → downgrade to Free |
| Promo expiry check | Daily | Find users where `promo_expires_at < now` → revert tier |
| Past-due grace period | Daily | If `status = past_due` for >7 days → downgrade to Free, send final email |
| Storage recalculation | Weekly | Recalculate `storage_used_bytes` from actual files as a consistency check |

---

## 10. Testing Checklist

After implementation, verify each of the following before shipping:

### Subscription & Payments
- [ ] Free user can sign up and use all Free features without hitting any paywalls
- [ ] Pro trial initiates correctly — `status = trialing`, `trial_ends_at` set correctly
- [ ] Legacy trial initiates correctly
- [ ] Trial auto-downgrades to Free on day 14 with no payment (test with mocked date)
- [ ] Checkout opens correctly for users in supported markets
- [ ] Polar checkout opens the expected product and interval
- [ ] Successful payment activates subscription: `status = active`, `tier` updated
- [ ] Failed payment sets `status = past_due`, user sees in-app alert
- [ ] Cancellation keeps access until `current_period_end`, then downgrades
- [ ] Annual plan shows correct per-month breakdown on pricing page
- [ ] Legacy lifetime checkout completes and sets `billing_interval = lifetime` with no `current_period_end`
- [ ] Webhook signature verification rejects tampered payloads
- [ ] Duplicate webhook events are idempotent (processing twice doesn't double-apply)

### Feature Gates (Launch Scope Only)
- [ ] Free user triggering voice mode sees upgrade prompt (modal), not an error
- [ ] Free user triggering Supermemory-dependent feature sees upgrade prompt
- [ ] Free user uploading beyond the server-provided storage limit sees inline upgrade prompt
- [ ] Free user setting time capsule delivery date beyond 6 months sees upgrade prompt on submit
- [ ] Free user adding a 3rd beneficiary sees upgrade prompt
- [ ] Free user creating a 6th timed message sees upgrade prompt
- [ ] Pro user accesses all launch Pro features without prompts
- [ ] Legacy user accesses all launch Legacy features without prompts
- [ ] Upgrade prompt is dismissible without interrupting existing data entry
- [ ] Upgrade prompt does not appear more than once per session per gate

### Deferred Features (Pricing Page Only)
- [ ] All deferred features render greyed out on the pricing page
- [ ] "Coming soon" pill badge appears next to each deferred feature
- [ ] Greyed-out features are not clickable and show no upgrade prompt
- [ ] Hover tooltip reads correctly: "This feature is on our roadmap and coming soon."
- [ ] No enforcement logic exists in the codebase for deferred features

### Storage & Media
- [ ] Free user upload is compressed (image capped at 1080p, video at 480p) via Cloudinary
- [ ] Pro/Legacy user upload serves original quality
- [ ] `storage_used_bytes` increments correctly on upload
- [ ] `storage_used_bytes` decrements correctly on file deletion
- [ ] Storage indicator in UI reflects accurate usage

### Promo Codes
- [ ] Valid promo code grants correct tier for correct duration
- [ ] Expired promo code is rejected with clear error message
- [ ] Already-redeemed code is rejected
- [ ] Promo access reverts to Free on `promo_expires_at`
- [ ] Admin can generate, tag, and export promo codes
- [ ] Campaign redemption rate is visible in admin dashboard

### Trial UX
- [ ] Trial banner appears with correct days remaining
- [ ] Banner copy shifts to urgency tone from day 10
- [ ] Banner disappears on active paid subscription
- [ ] Day 10 in-app nudge triggers correctly
- [ ] Day 13 email reminder is sent
- [ ] `has_used_trial` prevents a second trial on the same account

### Billing Settings
- [ ] Current plan, status, and next billing date are accurate
- [ ] Invoice history loads from provider
- [ ] Upgrade flow from Settings works end-to-end
- [ ] Downgrade flow confirms access continues until period end
- [ ] Cancellation includes a confirmation step and does not immediately revoke access

### Regression (Existing Functionality)
- [ ] All existing Free-tier features work exactly as before — no regressions
- [ ] Chat, reflections, journaling, file uploads within limits all unaffected
- [ ] Beneficiary dashboard unaffected
- [ ] Existing users (pre-subscription) are correctly defaulted to Free tier
- [ ] No console errors or broken UI states from `SubscriptionContext`
- [ ] Insights modal (UI) renders correctly for all tiers — no breakage

---

## 11. Open Items for Devs to Confirm

- [ ] Confirm Cloudinary plan and transformation credit budget for HD uploads
- [ ] Confirm DigitalOcean Spaces pricing tier and storage ceiling
- [ ] Define exact upload size cap for Pro/Legacy (200MB or higher?)
- [ ] Finalize Polar trial implementation (catalog behavior vs DB/job-managed flow)
- [ ] Decide job queue solution for async webhook processing (e.g. BullMQ, Inngest)
- [ ] Confirm admin dashboard scope — is promo code UI part of this sprint or separate?

---

*v1.0 — Memento Pricing PRD*
