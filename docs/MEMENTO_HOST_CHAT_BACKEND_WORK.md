# Memento Host Chat — Backend work (handoff for AI / engineers)

This document describes **what the backend must implement** so the **memento-web** frontend can finish Host Chat (single long-running thread, deep dive, enrichment UI, nudges, citations). It is derived from the product spec, `docs/MEMENTO_HOST_CHAT_IMPLEMENTATION.md`, and **actual calls** in this repo.

**Audience:** You are working in the **API/backend** codebase. Use this as the single checklist and contract sketch; adjust field names to match your stack, but keep semantics aligned with the web app.

---

## 1. Product goal (one sentence)

**One canonical text-chat thread per authenticated host**, with optional **deep dive** on a life dimension, **enrichment score** surfacing, **AI nudges**, and **citations**—without the client guessing which memory id is “the” host chat.

---

## 2. How the web app behaves today (contracts you must support or replace)

### 2.1 Resolving “which thread to open”

| Call | Method | Role today |
|------|--------|------------|
| `/memories/conversations` | `GET` (paginated) | Host chat landing loads **page 1** and navigates to **`docs[0]._id`** if any row exists. |
| `/ai/conversation/new` | `POST` | If the list is empty, the client posts `{ text: "", attachments: [] }` and expects a **`memory_id`** (or equivalent) in the response to navigate to `/chat/:id`. |

**Gap:** This is **not** a hard guarantee of exactly one thread per user. Two rows on page 1, or ordering changes, breaks the product model.

**Backend should provide:** A **deterministic** rule: either a dedicated endpoint (recommended below) or **server-enforced** single host-chat memory plus **migration** of legacy data.

### 2.2 Sending a message (streaming)

| Call | Method | Role |
|------|--------|------|
| `/ai/prompt` | `POST` | Streams assistant text chunks (body is JSON; response is a readable stream). |

**Body fields the web client already sends** (see `src/pages/dashboard/chat/conversation/index.tsx` + `src/api/fetcher.ts` — `streamlineFetcher` JSON-stringifies the arg minus `onChunk` and `signal`):

| Field | Type (conceptual) | Notes |
|-------|-------------------|--------|
| `text` | string | User message (may include quoted reply context built client-side). |
| `attachments` | string[] | Attachment ids. |
| `memory` | string | Memory / thread id. |
| `chatMode` | `"open"` \| `"deep_dive"` | **Deep dive** vs normal host chat. |
| `deepDiveDimension` | string \| null | Life-area key when `chatMode === "deep_dive"`; otherwise client sends `null`. |
| `dismissedNudgeDimensions` | string[] | Dimensions the user dismissed for **this browser session** (client-only today); server may persist or ignore until you define policy. |

**Backend must:** Accept these fields (ignore safely if you phase rollout), and **use them in `buildSystemPrompt`** (or equivalent) for mode + dimension. If a field is unknown, document versioned behavior.

### 2.3 Message history

| Call | Method | Role |
|------|--------|------|
| `/ai/prompt/messages/:memoryId` | `GET` | Paginated history (`next` cursor pattern); used for infinite scroll. |

Existing behavior must keep working for the canonical host memory id.

---

## 3. Life dimension keys (must align with web)

The web uses **Enrichment Score categories** for onboarding priorities, deep dive, and prompts (`EnrichmentCategory` in `src/features/enrichment/enrichment-categories.ts`, also `LifeDimension` in host chat):

- `identity_self`
- `relationships_people`
- `work_purpose`
- `memories_experiences`
- `beliefs_worldview`
- `passions_interests`
- `heritage_roots`
- `lessons_wisdom`
- `hopes_legacy`
- `everyday_life`

**Legacy API values** (e.g. `people_relationships`, `memories_stories`) are **migrated in the web client** when loading onboarding details; new writes should use the canonical keys above.

**Requirement:** API and prompts use **these exact snake_case values** for new data. Do not invent parallel enums without updating the web `LifeDimension` / `EnrichmentCategory` type.

---

## 4. Backend checklist (what to build)

### 4.1 Single canonical conversation per host

- [ ] **`getOrCreateHostConversation(userId)`** (name as you like): returns the **one** host chat thread id (memory id or new `conversation` id — see 4.6).
- [ ] **Race safety:** concurrent first visits must not create duplicates (transaction / unique constraint / idempotent create).
- [ ] **Migration job:** merge or **repoint** legacy “many chat memories” into one canonical thread; define what happens to **old** threads (archive flag, read-only, hidden from host chat UI, etc.).
- [ ] **Optional but ideal:** **`GET /ai/conversation/host`** (or `/memories/conversations/host`) returning `{ memory_id }` (or `{ conversation_id }`) so the web app can **stop** relying on “first row of paginated list.”

### 4.2 Extend `/ai/prompt` (or successor)

- [ ] Read **`chatMode`**, **`deepDiveDimension`**, **`dismissedNudgeDimensions`** from JSON body.
- [ ] **System prompt / tools:** incorporate enrichment context, deep-dive focus, and “no nudge for dismissed dimensions” per product rules.
- [ ] **Strip or never emit** raw `CITATION:` / `NUDGE:` markers in user-visible assistant text if the model emits them; prefer structured channels (4.4).

### 4.3 Enrichment score

- [ ] **Persist** a score (or deltas) per host as required by product.
- [ ] Expose at least one of:
  - **Read API:** e.g. `GET /users/enrichment` or `GET /memories/:id/enrichment` returning `{ percent, deltaToday }`, **or**
  - **Include in prompt response metadata** (4.4) so the client can update the bar after each reply.

The web **currently stubs** the bar (`HOST_CHAT_ENRICHMENT_STUB_PERCENT`); it will wire to your API once defined.

### 4.4 Response shape: nudges, enrichment delta, citations

The web is ready to **render**:

- A **milestone** when `enrichmentDelta` is present (currently always `null` client-side).
- **Nudge** UI is partly client-driven today; product target is **server-driven** nudge payload (dimension + copy).

**You must decide and document** one of:

1. **Trailing JSON line(s)** after stream text (client parses final chunk), or  
2. **Separate small JSON response** / header metadata, or  
3. **Server-Sent Events** / multiplexed stream.

**Suggested structured fields** (names illustrative — pick one schema and version it):

```json
{
  "enrichmentDelta": 3,
  "enrichmentPercent": 52,
  "nudge": {
    "dimension": "relationships_people",
    "title": "Optional headline",
    "body": "Optional body"
  },
  "citations": [
    { "label": "Story: Summer 1999", "memoryId": "...", "snippet": "..." }
  ]
}
```

- [ ] Define **exact JSON** and **when** it arrives (end of stream vs parallel).
- [ ] Ensure **assistant visible text** does not leak internal markers if you also return structured citations/nudges.

### 4.5 `/ai/conversation/new`

- [ ] When used for **empty-state bootstrap**, ensure it creates or returns the **canonical** host thread, not an arbitrary extra memory (align with 4.1).
- [ ] Response should continue to expose whatever id the web navigates with today (e.g. `memory_id` in `data` — confirm against current web `useFetcher` handling).

### 4.6 Data model decision (product + backend)

Document explicitly:

- **Option A:** One special **`IMemory`** (type `conversation` or flagged `is_host_chat`) per user.  
- **Option B:** New **`Conversation`** entity; web then needs a follow-up change to stop using memory id in routes (out of scope for this backend-only doc, but **you** must record the decision).

Frontend reference types: `src/utility/interface.ts` (`IMemory`, `IMessage`).

---

## 5. Security & auth

- [ ] All endpoints above scoped to **authenticated host**; never return another user’s conversation id or messages.
- [ ] Attachment ids in `POST /ai/prompt` validated as owned by the user.

---

## 6. Testing expectations (backend)

- [ ] Unit/integration tests for **get-or-create** idempotency.
- [ ] Tests for **migration** on a fixture DB (before/after counts, single canonical row).
- [ ] Contract tests for **prompt body** parsing (`chatMode`, `deepDiveDimension`, `dismissedNudgeDimensions`).
- [ ] Stream test asserting **metadata** parse path if you add a trailer JSON format.

---

## 7. After backend ships (web repo follow-ups — for awareness only)

Not required in the backend repo, but the web team will likely:

- Replace “first page of `/memories/conversations`” with **`getOrCreate`-style** endpoint if you add it.
- Wire **`HostChatEnrichmentBar`** and **`MilestoneCard`** to real **`enrichmentPercent` / `enrichmentDelta`**.
- Parse **citations** and **server nudges** from your stream/metadata format.
- Update **MSW** mocks in `src/test/mocks/handlers.ts` to match the new contracts.

---

## 8. Quick reference — web repo paths

| Topic | Path |
|-------|------|
| Send payload & stream | `src/pages/dashboard/chat/conversation/index.tsx`, `src/api/fetcher.ts` |
| Host chat entry / list | `src/pages/dashboard/chat/main/host-chat-entry.tsx` |
| API paths | `src/api/endpoint.ts` |
| Dimension keys / labels | `src/features/enrichment/enrichment-categories.ts`, `src/features/host-chat/chat.types.ts`, `src/features/onboarding-groot/types.ts` |
| Product + frontend roadmap | `docs/MEMENTO_HOST_CHAT_IMPLEMENTATION.md` |

---

*This file lives in **memento-web** so frontend and backend stay aligned; update it when API paths or JSON fields are finalized.*
