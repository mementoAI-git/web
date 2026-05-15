# Memento — Enrichment Score (plain-language guide)

This document explains **what the Enrichment Score is supposed to be**, **how it fits together**, and **how that compares to what the Memento web app actually does today**. You do not need to be a developer to read it.

If you only want the mismatch list, jump to **[Section 5 — Discrepancies](#5-discrepancies-spec-vs-this-website-today)**.

---

## 1. What the Enrichment Score is (in simple terms)

Think of the Enrichment Score as a **0–100% “how complete a picture we have of this person”** meter.

- It is **not** just “how many words they typed.” The idea is **breadth and richness** across different parts of life (relationships, work, beliefs, everyday habits, etc.).
- It should **feel motivating**: always possible to grow, never hopeless.
- The product spec also says the score can **slowly drift down** if someone goes quiet for a long time—but it should **never fall to zero** (there is a floor, e.g. 5%).

**Where it is supposed to show up (per your spec):**

| Place | What users should see |
|--------|------------------------|
| Dashboard | A proper **score widget** (big number, progress ring, breakdown by category) |
| Profile | Same idea in context |
| AI chat | A panel showing enrichment while chatting |
| **Rules for beneficiaries** | Beneficiaries **cannot** use the host’s Memento AI until the host’s score reaches **20%**. After that, access **stays unlocked forever** (even if the score later drops)—stored as something like `beneficiary_access_unlocked: true`. |

---

## 2. The ten life categories (axes of the score)

Your spec defines **10 categories**. Each piece of meaningful content (insights, uploads, memories, chat-derived items, etc.) is supposed to be **tagged** with **one primary category**. Each category has its own sub-score (0–100), and the **overall score** is a **weighted average** of those ten.

**The ten names in the spec (technical keys):**

| # | Friendly name (from your doc) | Spec key (`EnrichmentCategory`) |
|---|------------------------------|----------------------------------|
| 1 | Identity & Self | `identity_self` |
| 2 | Relationships & People | `relationships_people` |
| 3 | Work & Purpose | `work_purpose` |
| 4 | Memories & Experiences | `memories_experiences` |
| 5 | Beliefs & Worldview | `beliefs_worldview` |
| 6 | Passions & Interests | `passions_interests` |
| 7 | Heritage & Roots | `heritage_roots` |
| 8 | Lessons & Wisdom | `lessons_wisdom` *(deferred: week 2+)* |
| 9 | Hopes & Legacy | `hopes_legacy` *(deferred: week 3+)* |
| 10 | Everyday Life | `everyday_life` |

**Deferred categories:** `lessons_wisdom` and `hopes_legacy` are **not** meant to appear in onboarding at first. They **unlock** after enough **active usage** (your spec: e.g. 2 weeks / 3 weeks with “active” defined as sessions with contributions).

---

## 3. How scoring is supposed to work (conceptually)

**Per category**

- Each category has its own score, influenced by things like: how much **accepted** content maps to it, how **substantial** the content is, and **recency** (recent activity counts a bit more).
- Your spec includes **weights** that can be **seeded from onboarding** (priorities the user chose get a higher weight, deferred categories start lower, etc.).

**Overall score**

- **Weighted average** of the ten category scores (not a simple plain average unless all weights are equal).

**Decay (inactivity)**

- If someone does not contribute for a while, category scores can **decay slowly** (your example: after 14 days idle, lose about 2% per week per category).
- There is a **floor** on the overall score (your example: never below 5%).
- Decay can **pause** if they were recently active in any category (your example: activity within 7 days).

**Supermemory (conversation-derived memories)**

- Your spec says: when the system saves structured memory from **AI chat**, it should **automatically** count toward enrichment (pre-accepted, no review modal), with a **slightly lower weight** (e.g. 0.9×) than things the host explicitly wrote.
- The Memory tab should show a **“From conversation”** style label.

**Insight tagging**

- New insights should be **auto-tagged** with one of the 10 categories (JSON line on the insight, per your prompt appendix).

**Dashboard nudges**

- Surface the **lowest-scoring category** (that is not deferred) as a gentle prompt suggestion.

---

## 4. What this website (memento-web) actually does today

This section is about **this React codebase only**. Backend may already do more; the browser can only show what the API returns and what we built in UI.

### 4.1 Overview dashboard — **one real number from the server**

- The **overview** page calls **`GET /users/stats`** and displays **`enrichment_score`** as a **single percentage** next to “Enrichment score” (in the welcome / enrichment card).
- That is **one overall number**. The UI does **not** show the **10 category breakdown**, weights, decay rules, or beneficiary gate here.

**File reference (for developers):** `src/pages/dashboard/overview/sections/welcome-section.tsx`

### 4.2 Host chat — **live stats from `GET /users/stats`**

- The **host conversation** screen uses **`useEnrichmentStats()`** (same **`GET /users/stats`** cache as elsewhere) for **jump-month pills**, **category starter pills** (`jump_pills`), **deep-dive nudge** copy, **milestone** detection (with client-side baseline/delta helpers in `use-enrichment-stats.ts`), and **session enrichment delta** for the milestone chip.
- The **Memory** tab of the **inline chat sidebar** shows **`HostChatEnrichmentBar`**: overall **`enrichment_score`**, **today’s delta** (`deltaToday`), and optional **per-category** rows from **`category_scores`** when the API returns them. Values are passed from `src/pages/dashboard/chat/conversation/index.tsx` into `SidebarDetails`.
- **`GET /users/stats`** also returns optional **`spotlight`** (one recent story or conversation **summary** excerpt for the Memory Insights modal—never raw chat). Implemented server-side in the API repo (e.g. `memory-spotlight.ts`).

**File references:**  
`src/features/enrichment/use-enrichment-stats.ts`  
`src/features/host-chat/components/host-chat-enrichment-bar.tsx`  
`src/features/host-chat/components/host-chat-jump-pills.tsx`  
`src/features/host-chat/components/milestone-card.tsx`  
`src/pages/dashboard/chat/conversation/index.tsx`  
`src/components/memory/sidebar-details.tsx`  
`src/features/enrichment/enrichment-api.types.ts` (`UserStatsData`, `MemorySpotlight`, `JumpPill`)

**Deep link:** Opening host chat with a **prefilled composer** is supported via **`?starter=`** on `/chat/...` or `/chat` (preserved through the `/chat` → `/chat/:id` redirect). `ConversationChatinput` reads the query once, writes the draft to `localStorage`, and strips **`starter`** from the URL.

### 4.3 Memory Insights modal — **Insights vs At a glance**

- **`src/components/modal/memory-insights/index.tsx`** — hero (spotlight, AI summary, nudge, jump pills, breadth), **Insights** narrative block, **At a glance** horizontal KPI cards, beneficiaries, **All observations** `<details>`.
- **`src/features/enrichment/narrative-insights.tsx`** — narrative “mirror” cards with **View** + **Sources**.
- **`src/features/enrichment/at-a-glance-cards.tsx`** — KPI-style strip (counts, streak, breadth-adjacent copy); shared with Settings stats where applicable.
- Users can **hide the snapshot hero for a week** (localStorage: `memento:memory-insights-hero-snooze-until`); **Insights** / **At a glance** stay visible.

### 4.4 Profile, beneficiary gate, Supermemory — **still mostly spec vs this UI**

A search of this repo still shows **gaps** relative to the full spec for:

- **Profile page** enrichment breakdown widget  
- **`beneficiary_access_unlocked`** (or any **20%** gate) in the **TypeScript user model** used everywhere (some stats payloads may expose a flag—UI coverage may still be partial)  
- **Supermemory** naming, auto-accepted chat-derived insights, or **0.9×** weighting logic in frontend code  
- **Decay** or **weighted category** math in the browser (that would live on the server anyway)  
- **Dashboard nudge** logic based on “lowest category” beyond what the API returns in **`nudge`**

### 4.5 Onboarding and Host Chat use the same enrichment categories

**Onboarding** “what matters most” and **Host Chat deep dive** both use **`EnrichmentCategory`** (10 keys). Definitions live in **`src/features/enrichment/enrichment-categories.ts`**. **`DIMENSION_OPTIONS`** in onboarding types re-exports the full list; **`ONBOARDING_DIMENSION_OPTIONS`** is the subset **without** deferred categories (`lessons_wisdom`, `hopes_legacy`) for the initial onboarding step.

When **loading** saved onboarding from the API, **legacy** keys (`people_relationships`, `memories_stories`, etc.) are **migrated** to canonical values via **`migrateLegacyPriorityList`** / **`migrateLegacyPriorityDimension`**.

**File references:**  
`src/features/enrichment/enrichment-categories.ts`  
`src/features/onboarding-groot/types.ts` (`EnrichmentCategory`, `DIMENSION_OPTIONS`, `ONBOARDING_DIMENSION_OPTIONS`)  
`src/features/host-chat/chat.types.ts` (`LifeDimension`)

---

## 5. Discrepancies (spec vs this website today)

Use this table when talking to product or backend: **left = your spec, right = what memento-web reflects today**.

| Topic | Your spec says… | In memento-web today… |
|--------|-----------------|------------------------|
| **Category taxonomy** | 10 `EnrichmentCategory` keys | **Implemented** in `src/features/enrichment/enrichment-categories.ts`; onboarding + host chat aligned. Legacy API values are migrated on read. |
| **Overall score display** | Dashboard widget + profile + chat context | **Overview** shows **one** `%` from **`/users/stats` → `enrichment_score`**. **Host chat sidebar** shows the same source + optional category breakdown. **No** dedicated profile breakdown widget yet. |
| **Category breakdown UI** | 10-bar mini chart, tooltips | **Partially**: `HostChatEnrichmentBar` lists categories when **`category_scores`** is present. Not the full spec sidebar (Lora, amber ring, etc.). |
| **Weighted average & seed weights** | Formula + onboarding-based weights | **Not in frontend**; would be server-side. No UI exposes weights. |
| **Decay & floor** | 14-day rule, weekly decay, 5% floor, pause rules | **Not in frontend**; not visible in API types in this repo. |
| **20% beneficiary gate** | Unlock Memento AI for beneficiaries at 20%; permanent flag | **Limited / evolving** — confirm against API and beneficiary flows; not fully modeled in `IUser` here. |
| **Supermemory** | Auto-accepted, 0.9× weight, “From conversation” label | **No** references in this codebase. |
| **Insight JSON tagging** | AI appends `{"category": "…"}` | **Not implemented** in this frontend repo (generation is backend / prompt). |
| **Deferred categories & unlock schedule** | Week 2 / week 3, session rules | **Not implemented** in this repo. |
| **Milestone after chat** | `enrichmentDelta` after an exchange | **Partially**: server **`milestone`** + client **`useEnrichmentStats`** baseline; **MilestoneCard** shows session delta when the server signals a newly reached threshold. |
| **Visual design details** | Lora serif, amber ring | Host chat enrichment uses **Inter** + **v3** tokens; overview enrichment card uses **Garamond** for the big %—**not** the spec’s Lora/amber sidebar widget. |

**Bottom line:** Your document describes a **full engine + UX system**. This repository implements the **shared 10-category taxonomy**, **live `GET /users/stats` wiring** on **overview**, **host chat** (toolbar + sidebar), and the **Memory Insights** experience (including optional **`spotlight`**). Scoring math, decay, Supermemory, beneficiary gate edge cases, and the full profile/spec sidebar remain **mostly backend / future frontend** work.

---

## 6. Suggested next steps (for product + engineering)

1. **API contract:** Keep **`/users/stats`** the single enrichment surface for the web: overall %, **`category_scores`**, **`nudge`**, **`jump_pills`**, **`milestone`**, **`spotlight`**, unlock flags, etc.  
2. **Deploy order:** Ship the **API** change that adds **`spotlight`** (nullable) **with or before** the web build that reads it—older clients ignore unknown fields; the field is optional on `UserStatsData`.  
3. **Frontend:** Profile breakdown when design + data exist; beneficiary gate UI once the user/settings payload is authoritative.  
4. **Keep this doc updated** when the spec or the API changes.

---

## 7. Quick file map (for developers)

| Area | Location |
|------|-----------|
| Overview enrichment % | `src/pages/dashboard/overview/sections/welcome-section.tsx` |
| Stats hook (delta, milestone, nudge) | `src/features/enrichment/use-enrichment-stats.ts` |
| Host chat enrichment UI | `src/features/host-chat/components/host-chat-enrichment-bar.tsx`, `milestone-card.tsx`, `host-chat-jump-pills.tsx` |
| Chat screen wiring | `src/pages/dashboard/chat/conversation/index.tsx` |
| `/chat` → primary thread redirect + query preservation | `src/pages/dashboard/chat/main/host-chat-entry.tsx` |
| Composer `?starter=` handling | `src/components/Chatinput/index.tsx` (`ConversationChatinput`) |
| Memory Insights modal | `src/components/modal/memory-insights/index.tsx` |
| Narrative insights cards | `src/features/enrichment/narrative-insights.tsx` |
| At a glance KPI strip | `src/features/enrichment/at-a-glance-cards.tsx` |
| Stats endpoint path | `src/api/endpoint.ts` → `userStats: "/users/stats"` |
| Enrichment categories (canonical) | `src/features/enrichment/enrichment-categories.ts` |
| Onboarding re-exports | `src/features/onboarding-groot/types.ts` |
| Host chat deep-dive dimensions | `src/features/host-chat/chat.types.ts` |
| Backend handoff (related) | `docs/MEMENTO_HOST_CHAT_BACKEND_WORK.md` |

---

*This document summarizes your enrichment spec and compares it to the **memento-web** repository. It is not a promise of roadmap priority—use it to align conversation between product, design, backend, and frontend.*
