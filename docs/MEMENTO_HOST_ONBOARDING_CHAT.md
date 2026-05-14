# Host onboarding chat (`/onboarding/chat`) — data flow, memory seeding, backend work

This document is for **product**, **backend**, and **LLM-assisted implementation** in the API repo. It states **exactly what the web app sends and receives**, **what can seed the host’s initial conversation memory**, and **what to implement, change, or remove** on the server.

The **Groot multi-step flow** (`/onboarding`, forms, priorities) is separate; see `docs/ONBOARDING-BACKEND-IMPLEMENTATION.md` and `docs/MEMENTO_ENRICHMENT_SCORE.md`. This file is only about the **conversational** onboarding at **`/onboarding/chat`**.

---

## 1. What this flow is for

After nickname (and related pre-chat steps), the host can have a **short guided chat** with the AI. The **shape and length of the conversation are not hard-coded** in the app: the **backend + model** decide each assistant turn. The browser **streams** replies like dashboard **`POST /ai/prompt`**, and uses a **trailer** on the stream for chips and completion.

### Approved policy: how we use this conversation

**Decision (product):** Treat onboarding chat as **personalization input only**. Use what the host shares to shape **their experience inside Memento** (tone, relevance, continuity with host chat). **Do not** surface raw onboarding lines in marketing-style suggestions, broad “prompt of the day” surfaces, or other cross-feature copy unless the user has **explicitly saved** that material as a memory (or equivalent durable artifact). Derived signals (e.g. topics of interest) may inform ranking **for this user** without quoting the transcript.

---

## 2. What leaves the browser on every assistant turn (request contract)

**Endpoint (frontend today):** `POST /users/onboarding/chat/prompt`  
(Full URL: `{VITE_API_BASE_URL}` + that path, same base as other API calls.)

**Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>` (when the user is logged in).

**JSON body:**

| Field | Type | Required | Meaning |
|--------|------|----------|--------|
| `messages` | `Array<{ role: string; content: string }>` | Yes | **Full transcript so far** in order. Roles are `"user"` and `"assistant"` (lowercase). Only `role` + `content` are sent; client-generated `id` and any `meta` are **not** sent. |
| `nickname` | `string` | Yes | Display name from profile / route state; gives the model context. May be empty string if the UI allowed it—backend should tolerate. |
| `bootstrap` | `boolean` | No | If `true` **and** `messages` is **`[]`**, the server should return the **opening** assistant message (used when the UI skips the intro sheet, e.g. some tests). Normal product flow: first user message is the intro line, then `messages` is non-empty and `bootstrap` is omitted/false. |

**What this array is for seeding memory:**  
Every call carries the **entire conversation history** the client knows. That is exactly what the backend should treat as the **source of truth for “what to persist”** if you append turns to a server-side transcript or to the **canonical host chat memory**.

---

## 3. What comes back (response contract)

**Transport:** HTTP **streaming** body (same general pattern as **`POST /ai/prompt`**): chunks of **UTF-8 text**.

**Visible assistant text:** All bytes **before** a dedicated trailer marker (see below). The UI shows this as the assistant bubble (including a live streaming state).

**Trailer (required for chips and completion):** After the visible assistant text, the stream must end with:

```text
\n__MEMENTO_ONBOARDING__<JSON>
```

`<JSON>` is a single JSON object (snake_case keys as below). The frontend **strips** this from what the user sees and **parses** it.

| JSON field | Type | Purpose |
|------------|------|--------|
| `suggestion_chips` | `string[]` | Quick-reply chips in the composer row. |
| `composer_placeholder` | `string` | Placeholder text for the text field. |
| `composer_label` | `string` | Accessible label for the composer. |
| `flow_complete` | `boolean` | If `true`, the UI ends the flow (completion CTA). No fixed step count on the client. |
| `step_index` | `number` | Optional, ≥ 1. Drives “Step *n*” when combined with `total_steps`. |
| `total_steps` | `number \| null` | Optional. If **null** or omitted, the **step dots** are hidden. If a number, UI shows progress dots. |
| `intent_id` | `string` | Optional. For analytics / future persistence; not required for UI today. |

**Reference implementation in the web repo:** `src/api/host-onboarding-chat.ts` (`OnboardingStreamMeta`, `splitOnboardingStreamBody`, `ONBOARDING_STREAM_TRAILER_MARK`).

---

## 4. What the web app stores locally (does **not** replace the server)

**Key:** `memento:host-onboarding-chat` (see `storageKeys.hostOnboardingChat` in `src/utility/constant.ts`).

**Format:** version **5** only (`HOST_ONBOARDING_CHAT_PERSIST_VERSION` in `src/features/host-onboarding-chat/host-onboarding-chat-persistence.ts`). Older versions are **ignored** (user starts fresh).

**Rough contents:** intro flag/draft, full `messages` array (with client `id` + optional `meta`), main composer `draft`, `isComplete`, last `composerHints` (chips/labels), `progressStep`, `progressTotal`.

**Important:** This is for **refresh / resume in the browser**. It is **not** sent as a bulk upload. **Seeding the durable “initial memory” or canonical host thread is entirely on the backend** when handling `POST /users/onboarding/chat/prompt` (or a follow-up you add).

On **“Go to dashboard”** after completion, the client **clears** this local storage and navigates—it does **not** currently call a separate “commit transcript to memory” endpoint.

---

## 5. What should seed the user’s initial memory (product + backend)

**Intent:** The **transcript** of this onboarding chat (every **user** and **assistant** line, in order) is the natural **seed** for the host’s **first meaningful context** in the product—typically the **same canonical conversation** you want for long-running **host chat** (today modeled as a **`memory` / thread id** used by `/ai/prompt`).

**Recommended backend behavior (checklist for the API / LLM implementer):**

1. **Authenticate** the user; scope all reads/writes to that host.
2. On **each** completed stream response (or batched if you prefer, but per-turn is simpler):
   - **Persist** the latest **user** message(s) and the new **assistant** visible text into your store (same conceptual shape as chat history elsewhere).
3. **Get-or-create** the **canonical host conversation** (one `memory_id` / conversation id per host, per your existing “single thread” plan in `docs/MEMENTO_HOST_CHAT_BACKEND_WORK.md`).
4. **Append** onboarding chat messages into that conversation’s history so that when the host opens **`/chat/:id`**, the thread **already contains** this dialogue (or a summary you derive—product decision).
5. When **`flow_complete` is true** in the trailer:
   - Mark onboarding-chat **finished** in your domain model if you track it.
   - Optionally **trigger** enrichment seeding, persona updates, or “about me” extraction from the transcript (separate from this doc).

**What the frontend already gives you without new fields:**  
The **`messages` array on every request** is the full context; you can **diff** against what you’ve already stored, or **replace** from client if you treat the client as authoritative for the session (less ideal for security—prefer server-owned append).

**Nickname:** Use for **prompting only**, or also store as metadata on the session; it is **not** a substitute for persisting the transcript.

---

## 6. Backend: implement · update · remove

### Implement (required for this feature to work)

| Item | Action |
|------|--------|
| `POST /users/onboarding/chat/prompt` | Accept body above; run **Gemini** (or same stack as `/ai/prompt`); **stream** assistant tokens; append trailer JSON. |
| **Persistence** | Store transcript and attach to **canonical host memory/conversation** (see §5). |
| **Auth** | Same as `/ai/prompt`—reject other users’ data. |

### Update (if you started from an older contract)

| Item | Action |
|------|--------|
| **`POST /users/onboarding/chat/turn`** (JSON, non-streaming, per-turn) | **Remove or do not build.** The web app **no longer** calls it. Only **`/users/onboarding/chat/prompt`** is used for this flow. |
| **Docs / OpenAPI** | Point onboarding chat to the **streaming** prompt path and trailer format in §3. |

### Optional (product-driven)

| Item | Action |
|------|--------|
| Trailer field e.g. `memory_id` | Return canonical thread id once created so future client features can deep-link without list hacks. |
| **Separate “commit” endpoint** | Only if you intentionally keep streaming stateless and batch-save at the end—then document it; **current frontend does not call this**. |
| **Strip internal markers** | Ensure no model-only markers leak into visible stream text; mirror host chat rules in `docs/MEMENTO_HOST_CHAT_BACKEND_WORK.md`. |

---

## 7. Quick reference — paths in `memento-web`

| Topic | Path |
|--------|------|
| Stream client + trailer parsing | `src/api/host-onboarding-chat.ts` |
| API path constant | `src/api/endpoint.ts` → `hostOnboardingChatPrompt` |
| Hook + local persistence | `src/features/host-onboarding-chat/use-host-onboarding-chat.ts`, `host-onboarding-chat-persistence.ts` |
| UI | `src/pages/onboarding-chat/host-onboarding-chat-screen.tsx` |
| MSW test stub (streaming) | `src/test/mocks/handlers.ts` |

---

## 8. One-paragraph handoff for an LLM coding the backend

Implement **`POST /users/onboarding/chat/prompt`**: authenticated JSON body **`{ messages, nickname, optional bootstrap }`**; stream UTF-8 assistant text like **`/ai/prompt`**; end the stream with a newline plus the literal marker **`__MEMENTO_ONBOARDING__`** immediately followed by JSON: **`{ suggestion_chips, composer_placeholder, composer_label, flow_complete, optional step_index, total_steps, intent_id }`**. After each turn, **persist** user and assistant lines server-side and **append them to the host’s canonical conversation memory** so host chat is pre-seeded. **Do not** rely on **`POST /users/onboarding/chat/turn`**—the frontend removed it. Local browser storage only helps resume the same device; **durability and memory seeding are server-side.**

---

*Keep this file aligned with `src/api/host-onboarding-chat.ts` when the contract changes.*
