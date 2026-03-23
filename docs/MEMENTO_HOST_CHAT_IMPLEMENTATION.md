# Memento Host Chat — Implementation Guide (Plain Language)

This document explains **what the product change is**, **how the current app works**, **what has to be built on the website (frontend)** vs **what needs the server (backend)**, and **a sensible order to do the work**. It is written for readers who are **not** software developers.

---

## 1. What you’re trying to achieve (in one paragraph)

Today, a host can have **many separate chat threads** (like many conversation tabs). The goal is to move to **one long-running conversation per host**—a single place where everything lives—and to add **“deep dive” mode** (focused follow-up on one life area), **enrichment score** UI, **jump to month** shortcuts, and **nudges** from the AI. Some of that only the **server** can do; some is **screens and behavior** in the app you see in the browser.

---

## 2. Simple glossary


| Term                      | Plain meaning                                                                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**              | The React website in this repo—what runs in the browser.                                                                                                                                                   |
| **Backend / API**         | The separate server (not fully in this repo) that stores data and talks to the AI model for normal text chat.                                                                                              |
| **Host**                  | The logged-in person using Memento. In code they are usually called `**user`** (`useStore().user`).                                                                                                        |
| **Thread / conversation** | One chat history. Today this is tied to a `**memory`** record (each thread has an ID like a saved “memory”).                                                                                               |
| **Endpoint**              | A URL the frontend calls, e.g. “send a message” → `POST /ai/prompt`.                                                                                                                                       |
| **Stream**                | The assistant’s reply arrives in chunks (typing effect), not one big block.                                                                                                                                |
| **Gemini**                | Google’s AI. In **this** codebase it is used mainly for **voice** mode. **Normal typing chat** goes through your **backend**, which may use Gemini or another model—you don’t see that logic in this repo. |


---

## 3. How chat works today (discovery summary)

### Where the chat screens live

There is **no** folder called `components/chat`. Chat UI lives here:


| What                                                       | Where in the project                                       |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| Chat home (greeting, box to type, “recent” strip)          | `src/pages/dashboard/chat/main/`                           |
| The actual back-and-forth messages                         | `src/pages/dashboard/chat/conversation/`                   |
| List of all conversations                                  | `src/pages/dashboard/chat/recent-conversation/`            |
| Small chat panel in the dashboard                          | `src/pages/dashboard/component/dashboard-chat-sidebar.tsx` |
| Top bar when you’re in a chat (title, Share, **New chat**) | `src/pages/dashboard/component/dashboard-header.tsx`       |


### Routes (addresses in the browser)

Defined in `src/router.tsx`, including:

- `/chat` — landing  
- `/chat/conversations` — list  
- `/chat/:id` — one thread (`id` is the **memory** id today)  
- `/chat/new`, `/chat/reply/:id`, etc.

**Product change implication:** Removing “new chat” and the list means changing these routes, the header, and links elsewhere that point to `/chat/new` or the conversations list.

### How “send message” works technically

1. The browser sends a **POST** request to `**/ai/prompt`** with JSON (today includes **message text**, **attachment IDs**, and **which memory/thread**).
2. The **server** runs the AI and **streams** the answer back.
3. The frontend reads the stream and updates the screen.

The function that does the HTTP call is in `src/api/fetcher.ts` (`streamlineFetcher`). The conversation screen wires it in `src/pages/dashboard/chat/conversation/index.tsx`.

### Where “system prompt” / personality text lives

- **Text chat:** Built on the **server** for `/ai/prompt`—**not** visible in this frontend repo.  
- **Voice chat:** `src/hooks/use-live-api/utils.ts` has `createSystemContext(user)`—a long instruction string for the **live Gemini** voice session.

So: enriching the **text** AI with enrichment scores and deep-dive rules is primarily a **backend** task; the frontend can **send** extra fields (mode, dimension, etc.) once the API accepts them.

### Where host / user data comes from

`src/hooks/use-store.tsx` holds `**user`** (profile, preferences, etc.). That is your **host** for product language.

### Data types today

In `src/utility/interface.ts`:

- `**IMessage`** — one chat line (text, role, time, …).  
- `**IMemory**` — the “container” for a thread today (title, body, attachments, times, …).

The new spec’s `Conversation { id, hostId, … }` is a **concept**—it may map to one special memory per user, or a new backend table. That decision is **backend + product**.

---

## 4. What must happen on the backend (cannot be “only website”)

These need **database + API** work (another codebase or team):


| Item                                                                                 | Why                                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `**getOrCreateConversation(hostId)`**                                                | Only the server can guarantee “exactly one” thread per host and create it safely.                                         |
| **Migration** (“merge many old threads into one, archive the rest”)                  | Touches stored data; must not be done only in the browser.                                                                |
| **Full `SendMessageResponse`** with `nudge`, `enrichmentDelta`, structured citations | The AI response must be **parsed and returned** in JSON; the stream might need a new format or a second metadata payload. |
| **Stripping `CITATION:` / `NUDGE:` markers** from visible text                       | Should happen **server-side** before the client shows the message (or you accept parsing on the client—less ideal).       |
| `**buildSystemPrompt` with enrichment + deep dive**                                  | The model that serves `/ai/prompt` must receive this text; that’s server configuration/code.                              |


**Frontend role:** Call the new/changed endpoints, show the UI, handle loading and errors, and use **temporary fake data (stubs)** until the API is ready.

---

## 5. What the frontend (this repo) can do


| Item                                                                                         | Notes                                                                                                                                                                |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Remove** “New chat”, conversation list entry points, extra routes (or redirect old links). | Careful search for links to `/chat/new`, `/chat/conversations`, etc.                                                                                                 |
| **Single-thread UX**                                                                         | After backend returns the canonical conversation id, always open `/chat/<thatId>` or one dedicated **Host Chat** route.                                              |
| **New layout**                                                                               | Top bar (“Your Memento”, counts, Share, Search), enrichment bar, month **jump pills**, date dividers, new bubble styles, citation footer, milestone card, input row. |
| `**DeepDiveNudge` component**                                                                | Card UI + session dismiss state (`sessionStorage` or React state).                                                                                                   |
| **Deep dive mode**                                                                           | Banner, placeholder text, styling for AI bubbles, “Exit deep dive” + divider; send `mode` and `dimension` in the request body **when the API supports it**.          |
| `**chat.types.ts`**                                                                          | Types and labels (`LifeDimension`, `DIMENSION_LABELS`, etc.)—shared across UI.                                                                                       |
| **Stubs**                                                                                    | If enrichment API missing, show placeholder % and `// TODO: wire enrichment API`.                                                                                    |


### Design system: v3 colours, HeroUI v3, and typography

**Colours (v3 is the source of truth for new UI)**  
Host Chat and related work should use the **v3 palette** defined in `src/index.css`, not ad‑hoc hex values where a token exists.

- **CSS variables** on `:root` include `--v3-base`, `--v3-fill-weak` / `--v3-fill-strong` / `--v3-fill-weaker`, `--v3-stroke-weak` / `--v3-stroke-strong`, `--v3-text-strong` / `--v3-text-weak` / `--v3-text-weaker` / `--v3-text-disabled`, `--v3-icon-neutral` / `--v3-icon-disabled`, and **`--v3-brand-strong`** (primary accent / CTAs).
- The same values are exposed to Tailwind as **`v3-*` colour utilities** (e.g. `text-v3-text-strong`, `bg-v3-fill-weaker`, `border-v3-stroke-weak`, `bg-v3-brand-strong`) via the `--color-v3-*` mappings in that file.
- **Sand** and legacy greys (`--color-sand-*`, `--color-gray-*`) remain available for surfaces that already use them; prefer **v3 tokens** for text, borders, fills, and brand accents on new components.

**UI components: HeroUI v3**  
Use **[HeroUI v3](https://heroui.com/docs/react/getting-started)** (React + Tailwind CSS v4 + React Aria) for new interactive primitives where it speeds delivery (buttons, inputs, menus, dialogs, etc.), and **theme them to Memento’s v3 colours** so the product stays visually consistent.

- **Install** (from [Quick Start](https://heroui.com/docs/react/getting-started/quick-start)): `npm i @heroui/styles @heroui/react` (or pnpm/yarn/bun equivalent).
- **CSS import order** matters: in the main stylesheet, keep **`@import "tailwindcss"` first**, then **`@import "@heroui/styles"`** (see HeroUI docs).
- **Customisation:** Use HeroUI’s [Themes](https://heroui.com/themes) and [Styling](https://heroui.com/docs/handbook/styling) guidance to map semantic colours (primary, foreground, background, borders, rings) to **`var(--v3-…)`** / Tailwind **`v3-*`** utilities so components match the rest of the app. Prefer slot/`className` overrides with **`font-inter`** (or the same font class the surrounding screen already uses) rather than HeroUI’s default typography.

**Typography (do not change the app’s font stack)**  
The product already defines:

- **`font-inter`** — primary UI sans (`Inter`).
- **`font-georgia`** — serif (`Georgia`).
- **`font-garamond`** — display serif (`EB Garamond` via `--font-garamond`).

**Requirement:** New Host Chat UI and HeroUI-wrapped regions must **keep these families**—apply `font-inter` (or Georgia/Garamond where the existing screen pattern uses them). **Do not** introduce new marketing fonts or rely on HeroUI defaults that imply a different typeface unless design explicitly updates the global stack.

---

## 6. Suggested implementation order (checklist)

Use this as a **roadmap**. Check boxes as you go. **Backend** steps may run in parallel with frontend.

### Phase A — Agreements & contracts

- **A1.** Decide: does “one conversation” = one `**IMemory`** per user, or a new `**Conversation**` entity from the API?  
- **A2.** Document the **exact JSON** for send-message **request** and **response** (including optional `nudge`, `enrichmentDelta`).  
- **A3.** Confirm how **stream** + **metadata** work together (e.g. JSON line at end, or separate request).

### Phase B — Types (frontend)

- **B1.** Add `src/.../chat.types.ts` (or under `features/host-chat/`) with `LifeDimension`, `ChatMode`, `NudgePayload`, labels, icons.  
- **B2.** Align dimension keys with onboarding where possible (`features/onboarding-groot/types.ts` already has related values).

### Phase C — Backend (outside this repo)

- **C1.** Implement `getOrCreateConversation(hostId)` + migration job.  
- **C2.** Extend `/ai/prompt` (or successor) to accept `mode`, `deepDiveDimension`, `dismissedNudgeDimensions`.  
- **C3.** Implement `buildSystemPrompt` server-side; parse citations/nudges; return structured response.  
- **C4.** (Optional) Enrichment score read API for the top bar.

### Phase D — Frontend: single thread & navigation

- **D1.** Remove or hide **New chat** (`dashboard-header.tsx` and anywhere else).  
- **D2.** Remove or repurpose **conversation list** routes/UI; redirect old URLs if needed (`router.tsx`).  
- **D3.** On login / open chat, fetch canonical conversation id and navigate there.

### Phase E — Frontend: new chat screen layout

- **E0.** (When adopting HeroUI) Add `@heroui/styles` + `@heroui/react`, wire imports per [HeroUI Quick Start](https://heroui.com/docs/react/getting-started/quick-start), and map theme tokens to **v3** colours + **`font-inter`** (see **Design system** above).  
- **E1.** Topbar (title, exchange count, “since …”, Share, Search).  
- **E2.** Enrichment bar (progress + “grew today” pill) — stub data OK with TODO.  
- **E3.** Jump pills from message dates + scroll to first message of period.  
- **E4.** Message list: day dividers, host vs AI styling, timestamps, citation footer — **v3** colours / `v3-*` Tailwind utilities.  
- **E5.** Milestone card when `enrichmentDelta` present (stub null until API ready).  
- **E6.** Input: placeholder, Enter vs Shift+Enter, attach, voice, disabled Send when empty.

### Phase F — Deep dive

- **F1.** `DeepDiveNudge` component + dismiss tracking per session.  
- **F2.** State: `mode`, `deepDiveDimension`; banner; bubble styling; exit flow + “Returned to open conversation”.  
- **F3.** Include mode fields in send payload (behind feature flag or TODO if API not ready).

### Phase G — Tests & polish

- **G1.** Unit tests for pure helpers (prompt building **if** duplicated client-side for tests only; labels; date grouping).  
- **G2.** Component tests for nudge, topbar, input.  
- **G3.** MSW handlers updated for new API shape in `src/test/mocks/handlers.ts`.

---

## 7. Quick reference — important file paths


| Topic                  | Path                                                      |
| ---------------------- | --------------------------------------------------------- |
| Routes                 | `src/router.tsx`                                          |
| Chat thread page       | `src/pages/dashboard/chat/conversation/index.tsx`         |
| Message history load   | `src/pages/dashboard/chat/conversation/history.tsx`       |
| Bubbles                | `src/pages/dashboard/chat/conversation/bubble.tsx`        |
| Chat landing           | `src/pages/dashboard/chat/main/index.tsx`                 |
| API paths              | `src/api/endpoint.ts`                                     |
| Stream send            | `src/api/fetcher.ts` → `streamlineFetcher`                |
| Logged-in user         | `src/hooks/use-store.tsx`                                 |
| Message / memory types | `src/utility/interface.ts`                                |
| Voice AI system text   | `src/hooks/use-live-api/utils.ts` → `createSystemContext` |
| Test API mocks         | `src/test/mocks/handlers.ts`                              |
| v3 colours + Tailwind  | `src/index.css` (`:root` `--v3-*`, `--color-v3-*`)        |


---

## 8. Where this doc came from

This guide combines:

1. A **technical discovery pass** on the Memento web repo (where chat code and APIs actually live).
2. The **Memento Host Chat** product/build specification (single thread, deep dive, enrichment UI, API shape).

It is meant to stay in `**docs/`** so product, design, and engineering can read the **same** map. Update it when API contracts or routes change.

---

*Last updated: Host Chat scope + **v3 colours**, **HeroUI v3** adoption notes ([getting started](https://heroui.com/docs/react/getting-started)), and **existing app fonts** (`font-inter`, `font-georgia`, `font-garamond`) added to align implementation with the design system.*