# Memento Web — TODO & Backlog

> Last updated: 2026-03-28
> Branch at time of review: `new-explore-page`

---

## How to use this file
- Check items with `[x]` when done.
- Add new items under the relevant section.
- Before committing: pull latest from `dev`, resolve conflicts, then push.

---

## 🔴 Incomplete / Broken UI (needs fixing)

- [ ] **`/invite-friends` route is missing** — Navigation sidebar links to `/invite-friends` (`src/pages/dashboard/component/navigation.tsx:28`) but no route is defined in `src/router.tsx`. Either add the page or remove the nav item.
- [ ] **Stories table row — MemoryItemActions commented out** — `src/pages/dashboard/time-capsule-new/components/row.tsx:49` has a `TODO` comment; the `MemoryItemActions` dropdown component exists in stories but is not imported/used. Row actions are non-functional.
- [ ] **"Connect apps" button is permanently disabled** — `src/pages/dashboard/overview/sections/welcome-section.tsx:187` renders the button with `opacity-50 pointer-events-none aria-disabled`. Third-party integrations not yet built. Needs either a feature or removal.

---

## 🟡 Stub / Hardcoded Data (needs real API)

- [ ] **Enrichment score in chat bar is hardcoded** — `src/features/host-chat/chat.types.ts:25` sets `HOST_CHAT_ENRICHMENT_STUB_PERCENT = 47`. Used in `host-chat-enrichment-bar.tsx`. Wire to real `GET /enrichment` (or similar) endpoint when backend is ready.
- [ ] **Enrichment delta "Grew today +0" is hardcoded** — `src/features/host-chat/components/host-chat-enrichment-bar.tsx:34–36`. TODO comment in code. Needs API to return daily enrichment delta per conversation.
- [ ] **MilestoneCard not triggered by API** — `src/features/host-chat/components/milestone-card.tsx` accepts `enrichmentDelta` but nothing passes a real value from the server. Will render nothing until the API returns enrichment delta per message.
- [ ] **Deep-dive nudge dimension is hardcoded** — `src/pages/dashboard/chat/conversation/index.tsx:45` sets `DEFAULT_DEEP_DIVE_NUDGE_DIMENSION = "relationships_people"`. Should be driven by actual enrichment gap from the backend.
- [ ] **Upgrade card ("Unlock more with Pro")** — `src/pages/dashboard/component/sidebar-upgrade-card.tsx` navigates to `/settings/general` on "Upgrade" press. No billing/subscription page exists yet. Needs real upgrade flow (Stripe or equivalent).

---

## 🟡 Features in Active Development

- [ ] **Time Capsule — new redesign** (`src/pages/dashboard/time-capsule-new/`) is active but:
  - [ ] Letter templates (Modern, Sage, Peach, Paper, Bead, Dark) are SVG stubs — verify text injection is wired up to actual capsule content.
  - [ ] `RecentRecipients.tsx` has commented-out name-display logic (lines 84–89) — double-check display name rendering is correct.
  - [ ] Media card selection flow (`media-cards/`) — verify attachment linking to capsule draft is complete.
  - [ ] Status badge (`StatusBadge.tsx`) — confirm all states (`draft`, `scheduled`, `delivered`, `paused`, `failed`) are handled end-to-end.
- [ ] 
- [ ] **DeepDive banner & nudge** — UI exists in `src/features/host-chat/`; backend logic for nudge triggers is pending.

---

## 🟢 Polish / Nice-to-Have

- [ ] **"Continue reflecting" / daily prompt** — if `prompts` array is empty, the entire `DailyPromptSection` returns `null` silently. Add an empty state with a CTA.
- [ ] **Recent Activities "See all" links to `/stories`** — `src/pages/dashboard/overview/sections/recent-activities-section.tsx:100`. Consider linking to a dedicated activities page if one is planned.
- [ ] **Welcome modal WIP notice** — `src/components/modal/welcome.tsx` shows a "Memento is WIP" banner. Remove or update before public launch.
- [ ] **`/chat/new` redirect** — `src/router.tsx:87` redirects `/chat/new` to `/chat`. Confirm this is intentional UX and update any deep-links accordingly.
- [ ] **`settings/general` for "Upgrade"** — The Upgrade button in the sidebar upgrade card currently just navigates to profile settings. Either create `/settings/billing` (or similar) or link out to a pricing page.

---

## 🔵 Missing Pages / Routes

- [ ] `/invite-friends` — Invite friends page (see nav item above)
- [ ] `/settings/billing` or `/upgrade` — Subscription/pricing page
- [ ] Dedicated activities log page (currently "See all" on Recent Activities goes to `/stories`)

---

## 🔵 Testing Gaps

- [ ] No e2e Playwright tests written yet (config exists, no test files under `e2e/`)
- [ ] Storybook stories are present for core components but time-capsule-new components have no stories
- [ ] `src/pages/dashboard/time-capsule-new/` has minimal test coverage compared to other pages

---

## ✅ Completed (for reference)

- [x] Onboarding Groot (8-step identity + motivation flow) — fully wired to API
- [x] Host Onboarding Chat (streaming conversational onboarding) — complete
- [x] Auth flow (login, register, verify, OAuth callback, 2FA setup) — complete
- [x] Dashboard overview — stats, streak, enrichment score (not delta), recent activities, daily prompts — all wired to live API
- [x] Chat/Conversations — streaming, memory sidebar, export to markdown, reply quotes
- [x] Stories (My Memories) — gallery + detail view
- [x] Settings — profile, security, 2FA, beneficiary, group, privacy
- [x] SidebarUpgradeCard component added to sidebar
- [x] HeroUI search integration, sidebar toggle, explore/overview polish (last commit)
