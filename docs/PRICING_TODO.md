# Pricing & subscription — TODO checklist

Follow in order where dependencies apply. Check boxes as you complete work.

**References:** [PRICING_PRD.md](./PRICING_PRD.md), [PRICING_IMPLEMENTATION_STATUS.md](./PRICING_IMPLEMENTATION_STATUS.md), [PRICING_BACKEND_HANDOFF.md](./PRICING_BACKEND_HANDOFF.md)

---

## Phase 0 — Backend readiness (blocker for real gates)

Work happens in the **backend repo**; track there or paste tasks from the handoff doc.

- [ ] **0.1** Subscription + usage models persisted; existing users default to Free as per PRD
- [ ] **0.2** `checkFeatureAccess(userId, feature)` (or equivalent) is the single enforcement entry point
- [ ] **0.3** Gated API routes return consistent **402** (or agreed code) + JSON payload: `feature`, `requiredTier`, `message`
- [ ] **0.4** Paystack-first checkout: plans/prices, broad payment methods enabled per market/account, checkout session API, webhooks verified and **idempotent**
- [ ] **0.5** If Polar is retained: products/prices + checkout API + webhooks verified and **idempotent**
- [ ] **0.6** `POST /api/webhooks/payments?provider=polar|paystack` (or split URLs) + job queue for async processing
- [ ] **0.7** Scheduled jobs: trial expiry, promo expiry, past_due grace, optional storage reconcile
- [ ] **0.8** Frontend-consumable APIs: e.g. `GET /billing/subscription`, `POST /billing/checkout`, `POST /billing/promo/redeem`, optional `GET /billing/invoices`

---

## Phase 1 — Frontend data layer

- [x] **1.1** Add TypeScript types for subscription + usage (match backend contract)
- [x] **1.2** Extend profile/me fetch or add dedicated SWR hooks for subscription summary after login
- [x] **1.3** Define `FeatureKey` union aligned with backend `feature` strings (voice_mode, storage, etc.)

---

## Phase 2 — Subscription context & upgrade UX

- [x] **2.1** Implement `SubscriptionProvider` + `useSubscription()` with: `tier`, `status`, `trialEndsAt`, `isProOrAbove`, `isLegacy`, `canAccess(feature)` (client hint only; server still enforces)
- [x] **2.2** Central `UPGRADE_COPY` map keyed by `FeatureKey`
- [x] **2.3** `<UpgradePrompt />` with variants: `modal` | `inline` | `tooltip`; dismissible; **max once per session per gate** (e.g. `sessionStorage`)
- [x] **2.4** Trial banner in app chrome (PRD §7.3): day 1 vs day 10+ copy; hide when paid active

---

## Phase 3 — Pricing & billing pages

- [x] **3.1** Add route `/pricing` in [src/router.tsx](../src/router.tsx)
- [x] **3.2** Pricing table: Free | Pro (highlighted) | Legacy; monthly/annual toggle; Legacy lifetime where applicable
- [x] **3.3** NGN vs USD display based on locale/country (align with backend routing rules)
- [x] **3.4** Deferred features (PRD §3.4–3.5): greyed, “Coming soon” pill, non-clickable, tooltip — **no** enforcement code
- [x] **3.5** CTAs call backend checkout; redirect to the provider URL returned (backend controls routing/methods)
- [x] **3.6** Settings → **Billing** tab: current plan, status, next bill or trial end, cancel/upgrade entry points, promo field, invoices if API exists
- [x] **3.7** Update [sidebar-upgrade-card.tsx](../src/pages/dashboard/component/sidebar-upgrade-card.tsx) to point to `/pricing` or `/settings/billing` (not only `/settings/general`)

---

## Phase 4 — Launch feature gates (soft)

Wire to backend responses; do not rely on client-only security.

- [x] **4.1** **Voice mode:** before `/chat/:id/voice` or Live session — if API denies, show modal `UpgradePrompt` (not generic error) *(client hint from subscription summary; **402** handling wired where APIs return the standard gate payload — Live/session endpoints depend on backend enforcement)*
- [x] **4.2** **Supermemory:** `SUPERMEMORY_DEPENDENT_API_PATHS` in [`src/features/pricing/supermemory.ts`](../src/features/pricing/supermemory.ts) for backend alignment; use `handleSubscriptionGateError` on those mutations when shipped. PRD §6.4 keeps sync invisible on Free — no dedicated Supermemory UI in app yet.
- [x] **4.3** **Uploads:** `402` on multipart upload → toast + upgrade action; inline `UpgradePrompt` on create-memory when `subscriptionGate`; **Storage** card + shadcn `Progress` on Billing when `usage` is present
- [x] **4.4** **Time capsule:** free tier max selectable date + submit validation (6 months); calendar `maxDate` + copy; API errors → `handleSubscriptionGateError`
- [x] **4.5** **Beneficiaries:** client soft block at 2 for Free (`UpgradePrompt`); invite submit wrapped with `handleSubscriptionGateError` for API 402
- [x] **4.6** **Timed messages:** client soft block at 5 for Free from `usage.timed_message_count`; capsule create covered by **4.4** API error handling

---

## Phase 5 — QA & regression

Use PRD §10 as the master list. Minimum before ship:

- [x] **5.1** Free users: no hard redirects; existing non-gated flows unchanged *(see `overview-no-forced-pricing-redirect.test.tsx`)*
- [x] **5.2** Each launch gate: dismissible prompt; not more than once per session per gate *(see `gate-session.test.ts`, `upgrade-prompt.tsx`)*
- [x] **5.3** Pro/Legacy test accounts: no spurious prompts on gated features *(see `can-access.test.ts`, `conversation-voice-route.test.tsx` for Pro voice)*
- [x] **5.4** Pricing page: deferred rows not clickable; tooltip copy exact per PRD *(see `pricing-deferred-rows.test.tsx`)*
- [x] **5.5** E2E or integration tests for checkout redirect mock + 402 handling on one gated flow *(see `start-checkout.test.ts`, `file-upload-fetcher-subscription.test.ts`, `subscription-errors.test.ts`)*

---

## Open product decisions (PRD §11)

Track separately; unblock engineering when decided. Plain-language summary for non-developers: [PRICING_ATTENTION.md](./PRICING_ATTENTION.md) → *Business decisions your team still needs to make*.

- [ ] Cloudinary / upload caps for Pro-Legacy
- [ ] Paystack trial implementation sign-off (native flow vs DB/job-managed)
- [ ] Job queue choice (backend)
- [ ] Admin promo UI in-sprint vs later
