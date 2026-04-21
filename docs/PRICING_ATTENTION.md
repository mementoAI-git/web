# Pricing & subscriptions — what you should know

This note is for **product and business readers**, not engineers. It explains what the app does today around pricing, what still depends on your **backend** (server) team, and what to watch so customers have a smooth experience.

---

## The big idea

- Memento’s **website app** (this project) can show **plans**, **upgrade buttons**, and **gentle “please upgrade” prompts** when someone hits a limit.
- **Only your server** can truly enforce who is allowed to do what (payments, trials, real limits). The app tries to match what the server says, but someone with technical skill could bypass the app. That is normal for web apps: **the server must be the source of truth**.

Until the backend work in **Phase 0** of [PRICING_TODO.md](./PRICING_TODO.md) is done and live, some screens may look right but **checkout, real limits, and billing state may not work end-to-end**.

---

## What works in the app today (frontend)

- A **Pricing** page with Free, Pro, and Legacy, prices in **dollars or naira** based on the user’s device language/region.
- **Settings → Billing**: plan name, status, trial/renewal text, promo code field, link to manage billing, and a **storage bar** *if* the server sends usage data.
- **Trial banner** (when the server says the user is on a trial and sends a trial end date).
- **Soft gates** (polite prompts, not harsh lockouts) for things like **voice mode**, **storage**, **beneficiaries**, **timed messages**, and **how far ahead** a free user can schedule a time capsule—using a mix of **what the server tells us** and **sensible defaults** when the server is not ready yet.

---

## What you need the backend team to deliver

These are **not** optional for a real launch:

1. **Saved subscription state** for every user (Free / Pro / Legacy, trial, payment provider, etc.).
2. **Checkout** that returns a real payment link when someone taps “Start trial” or similar, with broad payment method support (card, transfer, wallet, etc.) where your provider supports it.
3. **Webhooks** so when someone pays, the server updates their plan (and stays correct if the same event is sent twice).
4. **Consistent “no permission” responses** (your team agreed on **402** + a short JSON message) when someone over their limit, so the app can show the right **upgrade** message instead of a generic error.
5. `**GET /billing/subscription`** (or equivalent) with accurate **tier**, **status**, **trial end**, and ideally **usage** (storage used, counts for beneficiaries and timed messages, etc.).

Until **checkout** works, users may tap upgrade and see an error or nothing useful—**test with staging** before marketing pushes.

---

## Things to double-check before you tell customers “subscriptions are live”

1. **Payment methods shown at checkout**
  You asked for broad payment support. Make sure checkout presents as many methods as your provider supports for each user (for example card, bank transfer, wallet, USSD, etc., based on country and account settings).
2. **Prices on the page vs prices in the payment dashboard**
  The numbers on the Pricing page are **coded in the app** from your PRD. If you change prices in your payment dashboard, **someone must update the app** (or the app must load prices from the server) so customers are not confused.
3. **Free limits**
  The app **assumes** things like: **2 beneficiaries**, **5 timed messages**, **6 months** max schedule for free, **5 GB** storage on the Billing meter if the server does not send limits. If your real rules differ, **align the server and ask the devs to align the app**.
4. **“Coming soon” rows on Pricing**
  Those are **not** buyable features; they are there so people see the roadmap. Tooltip text should match your spec: *“This feature is on our roadmap and coming soon.”*
5. **Trials**
  The trial banner only works if the server sends **trial** status and an **end date**. Trial emails and day-13 reminders are **backend/marketing** jobs, not this app.
6. **Invoices**
  The Billing tab can list invoices **if** the server exposes them. If not, users will see a friendly empty state.

---

## After launch: what to watch in support

- **“I paid but still see Free”** → webhook or subscription sync issue on the server.
- **“Upgrade button does nothing”** → checkout API or network error; check server logs and payment dashboard(s).
- **“I can’t find my preferred payment method”** → payment method may not be enabled for that market/account in Paystack settings; backend/payment ops should verify dashboard configuration.
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

1. **Upload limits for Pro vs Legacy** — How much storage or how many uploads each paid tier gets, and how that ties to **Cloudinary** (or your file host). Until this is decided, engineers use reasonable placeholders.
2. **Paystack trial behavior** — Exactly how free trials work with Paystack in your final setup. The app can show trial copy; **charging and trial length** must match what you sign off with Paystack and the backend.
3. **Background jobs infrastructure** — Which system processes webhooks, renewals, and reminder emails (a “job queue”). This is **backend-only**; it does not change what users see in the app directly.
4. **Promo codes: admin tool now or later** — Whether staff get an internal screen to create promo codes in the first release, or promos are handled manually / later.

When you decide these, tell your backend lead so **Phase 0** in [PRICING_TODO.md](./PRICING_TODO.md) can match reality.

---

## Where to read more (for you or your team)

- [PRICING_TODO.md](./PRICING_TODO.md) — checklist; **Phase 0** is backend; Phases **1–5** are frontend/QA as marked.
- [PRICING_BACKEND_HANDOFF.md](./PRICING_BACKEND_HANDOFF.md) — technical brief for whoever builds the API.
- [PRICING_PRD.md](./PRICING_PRD.md) — full product definition.

---

*Last updated: 2026-04-21 (memento-web).*
