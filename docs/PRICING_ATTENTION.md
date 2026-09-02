# Pricing & subscriptions — what you should know

This note is for **product and business readers**, not engineers. It explains what the app and API do today around pricing and what still needs operational sign-off before launch.

---

## The big idea

- Memento’s **website app** (this project) can show **plans**, **upgrade buttons**, and **gentle “please upgrade” prompts** when someone hits a limit.
- **Only the API** truly enforces who is allowed to do what (payments, trials, and real limits). The web app uses the same metadata for friendly prompts, but the API remains the source of truth.

The code-level backend work in **Phase 0** of [PRICING_TODO.md](./PRICING_TODO.md) is implemented. This is not the same as a live launch: Polar products and secrets, production migrations, webhook delivery, checkout return URLs, portal/invoice behavior, and rollback must still be exercised in staging.

---

## What works in the app today (frontend)

- A **Pricing** page with Free, Pro, and Legacy, prices in **dollars or naira** based on the user’s device language/region.
- **Settings → Billing**: plan name, status, trial/renewal text, promo code field, link to manage billing, and a **storage bar** *if* the server sends usage data.
- **Trial banner** (when the server says the user is on a trial and sends a trial end date).
- **Soft gates** (polite prompts, not harsh lockouts) for things like **voice mode**, **storage**, **beneficiaries**, **timed messages**, and **how far ahead** a free user can schedule a time capsule—using a mix of **what the server tells us** and **sensible defaults** when the server is not ready yet.

---

## What still needs launch sign-off

These are **not** optional for a real launch, even though the supporting code exists:

1. Configure the Polar products, prices, trial rules, webhook secret, and allowed return URLs for the target environment.
2. Run production migrations and confirm `/ready` before switching traffic.
3. Exercise a real staging checkout, duplicate webhook delivery, renewal/cancellation reconciliation, portal session, and invoice listing.
4. Confirm Free, Pro, Legacy, and administrative storage overrides with actual accounts.
5. Rehearse rollback while retaining the compatibility paths required by older web and mobile clients.

Until **checkout** works, users may tap upgrade and see an error or nothing useful—**test with staging** before marketing pushes.

---

## Things to double-check before you tell customers “subscriptions are live”

1. **Payment methods shown at checkout**
  You asked for broad payment support. Make sure checkout presents as many methods as your provider supports for each user (for example card, bank transfer, wallet, USSD, etc., based on country and account settings).
2. **Prices on the page vs prices in the payment dashboard**
  The numbers on the Pricing page are **coded in the app** from your PRD. If you change prices in your payment dashboard, **someone must update the app** (or the app must load prices from the server) so customers are not confused.
3. **Free limits**
  The current server defaults are **2 beneficiaries**, **5 timed messages**, **6 months** max schedule for Free, **200 MiB** storage for Free, and **10 GiB** storage for Pro and Legacy. The server response is authoritative because environment configuration or an administrative override may change a user's effective storage limit.
4. **“Coming soon” rows on Pricing**
  Those are **not** buyable features; they are there so people see the roadmap. Tooltip text should match your spec: *“This feature is on our roadmap and coming soon.”*
5. **Trials**
  The trial banner only works if the server sends **trial** status and an **end date**. Trial emails and day-13 reminders are **backend/marketing** jobs, not this app.
6. **Invoices**
  The Billing tab can list invoices **if** the server exposes them. If not, users will see a friendly empty state.

---

## After launch: what to watch in support

- **“I paid but still see Free”** → webhook or subscription sync issue on the server.
- **“Upgrade button does nothing”** → checkout API or network error; check server logs and the Polar dashboard.
- **“I can’t find my preferred payment method”** → payment method may not be enabled for that market/account in Polar; backend/payment ops should verify the Polar catalog and checkout configuration.
- **“I’m Pro but still blocked”** → server `canAccess` / feature flags out of sync with what the app shows; usually fixed on the server.

---

## Automated checks the developers added

These are **safety nets in code** (not a substitute for trying the real app on staging):

- Free users are **not** automatically sent to the Pricing page when they open the home/overview dashboard — they only go there if they tap an upgrade link or hit a limit flow.
- Uploads: if the server answers with a **“you need to upgrade”** style response on file upload, the app is built to show an upgrade hint instead of a random error.
- The Pricing page’s **“coming soon”** rows use the exact tooltip sentence from your product spec.

If any of these feel wrong in a real environment, it usually means the **server response** does not match what the app expects — that is a backend or configuration fix.

---

## Business decisions your team still needs to make

These are tracked in [PRICING_TODO.md](./PRICING_TODO.md) under **Open product decisions**. They are **not** coding tasks in the website app; they are choices that affect what the **server** and payment/storage vendors do:

1. **Future paid-tier differentiation** — The implemented default is 10 GiB for both Pro and Legacy. Decide later whether Legacy needs a separate quota; until then the API metadata remains authoritative.
2. **Polar trial behavior** — Exactly how free trials work in the Polar catalog. The app can show trial copy; **charging and trial length** must match the Polar product configuration and backend state.
3. **Background jobs operations** — Durable queues and workers exist; operations must provision them, monitor worker heartbeats, and confirm retries in staging.
4. **Promo codes: admin tool now or later** — Whether staff get an internal screen to create promo codes in the first release, or promos are handled manually / later.

When you decide these, tell your backend lead so **Phase 0** in [PRICING_TODO.md](./PRICING_TODO.md) can match reality.

---

## Where to read more (for you or your team)

- [PRICING_TODO.md](./PRICING_TODO.md) — checklist; **Phase 0** is backend; Phases **1–5** are frontend/QA as marked.
- [PRICING_BACKEND_HANDOFF.md](./PRICING_BACKEND_HANDOFF.md) — technical brief for whoever builds the API.
- [PRICING_PRD.md](./PRICING_PRD.md) — full product definition.

---

*Last updated: 2026-08-31 (cross-repository release audit).*
