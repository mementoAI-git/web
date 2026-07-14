# Memento Agentic AI Implementation Plan

> **For agentic workers:** Treat this as the architecture and delivery plan for moving Memento from isolated AI helpers to a shared agent system. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Memento’s current AI features from scattered “suggest-only” actions into a clean, reusable system that can assist and act across story creation, host chat, onboarding, media organization, and archive enrichment.

**Architecture:** Keep the React app thin. Put durable orchestration, tool execution, prompt assembly, and multi-step workflows in `api/`. In `memento-web`, create a shared AI client layer so chat, onboarding, story creation, and future assistants all use the same contracts instead of each feature inventing its own request/response pattern.

**Eve position:** Treat Eve as the backend harness for agent execution, not as a product surface by itself. The app should think in terms of Memento tasks, subagents, and permissions; Eve should provide the runtime underneath for the flows that need durable sessions, tool calls, resumability, and observability.

**Tech Stack:** `memento-web` (React, TypeScript, SWR, Vite), `api/` (Express, TypeScript, Mongoose, existing AI provider routing), existing OpenRouter/Groq/Gemini services, current feature-flag system.

---

## Implementation Status Snapshot

- [x] Shared web AI task layer exists in `memento-web/src/features/ai/`
- [x] Structured task endpoint exists at `POST /ai/tasks/run`
- [x] Eve adapter is in place behind the backend workflow layer for selected tasks
- [x] Shared backend subagent registry exists in `api/src/services/ai/subagents/`
- [x] Action-oriented chat/composer tasks are now Eve-backed with direct fallback
  - `assistant.select_subagent`
  - `story.suggest_title`
  - `story.suggest_tags`
  - `story.rewrite_draft`
  - `story.identify_missing_details`
  - `story.connect_related_memory`
  - `story.draft_from_notes`
  - `story.expand_draft`
  - `chat.deep_dive_followup`
  - `story.classify_memory`
  - `story.organize_uploads`
  - `archive.enrich_memory`
  - `archive.enrich_batch`
- [x] All 5 planned subagents now have executable task coverage in the shared task router:
  - conversation: `assistant.select_subagent`
  - writing: `story.rewrite_draft`, `story.draft_from_notes`, `story.expand_draft`
  - memory digging: `story.identify_missing_details`, `story.connect_related_memory`, `chat.deep_dive_followup`
  - metadata: `story.suggest_title`, `story.suggest_tags`, `story.classify_memory`
  - media/archive: `story.organize_uploads`, `archive.enrich_memory`, `archive.enrich_batch`
- [ ] Host chat, onboarding, and archive UI surfaces are not fully switched over to these shared tasks yet
  - Host chat now uses the shared task layer for deep-dive follow-up prompts while keeping `/ai/prompt` as the stream transport.
  - Onboarding now uses the shared task layer for post-turn follow-up guidance while keeping `/users/onboarding/chat/prompt` as the stream transport.
  - Main streaming chat replies still run through the existing direct chat transport and are intentionally not fully moved to Eve yet.

### Chat/Eve split

- [x] **Use Eve for action-oriented chat/composer work**
  - routing user intent to a specialist subagent
  - rewriting or expanding memory drafts
  - generating title and tags
  - identifying missing details
  - suggesting deep-dive follow-up questions
  - classifying a memory
  - organizing uploads

- [x] **Keep normal streamed chat direct for now**
  - host chat `/ai/prompt`
  - onboarding chat `/users/onboarding/chat/prompt`
  - reason:
    - lower latency
    - simpler streaming path
    - fewer moving parts for ordinary conversation turns
    - Eve is reserved for structured actions, tool use, and orchestration

---

## 1. Current State Audit

### What already exists

- [x] **Text AI exists, but mainly as endpoint calls**
  - `memento-web/src/pages/dashboard/chat/conversation/index.tsx` streams `/ai/prompt`
  - `memento-web/src/api/host-onboarding-chat.ts` streams `/users/onboarding/chat/prompt`
  - `memento-web/src/components/Buttons/AutogenerateTagsButton.tsx` calls `/ai/generate-tags`
  - `memento-web/src/components/Buttons/AutogenerateTitleButton.tsx` calls `/ai/generate-story-title`
  - `memento-web/src/components/player/transcription.tsx` calls `/ai/transcribe-audio`
  - `memento-web/src/components/modal/memory/create/index.tsx` now has an Assistant tab backed by structured tasks for:
    - `story.rewrite_draft`
    - `story.identify_missing_details`
    - `story.connect_related_memory`
  - Important limitation:
    - host chat and onboarding still use the older stream-first transport contracts, but both now layer shared structured tasks on top for follow-up guidance

- [x] **Backend AI foundation exists**
  - `api/src/module/api/ai/service.ts` already handles chat bootstrap, tags, title generation, transcription, and telemetry
  - `api/src/services/ai/model-routing.ts` already routes tasks such as `chat_primary`, `onboarding_chat`, `tags_generate`, `title_generate`
  - `api/src/services/ai/critical-chat-stream.ts` already provides a reliability layer for critical streaming chat
  - `api/src/services/ai/workflows/task-router.ts` now routes structured Memento AI tasks
  - `api/src/services/ai/workflows/eve-adapter.ts` now provides the harness boundary for selected Eve-backed tasks
  - `api/src/services/ai/subagents/` now defines the 5 planned subagents and their task ownership

- [x] **Enrichment and chat context already influence some AI UX**
  - `memento-web/src/features/enrichment/use-enrichment-stats.ts`
  - `memento-web/src/components/memory/sidebar-details.tsx`
  - `memento-web/docs/MEMENTO_ENRICHMENT_SCORE.md`
  - `memento-web/docs/MEMENTO_HOST_CHAT_IMPLEMENTATION.md`

### What is missing

- [ ] **Shared AI action abstraction exists, but adoption is incomplete**
  - `memento-web/src/features/ai/` now provides shared task definitions, state, and hooks.
  - The main remaining gap is adoption:
    - host chat still streams through `/ai/prompt`, though deep-dive follow-up now comes from the shared task layer
    - onboarding still streams through `/users/onboarding/chat/prompt`, though post-turn follow-up now comes from the shared task layer
    - some older stream-first and one-off AI surfaces still bypass the shared task layer

- [ ] **Shared orchestration layer exists, but internal business tools are still thin**
  - The backend now has:
    - task contracts
    - a structured task router
    - subagent ownership
    - an Eve adapter boundary
  - The main remaining backend gap is moving more logic into reusable tool-style service functions for:
    - reading draft context
    - reading uploads and memory history
    - preparing or applying metadata patches
    - launching durable enrichment work

- [ ] **No consistent tool model**
  - Current structured tasks exist, and the first shared tool extraction has started in `api/src/services/ai/tools/`.
  - However, many handlers still rely on direct service functions and heuristics rather than a complete first-class tool layer.
  - The next backend cleanup should standardize how tasks:
    - read a draft
    - inspect uploaded files
    - update story metadata
    - save intermediate results
    - emit structured actions for the client to apply

- [ ] **The composer assistant is only partially connected to product capabilities**
  - `memento-web/src/components/modal/memory/create/index.tsx`
  - It now executes real structured tasks for rewriting and memory digging.
  - The main remaining gap is broader routing and product actions:
    - assistant freeform routing via `assistant.select_subagent`
    - metadata actions in the same shared layer
    - upload and archive flows exposed more directly in UI

### Main architectural problem

- [ ] **AI is currently feature-by-feature**
  - Good for experiments
  - Bad for scale, consistency, testing, safety, and product velocity

- [ ] **If we keep shipping this way, we will get**
  - duplicated prompt logic
  - duplicated telemetry and loading states
  - inconsistent permissions
  - UI assistants that can talk but not act
  - harder future migration if Memento adopts a framework like Vercel Eve

---

## 2. Clean Target Architecture

### Core principle

- [ ] **Do not put agent logic in React components**
  - React should request AI work and render results.
  - `api/` should decide how AI tasks run, what tools are available, and what state changes are allowed.

### Recommended layers

#### Layer A: Capability contracts

- [ ] Create a shared capability model for AI tasks
  - Examples:
    - `story.draft_from_notes`
    - `story.suggest_tags`
    - `story.suggest_title`
    - `story.organize_uploads`
    - `story.quality_review`
    - `chat.deep_dive_followup`
    - `archive.enrich_memory`

- [ ] Represent every capability with:
  - input schema
  - output schema
  - allowed side effects
  - telemetry name

#### Layer B: Backend orchestration

- [ ] Add a workflow layer in `api/` above provider routing
  - Provider routing already exists.
  - What is missing is task orchestration.

- [ ] New backend responsibility:
  - choose the right model/task route
  - build prompts
  - call internal tools
  - validate structured outputs
  - persist results
  - return either:
    - suggestions
    - prepared changes
    - executed results

#### Layer C: Internal tool adapters

- [ ] Add explicit internal tools for agents to use
  - `loadMemoryDraft(memoryId)`
  - `loadUploadedFiles(fileIds)`
  - `classifyUploadedFiles(fileIds)`
  - `saveStoryDraft(memoryId, patch)`
  - `updateStoryMetadata(memoryId, fields)`
  - `appendConversationMessages(memoryId, messages)`
  - `enqueueArchiveEnrichment(memoryIds)`

- [ ] These tools should be normal backend functions first
  - even if a future framework like Eve is adopted later

#### Layer D: Web AI client

- [ ] Create one shared AI client layer in `memento-web`
  - one hook family
  - one request format
  - one response format
  - one event model for loading, partial progress, suggestions, prepared actions, and completion

#### Layer E: Product surfaces

- [ ] Chat, onboarding, story creation, and future assistants should all plug into the same AI client layer
  - not call custom endpoints ad hoc unless there is a strong reason

#### Layer F: Agent harness

- [ ] Use Eve as the harness beneath the workflow layer
  - It should host the durable subagent runs that need:
    - long-lived sessions
    - tool orchestration
    - resumable multi-step execution
    - workflow observability

- [ ] Keep Memento’s own concepts above the harness
  - product tasks stay Memento-named
  - subagent boundaries stay Memento-defined
  - permission rules stay Memento-owned
  - frontend never depends on raw Eve semantics

### Recommended subagent model

- [ ] **Use one visible Assistant, backed by 5 specialized subagents**
  - The user should experience one coherent Assistant in the app.
  - Internally, that Assistant can route work to specialized subagents with narrow responsibilities.
  - This is cleaner than one giant agent trying to do every job in Memento.
  - This model must work across:
    - Add Memory / story composer
    - host chat
    - onboarding chat
    - quick capture enrichment
    - archive/admin enrichment flows

- [ ] **Subagent 1: Conversation agent**
  - Role:
    - primary user-facing assistant brain
    - interprets user intent
    - decides which subagent should handle the request
    - combines outputs into one final user-facing response
  - Best surfaces:
    - Assistant tab
    - host chat
    - onboarding chat
  - Should not:
    - own domain-heavy logic for rewriting, media organization, or enrichment by itself

- [ ] **Subagent 2: Writing agent**
  - Role:
    - rewrite drafts in different tones
    - turn rough notes into clearer memory drafts
    - help convert conversation or quick capture into publishable story text
  - Best surfaces:
    - story composer Assistant tab
    - host chat action: “turn this into a memory”
  - Early capabilities:
    - `story.rewrite_draft`
    - `story.draft_from_notes`
    - `story.expand_draft`

- [ ] **Subagent 3: Memory digging agent**
  - Role:
    - ask follow-up questions
    - identify missing details
    - uncover emotions, lessons, sensory details, and meaningful connections
  - Best surfaces:
    - story composer Assistant tab
    - host chat
    - onboarding follow-up moments
  - Early capabilities:
    - `story.identify_missing_details`
    - `chat.deep_dive_followup`
    - `story.connect_related_memory`

- [ ] **Subagent 4: Metadata agent**
  - Role:
    - improve structure around the memory
    - suggest titles, tags, categories, beneficiaries, and light content labels
  - Best surfaces:
    - story composer
    - quick capture enrichment
    - archive cleanup flows
  - Early capabilities:
    - `story.suggest_title`
    - `story.suggest_tags`
    - `story.classify_memory`

- [ ] **Subagent 5: Media and archive agent**
  - Role:
    - classify uploads
    - decide inline media vs attachment placement
    - run enrichment across older memories
    - support durable, multi-step archive jobs
  - Best surfaces:
    - story composer upload organization
    - admin enrichment tools
    - background archive improvement jobs
  - Early capabilities:
    - `story.organize_uploads`
    - `archive.enrich_memory`
    - `archive.enrich_batch`

- [ ] **Important operating rule**
  - One visible Assistant can delegate to many subagents.
  - The app should not expose five separate chat personalities unless there is a product reason.
  - Internally specialized, externally simple.

---

## 3. Refactors Required Before Agentic Features Scale Cleanly

### Frontend refactors

- [x] **Extract a shared AI feature package**
  - Create: `memento-web/src/features/ai/`
  - Responsibility:
    - task request types
    - task result types
    - shared hooks
    - shared UI state helpers
    - feature-flag gating helpers

- [x] **Move the composer assistant out of `create/index.tsx`**
  - Current file is already large and mixes:
    - modal shell
    - draft persistence
    - uploads
    - editor
    - access/tags
    - placeholder assistant chat
  - Split into:
    - `src/components/modal/memory/create/create-memory-shell.tsx`
    - `src/components/modal/memory/create/create-memory-properties-panel.tsx`
    - `src/components/modal/memory/create/create-memory-assistant-panel.tsx`
    - `src/components/modal/memory/create/create-memory-ai.ts`

- [ ] **Stop embedding AI behavior in leaf buttons**
  - Refactor:
    - `src/components/Buttons/AutogenerateTagsButton.tsx`
    - `src/components/Buttons/AutogenerateTitleButton.tsx`
  - These should become thin wrappers around shared AI task hooks.

- [ ] **Unify host chat and onboarding stream handling patterns**
  - Today:
    - host chat stream path and onboarding stream path are separate implementations
    - both are valid, but the parsing, metadata, and progress patterns should converge

### Backend refactors

- [ ] **Create a workflow directory in `api/`**
  - Create:
    - `api/src/services/ai/workflows/`
    - `api/src/services/ai/tools/`
    - `api/src/services/ai/contracts/`
  - Current status:
    - `workflows/` exists
    - `contracts/` exists
    - `subagents/` exists
    - `tools/` is still the main missing piece

- [ ] **Keep provider routing where it is**
  - `api/src/services/ai/model-routing.ts`
  - `api/src/services/ai/openrouter.ts`
  - `api/src/services/ai/groq.ts`
  - `api/src/services/ai/critical-chat-stream.ts`
  - These remain infrastructure, not product workflow code.

- [x] **Introduce a task router above providers**
  - Example file:
    - `api/src/services/ai/workflows/task-router.ts`
  - This chooses the workflow, not just the model.

- [x] **Separate “chat transport” from “agent workflow”**
  - `/ai/prompt` should remain for live chat streaming
  - New agent-style endpoints should handle structured tasks cleanly

---

## 4. Recommended API Shape

### Keep existing endpoints

- [ ] Keep current endpoints working:
  - `/ai/prompt`
  - `/users/onboarding/chat/prompt`
  - `/ai/generate-tags`
  - `/ai/generate-story-title`
  - `/ai/transcribe-audio`

### Add new structured task endpoint

- [x] Add one generic task endpoint in `api/`
  - Example:
    - `POST /ai/tasks/run`

- [ ] Request shape

```json
{
  "task": "story.organize_uploads",
  "context": {
    "memory_id": "mem_123",
    "file_ids": ["file_1", "file_2"]
  },
  "mode": "assist"
}
```

- [ ] Response shape

```json
{
  "status": "completed",
  "task": "story.organize_uploads",
  "mode": "assist",
  "result": {
    "summary": "Grouped 6 uploads into photos, voice notes, and documents.",
    "suggested_changes": {
      "inline_media": ["file_1", "file_2"],
      "attachments": ["file_3"]
    }
  }
}
```

- [x] Support three execution modes
  - `suggest`
  - `assist`
  - `act`

### Why this matters

- [ ] This lets Memento add real agents without forcing every feature to invent:
  - a new endpoint
  - a new prompt contract
  - a new loading/result UI

---

## 5. Where Vercel Eve Fits

### Recommendation

- [ ] **Use Eve as the durable backend runtime, not as a frontend framework**
  - Keep React thin and product-oriented.
  - Add Eve behind `api/` where sessions, tools, and long-running work belong.
  - Do not let UI components call Eve concepts directly.

### What Eve changes in this plan

- [ ] Eve gives Memento a real agent runtime for:
  - durable agent sessions
  - typed tools
  - multi-step workflows
  - resumable runs
  - observability around agent execution

- [ ] This means Memento does **not** need to invent its own long-running agent engine in `api/`.
- [ ] Memento **does** still need its own:
  - product task contracts
  - internal data tools
  - permission rules
  - UI task state model
  - subagent routing model

### Eve as the harness, not the product API

- [ ] The product contract should remain:
  - `web surface -> /ai/tasks/run or chat stream -> task router -> subagent -> tools -> result`

- [ ] The Eve contract should remain internal:
  - `task router -> Eve-backed workflow when needed`

- [ ] This separation matters because:
  - Add Memory, chat, onboarding, and future surfaces must all reuse the same subagents
  - Memento should be able to move some subagents onto Eve before others
  - the frontend should not need to know which subagent is one-shot vs Eve-backed

### Best use of Eve in Memento

- [ ] Eve is a strong fit for:
  - long-running archive enrichment jobs
  - multi-step interview flows
  - agents that call multiple tools
  - assistant sessions that need resumability

- [ ] Eve is **not** the right place to start for:
  - simple title suggestion
  - simple tag suggestion
  - one-shot text transforms with no tool use
  - UI-only orchestration concerns

### How the 5 subagents fit into Eve

- [ ] **Conversation agent**
  - Usually starts as a backend orchestration layer, not a durable Eve workflow
  - Can remain lightweight unless it needs resumable, tool-heavy sessions

- [ ] **Writing agent**
  - Can begin as one-shot structured tasks
  - Eve becomes useful later if rewriting turns into multi-step co-writing sessions with follow-up loops

- [ ] **Memory digging agent**
  - Strong Eve candidate
  - Best when it runs multi-turn interviews, asks follow-up questions, and resumes context over time

- [ ] **Metadata agent**
  - Usually should stay outside Eve at first
  - Most metadata jobs are fast, one-shot, and structured

- [ ] **Media and archive agent**
  - Strongest Eve candidate
  - Best fit for multi-step file inspection, archive enrichment, batch jobs, and resumable workflows

### Clean integration point

- [ ] Place Eve behind the workflow layer in `api/`
  - Good:
    - `web app -> api route -> task router -> Eve agent/workflow -> tools -> result`
  - Bad:
    - `React component -> Eve-specific logic`
    - `React component -> direct agent/session runtime`
    - `one surface invents a one-off subagent path that other surfaces cannot reuse`

### Decision rule

- [ ] Build the interfaces so Memento can support:
  - direct one-shot handlers for simple tasks now
  - Eve-backed workflows for durable/multi-step tasks

### Concrete Eve integration path

- [ ] Add Eve only in `api/`
  - Create:
    - `api/agent/`
    - `api/agent/tools/`
    - `api/agent/workflows/`
    - `api/agent/schemas/`

- [ ] Initial backend structure
  - `api/agent/index.ts`
    - Eve bootstrap and registration entry
  - `api/agent/tools/load-memory.ts`
  - `api/agent/tools/load-uploaded-files.ts`
  - `api/agent/tools/update-memory.ts`
  - `api/agent/tools/save-draft-patch.ts`
  - `api/agent/workflows/archive-enrichment.ts`
  - `api/agent/workflows/memory-interview.ts`
  - `api/agent/workflows/story-organizer.ts`

- [ ] Keep `api/src/module/api/ai/routes.ts` as the HTTP boundary
  - It should translate web requests into:
    - one-shot task execution for simple work
    - Eve workflow/agent execution for durable work

- [ ] Add an adapter layer so the rest of `api/` does not depend on Eve naming
  - Example:
    - `api/src/services/ai/workflows/task-router.ts`
    - `api/src/services/ai/workflows/eve-adapter.ts`

- [ ] Treat this adapter as the harness boundary
  - above it:
    - Memento tasks
    - Memento subagents
    - Memento permissions
  - below it:
    - Eve sessions
    - Eve workflow runtime
    - Eve tool execution

- [ ] First Eve-backed workflows
  - archive enrichment batches
  - multi-step story interview / follow-up questioning
  - upload classification + organization when multiple files and multi-step reasoning are involved

- [ ] Keep these outside Eve at first
  - title suggestion
  - tag suggestion
  - transcription pass-through
  - simple chat adornments / metadata extraction

- [ ] Environment and platform work to plan for
  - Vercel project setup for Eve runtime features
  - environment variables for model access and observability
  - deployment path for `api/` so Eve-backed flows run in the backend project, not the web bundle

---

## 6. Phased Delivery Plan

### Phase 0: Foundation and contracts

**Goal:** Create the shared architecture before adding more AI surfaces.

**Status:** Largely complete. The remaining gap is deeper tool extraction and rollout flags, not the core contract shape.

**Files:**
- Create: `memento-web/src/features/ai/`
- Create: `api/src/services/ai/workflows/`
- Create: `api/src/services/ai/tools/`
- Create: `api/src/services/ai/contracts/`
- Modify: `memento-web/src/api/endpoint.ts`
- Modify: `api/src/module/api/ai/routes.ts`
- Modify: `api/src/module/api/ai/service.ts`

- [x] Define the canonical AI task list and execution modes.
- [x] Define request/response schemas for `/ai/tasks/run`.
- [x] Define which tasks are one-shot handlers vs Eve-backed workflows.
- [x] Add telemetry fields for task name, mode, duration, model, tool usage, and success/failure.
- [x] Add agent execution metadata fields for future Eve compatibility:
  - `session_id`
  - `run_id`
  - `workflow_id`
  - `tool_calls`
- [ ] Add feature flags for task rollout:
  - `ai.story_assistant_v2`
  - `ai.story_media_organizer`
  - `ai.archive_enrichment_v1`

- [x] Create Eve-facing backend seams now, even if only some are implemented immediately:
  - `api/src/services/ai/workflows/task-router.ts`
  - `api/src/services/ai/workflows/eve-adapter.ts`
  - `api/agent/tools/`
  - `api/agent/workflows/`

### Phase 1: Shared web client

**Goal:** Give the web app one reusable way to invoke AI tasks.

**Status:** Core implementation complete. Adoption across the app is still partial.

**Files:**
- Create: `memento-web/src/features/ai/tasks.ts`
- Create: `memento-web/src/features/ai/use-ai-task.ts`
- Create: `memento-web/src/features/ai/ai-task.types.ts`
- Create: `memento-web/src/features/ai/ai-task-state.ts`
- Modify: `memento-web/src/hooks/use-api.ts`

- [x] Add a shared `useAiTask` hook for structured AI work.
- [x] Add helpers for `suggest`, `assist`, and `act` UX states.
- [x] Standardize task error handling and user-facing fallbacks.
- [x] Keep streaming chat separate, but align metadata/event naming with the task layer.
- [x] Include Eve-compatible metadata in the client contract from the start:
  - optional `session_id`
  - optional `run_id`
  - optional `workflow_id`
  - optional progress/events envelope

### Revised Phase 1 scope

- [ ] Treat `useAiTask` as the stable frontend boundary for both:
  - simple one-shot AI calls
  - durable Eve-backed workflow calls

- [ ] Expand the Phase 1 response contract to include:
  - task result payload
  - execution summary
  - run/session/workflow identifiers
  - progress envelope
  - event list

- [ ] Expand local task state to track:
  - current lifecycle status
  - result payload
  - execution metadata
  - user-facing error state

- [ ] Keep legacy endpoints compatible
  - old one-shot endpoints may return only result data
  - Eve-ready endpoints may return result + execution metadata
  - the same hook should handle both cleanly

- [ ] Do **not** add frontend Eve concepts beyond metadata handling
  - no direct Eve SDK usage in `memento-web`
  - no frontend session orchestration logic
  - no workflow engine behavior in React

### Phase 1 revision after reviewing Eve

- [ ] **Revision:** Phase 1 still stands and should not be replaced.
- [ ] **Adjustment:** Phase 1 should explicitly carry workflow/session metadata so the frontend does not need another contract rewrite when Eve-backed tasks start returning durable run information.
- [ ] **Practical meaning:** `useAiTask` remains the right abstraction, but its response types and event naming should be widened slightly for Eve-backed runs.

### Phase 2: Story composer assistant v1

**Goal:** Replace the placeholder assistant in the story composer with a real AI panel.

**Status:** Partially complete. The composer assistant is real for rewrite and memory-digging flows; metadata and broader routing are still incomplete.

**Files:**
- Modify: `memento-web/src/components/modal/memory/create/index.tsx`
- Create: `memento-web/src/components/modal/memory/create/create-memory-assistant-panel.tsx`
- Create: `memento-web/src/components/modal/memory/create/create-memory-ai.ts`
- Modify: `memento-web/src/components/Buttons/AutogenerateTagsButton.tsx`
- Modify: `memento-web/src/components/Buttons/AutogenerateTitleButton.tsx`
- Create: `api/src/services/ai/workflows/story-draft.ts`
- Create: `api/src/services/ai/workflows/story-quality-review.ts`
- Create: `api/src/services/ai/workflows/story-organize-uploads.ts`

- [x] Make the Assistant tab real.
- [ ] First supported tasks:
  - suggest title
  - suggest tags
  - identify what is missing
  - organize current uploads into inline media vs attachments
- [ ] First subagents active in this phase:
  - writing agent
  - memory digging agent
  - metadata agent
- [x] Return structured draft patches, not free-text only.
- [x] Keep save/apply actions explicit in the UI for this phase.
- [ ] Important scope rule:
  - this phase starts in Add Memory, but its tasks and subagents must be built so they can later be reused in chat and onboarding without another contract rewrite

### Phase 3: Host chat actionable assistance

**Goal:** Upgrade host chat from pure conversation into guided action where appropriate.

**Files:**
- Modify: `memento-web/src/pages/dashboard/chat/conversation/index.tsx`
- Modify: `memento-web/src/features/enrichment/use-enrichment-stats.ts`
- Create: `api/src/services/ai/workflows/chat-deep-dive.ts`
- Create: `api/src/services/ai/workflows/chat-nudge.ts`
- Modify: `api/src/module/api/ai/service.ts`

- [x] Keep `/ai/prompt` for streaming conversation.
- [ ] Add structured metadata for:
  - follow-up question suggestions
  - enrichment actions
  - draftable story prompts
- [ ] Allow chat to trigger tasks like:
  - “turn this discussion into a draft story”
  - “save these details to my current draft”
- [ ] Primary subagents active in this phase:
  - conversation agent
  - writing agent
  - memory digging agent
- [x] Reuse rule:
  - do not build host chat as a separate AI stack
  - it should call the same subagent/task layer already introduced for the story composer

### Phase 4: Onboarding integration

**Goal:** Reuse the same workflow patterns in onboarding chat.

**Files:**
- Modify: `memento-web/src/api/host-onboarding-chat.ts`
- Modify: `memento-web/src/pages/onboard-chat/host-onboarding-chat-screen.tsx`
- Create: `api/src/services/ai/workflows/onboarding-personalization.ts`

- [x] Keep the current onboarding stream contract.
- [x] Add post-turn structured outcomes for:
  - extracted interests
  - suggested life dimensions
  - onboarding-to-host-chat handoff summary
- [x] Persist useful onboarding output in reusable structured form, not only transcript text.
- [ ] Primary subagents active in this phase:
  - conversation agent
  - memory digging agent
  - metadata agent
- [x] Reuse rule:
  - onboarding should consume the same subagent harness with a different surface contract, not invent onboarding-only agent logic where avoidable

### Phase 5: Media organizer and archive enrichment

**Goal:** Add the first truly agentic actions that perform real product work.

**Files:**
- Create: `api/src/services/ai/workflows/archive-enrich-memory.ts`
- Create: `api/src/services/ai/workflows/archive-enrich-batch.ts`
- Create: `api/src/services/ai/tools/load-memory.ts`
- Create: `api/src/services/ai/tools/update-memory.ts`
- Create: `memento-web/src/features/ai/archive-enrichment/`

- [ ] Add media classification and placement as a first “act” mode workflow.
- [ ] Add admin or user-triggered archive enrichment jobs.
- [ ] Ensure jobs are resumable and observable.
- [ ] Primary subagents active in this phase:
  - media and archive agent
  - metadata agent
- [ ] Harness rule:
  - this is where Eve should start becoming more central, because these flows benefit most from resumable multi-step execution

### Phase 6: Optional Eve adoption

**Goal:** Use Eve only where the product benefits from a stronger runtime.

**Files:**
- Create: `api/agent/`
- Create: `api/agent/tools/`
- Create: `api/agent/workflows/`
- Modify: `api/src/services/ai/workflows/task-router.ts`
- Modify: `api/src/module/api/ai/routes.ts`
- Modify: `api/src/module/api/ai/service.ts`

- [ ] Move durable, multi-step tasks behind the Eve adapter after task contracts are stable.
- [ ] Do not rewrite all AI paths at once.
- [ ] Start with:
  - archive enrichment batches
  - multi-step memory interview sessions
  - complex upload organization
- [ ] This is the point where the first true Eve-backed subagents should emerge:
  - memory digging agent for interview-style workflows
  - media and archive agent for enrichment and organization workflows

---

## 7. Subagent rollout order

- [ ] **Start in this order**
  1. metadata agent
  2. writing agent
  3. memory digging agent
  4. conversation agent
  5. media and archive agent

### Why this order

- [ ] **Metadata agent first**
  - easiest to scope
  - highest confidence structured outputs
  - low product risk

- [ ] **Writing agent second**
  - immediately visible product value
  - clean fit for the Assistant tab
  - already partially underway through `story.rewrite_draft`

- [ ] **Memory digging agent third**
  - unlocks deeper and more differentiated Memento experiences
  - introduces more multi-step reasoning without yet requiring full archive workflows

- [ ] **Conversation agent fourth**
  - becomes more useful once specialized agents already exist behind it
  - otherwise it risks becoming a thin router with nothing meaningful to delegate to

- [ ] **Media and archive agent fifth**
  - most operationally complex
  - strongest candidate for durable Eve workflows
  - should come after task contracts and tool boundaries are stable

### Subagent task matrix

| Subagent | Primary job | First app surface | Initial tasks | Internal tools it should use first | Allowed actions at launch |
|---|---|---|---|---|---|
| Conversation agent | Understand the user request and route work | Assistant tab, host chat, onboarding chat | `assistant.route_request`, `chat.deep_dive_followup`, `chat.compose_response` | `loadMemoryDraft`, `appendConversationMessages`, `loadUserContext` | `suggest`, `assist` |
| Writing agent | Rewrite and expand story drafts | Story composer Assistant tab | `story.rewrite_draft`, `story.draft_from_notes`, `story.expand_draft` | `loadMemoryDraft`, `saveStoryDraftPatch`, `loadUploadedFiles` | `suggest`, `assist` |
| Memory digging agent | Ask better follow-ups and uncover missing meaning | Story composer Assistant tab, host chat | `story.identify_missing_details`, `story.connect_related_memory`, `chat.deep_dive_followup` | `loadMemoryDraft`, `loadMemoryTimeline`, `loadUserContext` | `suggest`, `assist` |
| Metadata agent | Improve structure around the memory | Story composer properties + Assistant tab | `story.suggest_title`, `story.suggest_tags`, `story.classify_memory` | `loadMemoryDraft`, `updateStoryMetadata`, `loadTagHistory` | `suggest`, `assist`, narrow `act` later |
| Media and archive agent | Organize files and enrich memory archives | Upload organization flow, admin enrichment surfaces | `story.organize_uploads`, `archive.enrich_memory`, `archive.enrich_batch` | `loadUploadedFiles`, `classifyUploadedFiles`, `updateStoryMetadata`, `enqueueArchiveEnrichment` | `assist`, `act` |

### Subagent tool boundaries

- [ ] **Conversation agent tool boundary**
  - Can read:
    - current draft context
    - current chat thread
    - lightweight user context
  - Should not:
    - directly mutate story metadata
    - directly reorganize uploads
    - directly launch archive jobs

- [ ] **Writing agent tool boundary**
  - Can read:
    - current draft title/body
    - uploaded file summaries
  - Can prepare:
    - body patch
    - title refinement
  - Should not:
    - silently publish a story
    - silently modify beneficiaries or sharing state

- [ ] **Memory digging agent tool boundary**
  - Can read:
    - draft text
    - memory history summaries
    - enrichment gaps
  - Can prepare:
    - suggested follow-up questions
    - suggested memory links
  - Should not:
    - auto-apply content changes without the writing agent or explicit user confirmation

- [ ] **Metadata agent tool boundary**
  - Can read:
    - title/body text
    - tag history
    - existing story metadata
  - Can prepare or apply:
    - tags
    - title suggestions
    - lightweight classifications
  - Should not:
    - rewrite the body
    - operate on uploads directly

- [ ] **Media and archive agent tool boundary**
  - Can read:
    - uploaded files
    - file classifications
    - archive enrichment stats
  - Can prepare or apply:
    - inline vs attachment placement
    - archive enrichment job creation
    - bulk metadata proposals
  - Should not:
    - act as the main user-facing conversational layer

### First ownership map in the product

- [ ] **Story composer**
  - Conversation agent:
    - translates user asks into the right drafting, digging, metadata, or upload task
  - Writing agent:
    - rewrite draft
    - expand rough notes
  - Memory digging agent:
    - ask “what is missing?”
    - suggest deeper emotional or sensory detail
  - Metadata agent:
    - suggest title and tags
  - Media and archive agent:
    - organize uploads

- [ ] **Host chat**
  - Conversation agent:
    - primary visible layer
  - Writing agent:
    - “turn this into a memory”
  - Memory digging agent:
    - deeper follow-up questioning
  - Metadata agent:
    - classify themes or possible tags for saved outcomes

- [ ] **Onboarding**
  - Conversation agent:
    - primary visible layer
  - Memory digging agent:
    - uncover richer personal signals
  - Metadata agent:
    - structure extracted interests, dimensions, and handoff summaries

- [ ] **Archive/admin enrichment**
  - Media and archive agent:
    - main actor
  - Metadata agent:
    - support categorization and structured output

### Safe launch rules for subagents

- [ ] Only one subagent should be user-visible at a time
  - The visible experience remains “the Assistant”
  - Subagent switching is internal orchestration

- [ ] Every subagent should have a narrow tool permission set
  - Do not give all agents write access to all memory fields

- [ ] `act` mode should start with only two safe areas
  - upload organization
  - archive enrichment job creation

- [ ] Writing changes should remain reviewable
  - rewritten story content should still require explicit apply/update in the UI

- [ ] Metadata changes can move to lighter approval sooner
  - title/tags can eventually become one-click apply flows

### Subagent implementation checklist

#### Metadata agent

- [ ] **Build this first**
  - Why:
    - cleanest structured outputs
    - lowest operational risk
    - easiest way to harden the shared task system

- [ ] Backend tasks to create or stabilize
  - `story.suggest_title`
  - `story.suggest_tags`
  - `story.classify_memory`

- [ ] Backend tools to add
  - `api/src/services/ai/tools/load-memory-draft.ts`
  - `api/src/services/ai/tools/update-story-metadata.ts`
  - `api/src/services/ai/tools/load-tag-history.ts`

- [ ] Frontend surfaces to wire first
  - `memento-web/src/components/Buttons/AutogenerateTitleButton.tsx`
  - `memento-web/src/components/Buttons/AutogenerateTagsButton.tsx`
  - story composer Assistant tab metadata prompts

- [ ] Minimum ship criteria
  - title suggestion uses shared task system
  - tag suggestion uses shared task system
  - classification output is structured, even if not yet widely exposed in UI

#### Writing agent

- [ ] **Build this second**
  - Why:
    - highest visible user value
    - directly improves the Assistant tab experience

- [ ] Backend tasks to create or stabilize
  - `story.rewrite_draft`
  - `story.draft_from_notes`
  - `story.expand_draft`

- [ ] Backend tools to add
  - `api/src/services/ai/tools/load-memory-draft.ts`
  - `api/src/services/ai/tools/save-draft-patch.ts`
  - `api/src/services/ai/tools/load-uploaded-files.ts`

- [ ] Frontend surfaces to wire first
  - `memento-web/src/components/modal/memory/create/create-memory-ai.ts`
  - `memento-web/src/components/modal/memory/create/create-memory-assistant-panel.tsx`
  - host chat “turn this into a memory” action later

- [ ] Minimum ship criteria
  - rewrite result comes back as structured patch data
  - user can preview and explicitly apply draft changes
  - no direct publish/write beyond draft update

#### Memory digging agent

- [ ] **Build this third**
  - Why:
    - this is where Memento becomes meaningfully different from generic AI writing help

- [ ] Backend tasks to create
  - `story.identify_missing_details`
  - `chat.deep_dive_followup`
  - `story.connect_related_memory`

- [ ] Backend tools to add
  - `api/src/services/ai/tools/load-memory-timeline.ts`
  - `api/src/services/ai/tools/load-user-context.ts`
  - `api/src/services/ai/tools/load-enrichment-gaps.ts`

- [ ] Frontend surfaces to wire first
  - story composer Assistant tab deep-digging chips
  - host chat follow-up recommendations
  - onboarding follow-up prompts later

- [ ] Minimum ship criteria
  - missing-details guidance is task-backed, not canned
  - follow-up questions are specific to the current draft or conversation
  - suggested memory links are advisory only at launch

#### Conversation agent

- [ ] **Build this fourth**
  - Why:
    - it becomes truly useful only after the specialist agents already exist

- [ ] Backend tasks to create
  - `assistant.route_request`
  - `assistant.compose_response`
  - `assistant.select_subagent`

- [ ] Backend tools to add
  - `api/src/services/ai/tools/append-conversation-messages.ts`
  - `api/src/services/ai/tools/load-current-assistant-context.ts`
  - `api/src/services/ai/tools/emit-task-handoff.ts`

- [ ] Frontend surfaces to wire first
  - Assistant tab freeform text entry
  - host chat action routing
  - onboarding orchestration later

- [ ] Minimum ship criteria
  - can decide whether a user request belongs to writing, digging, metadata, or media flows
  - returns one coherent answer to the user
  - does not bypass subagent permissions

#### Media and archive agent

- [ ] **Build this fifth**
  - Why:
    - most complex tool and workflow surface
    - strongest fit for Eve-backed durable runs

- [ ] Backend tasks to create
  - `story.organize_uploads`
  - `archive.enrich_memory`
  - `archive.enrich_batch`

- [ ] Backend tools to add
  - `api/src/services/ai/tools/load-uploaded-files.ts`
  - `api/src/services/ai/tools/classify-uploaded-files.ts`
  - `api/src/services/ai/tools/enqueue-archive-enrichment.ts`
  - `api/src/services/ai/tools/update-story-metadata.ts`

- [ ] Frontend surfaces to wire first
  - story composer upload organization
  - archive enrichment admin/user trigger surfaces

- [ ] Minimum ship criteria
  - upload placement decisions are structured and reviewable
  - archive enrichment jobs are resumable and observable
  - `act` mode is limited to safe file-placement and job-launch behavior

### Recommended next implementation order

- [ ] **Immediate next work after current state**
  1. finish metadata-agent adoption in the web app
  2. wire the conversation agent into host chat and freeform Assistant routing
  3. consume onboarding structured outcomes in host chat handoff and profile shaping
  4. harden media/archive work with real backend tools and durable jobs

- [ ] **Practical reason for this order**
  - the frontend shared AI layer is already in place
  - all 5 subagents now have task ownership in the backend
  - the biggest remaining gap is not task definition, but surface adoption
  - chat and onboarding still risk drifting unless they are moved onto the same contracts next

### Cross-app reuse rule

- [ ] Every new subagent task should be evaluated against at least 3 surfaces:
  - story composer
  - host chat
  - onboarding or archive flows

- [ ] Before creating a new task, ask:
  - can an existing subagent own this?
  - can an existing tool support this?
  - can this contract be reused outside Add Memory?

- [ ] The plan should reject:
  - composer-only agent logic
  - chat-only subagent contracts
  - onboarding-only tooling unless the domain is truly unique

### Shared surface map

- [ ] **Story composer / Add Memory**
  - first proving ground for writing, digging, metadata, and media subagents

- [ ] **Host chat**
  - first proving ground for conversation-agent routing across other subagents

- [ ] **Onboarding**
  - first proving ground for using the same harness with a different tone and pacing, but the same underlying task system

- [ ] **Quick capture / enrichment**
  - future proving ground for metadata + writing reuse

- [ ] **Archive/admin workflows**
  - future proving ground for durable Eve-backed media/archive work

### Shared code layout recommendation

- [ ] **Backend shared subagent layout**
  - `api/src/services/ai/contracts/`
    - task contracts and shared input/output schemas
  - `api/src/services/ai/tools/`
    - framework-neutral business tools used by subagents
  - `api/src/services/ai/subagents/`
    - subagent definitions at the Memento layer
  - `api/src/services/ai/workflows/`
    - task orchestration and routing
  - `api/src/services/ai/runtime/`
    - optional runtime-facing wrappers if the non-Eve and Eve harness paths need a stable abstraction

- [ ] **Recommended backend file map**
  - `api/src/services/ai/subagents/conversation-agent.ts`
  - `api/src/services/ai/subagents/writing-agent.ts`
  - `api/src/services/ai/subagents/memory-digging-agent.ts`
  - `api/src/services/ai/subagents/metadata-agent.ts`
  - `api/src/services/ai/subagents/media-archive-agent.ts`
  - `api/src/services/ai/workflows/task-router.ts`
  - `api/src/services/ai/workflows/eve-adapter.ts`
  - `api/src/services/ai/workflows/run-subagent-task.ts`

- [ ] **Backend tools that should be shared across surfaces**
  - `load-memory-draft.ts`
  - `save-draft-patch.ts`
  - `update-story-metadata.ts`
  - `load-uploaded-files.ts`
  - `classify-uploaded-files.ts`
  - `append-conversation-messages.ts`
  - `load-user-context.ts`
  - `load-memory-timeline.ts`
  - `load-enrichment-gaps.ts`
  - `enqueue-archive-enrichment.ts`

- [ ] **Eve harness layout**
  - `api/agent/index.ts`
    - Eve bootstrap and workflow registration
  - `api/agent/workflows/`
    - Eve-backed durable workflows only
  - `api/agent/tools/`
    - Eve-callable wrappers around the same business tools in `api/src/services/ai/tools/`
  - `api/agent/schemas/`
    - Eve-facing structured schemas when needed

- [ ] **Important harness rule**
  - Business logic should live in shared service-layer tools first.
  - Eve tool files should wrap those shared tools, not duplicate them.
  - This prevents Add Memory, chat, and onboarding from drifting when some flows are Eve-backed and others are not.

- [ ] **Frontend shared consumption layout**
  - `memento-web/src/features/ai/`
    - task definitions
    - hook/state model
    - optional agent UI helpers
  - `memento-web/src/features/ai/tasks/`
    - task definitions grouped by domain when the flat file grows too large
  - `memento-web/src/features/ai/surfaces/`
    - optional shared helpers for story composer, chat, and onboarding integration

- [ ] **Recommended frontend grouping over time**
  - `memento-web/src/features/ai/tasks/story.ts`
  - `memento-web/src/features/ai/tasks/chat.ts`
  - `memento-web/src/features/ai/tasks/onboarding.ts`
  - `memento-web/src/features/ai/tasks/archive.ts`
  - `memento-web/src/features/ai/use-ai-task.ts`
  - `memento-web/src/features/ai/ai-task-state.ts`

- [ ] **Surface adapters in the web app**
  - story composer:
    - `create-memory-ai.ts`
  - host chat:
    - a chat-specific AI adapter under `memento-web/src/features/host-chat/`
  - onboarding:
    - an onboarding-specific AI adapter under `memento-web/src/features/host-onboarding-chat/`

- [ ] **Important frontend rule**
  - surface adapters may gather local context and decide what UI to render
  - they should not implement subagent logic or prompt logic directly

### Shared task ownership rule

- [ ] A task should be owned by one subagent even if many surfaces call it
  - Example:
    - `story.rewrite_draft` belongs to the writing agent
    - story composer can call it
    - host chat can also call it
  - Ownership should not change based on which screen triggered it

- [ ] A tool should be owned at the business layer, not the screen layer
  - Example:
    - `load-memory-draft` is not a composer tool
    - it is a shared memory-reading tool that composer, chat, and onboarding flows may all use

- [ ] Eve should host workflows, not redefine ownership
  - Example:
    - a memory-digging interview may run on Eve
    - but it is still owned conceptually by the memory digging agent

### Shared implementation sequencing rule

- [ ] For each new task, build in this order
  1. contract schema
  2. business tool if missing
  3. subagent ownership and handler
  4. task-router integration
  5. Eve harness integration only if durability is needed
  6. first surface adapter
  7. second surface reuse check

- [ ] This order is important because it forces:
  - shared ownership before UI coupling
  - shared tools before harness-specific wrappers
  - cross-surface reuse before the design calcifies

### What should be built next first

- [ ] **Recommended next concrete slice**
  - make the conversation agent real in shared UI flows

- [ ] Tasks in that slice
  - `assistant.select_subagent`
  - `chat.deep_dive_followup`
  - host-chat-side handoff into:
    - writing tasks
    - memory-digging tasks
    - metadata tasks

- [ ] Why this slice next
  - it is the cleanest way to stop Add Memory, host chat, and onboarding from becoming separate AI stacks
  - it turns the subagent registry into something user-facing and reusable
  - it creates the right seam before deeper Eve-backed archive work

## 8. Concrete Refactor Decisions

### Refactor 1: Split the story composer

- [ ] Reason:
  - `memento-web/src/components/modal/memory/create/index.tsx` is already carrying too much responsibility.

- [ ] Decision:
  - keep modal shell and form orchestration in one file
  - move assistant behavior into separate files
  - move story-quality heuristics into a pure helper

### Refactor 2: Introduce structured task results

- [ ] Reason:
  - current AI helpers mostly return plain text
  - acting cleanly requires patches, classifications, and action lists

- [ ] Decision:
  - every new task returns structured JSON first
  - optional display copy is secondary

### Refactor 3: Stop duplicating prompt logic in UI features

- [ ] Reason:
  - Autotag, autotitle, host chat, onboarding, and assistant panel should not all evolve separately

- [ ] Decision:
  - centralize prompt assembly and tool orchestration in `api/`
  - keep the web app responsible for context gathering and user confirmation

### Refactor 4: Preserve current endpoints during migration

- [ ] Reason:
  - replacing everything at once is unnecessary risk

- [ ] Decision:
  - existing endpoints stay live
  - new task endpoint powers new agentic features first

---

## 9. Risks and Controls

- [ ] **Risk: another AI surface becomes a dead-end**
  - Control: require all new assistants to use the shared AI task layer

- [ ] **Risk: agent actions overreach**
  - Control: explicit `suggest` / `assist` / `act` mode boundaries

- [ ] **Risk: prompt sprawl**
  - Control: keep prompts versioned in backend workflow files and registry

- [ ] **Risk: UX inconsistency**
  - Control: one shared task state model for loading, result preview, apply, and undo

- [ ] **Risk: hard coupling to one provider or one framework**
  - Control: keep workflows provider-agnostic and Eve-optional

- [ ] **Risk: frontend contract churn when durable runs arrive**
  - Control: carry session/run/workflow metadata in Phase 1 task responses even before Eve is fully active

- [ ] **Risk: too many agents too early**
  - Control: keep one visible Assistant and add only the 5 core subagents above

- [ ] **Risk: subagents overlap and create unclear ownership**
  - Control: each subagent must own one narrow class of tasks and tool permissions

### Permission model for subagents

- [ ] **Every subagent needs an explicit permission envelope**
  - Permissions should not be implicit from the UI surface
  - Permissions should not be inherited just because another subagent can do the same action

- [ ] **Suggested permission classes**
  - `read_draft`
  - `read_uploads`
  - `read_user_context`
  - `read_memory_history`
  - `prepare_draft_patch`
  - `prepare_metadata_patch`
  - `apply_metadata_patch`
  - `apply_upload_placement`
  - `enqueue_enrichment_job`
  - `append_conversation_context`

- [ ] **Launch-time permission mapping**
  - conversation agent:
    - `read_draft`
    - `read_user_context`
    - `append_conversation_context`
  - writing agent:
    - `read_draft`
    - `read_uploads`
    - `prepare_draft_patch`
  - memory digging agent:
    - `read_draft`
    - `read_user_context`
    - `read_memory_history`
  - metadata agent:
    - `read_draft`
    - `prepare_metadata_patch`
    - later `apply_metadata_patch`
  - media and archive agent:
    - `read_uploads`
    - `apply_upload_placement`
    - `enqueue_enrichment_job`

- [ ] **Permission rule for Eve-backed runs**
  - Eve may execute the run
  - but Memento must still decide which tools and side effects are available to that run
  - Eve should never be treated as permission authority by itself

### Run tracing and observability

- [ ] **Every subagent run should be traceable across surfaces**
  - A composer-triggered run and a chat-triggered run should be observable in the same way
  - Surface-specific UI should not create incompatible telemetry shapes

- [ ] **Minimum run metadata**
  - `task`
  - `subagent`
  - `surface`
  - `mode`
  - `status`
  - `session_id`
  - `run_id`
  - `workflow_id`
  - `tool_calls`
  - `duration_ms`
  - `provider`
  - `model`

- [ ] **Suggested `surface` values**
  - `story_composer`
  - `host_chat`
  - `onboarding_chat`
  - `quick_capture`
  - `archive_admin`

- [ ] **Suggested event trail for each run**
  - `run_requested`
  - `subagent_selected`
  - `tools_loaded`
  - `tool_called`
  - `result_prepared`
  - `result_applied` or `result_rejected`
  - `run_completed`
  - `run_failed`

- [ ] **Observability rule**
  - One subagent task should emit the same core run metadata whether it is:
    - one-shot
    - task-router handled
    - Eve-backed durable

### Cross-surface behavior standards

- [ ] **The same subagent should feel consistent across surfaces**
  - The wording, latency, and UI chrome may differ by screen
  - The underlying behavior and ownership should not

- [ ] **Story composer standard**
  - best for preview/apply workflows
  - subagents should often return structured patches

- [ ] **Host chat standard**
  - best for conversational discovery and handoff
  - subagents should often return suggested actions or next-step prompts

- [ ] **Onboarding standard**
  - best for lightweight, progressive extraction
  - subagents should often return structured summaries and inferred dimensions

- [ ] **Archive/admin standard**
  - best for durable, auditable execution
  - subagents should often return job metadata and progress state

### Decision checklist before adding any new subagent task

- [ ] Does this task belong to an existing subagent?
- [ ] Can the result shape be reused by at least one other surface?
- [ ] Does it need `suggest`, `assist`, or `act`?
- [ ] Does it need durable execution, or is one-shot enough?
- [ ] Which tools does it need?
- [ ] Which permissions does it need?
- [ ] What telemetry should it emit?
- [ ] What is the second surface that should eventually consume it?

---

## 10. Recommended First Milestone

- [x] Deliver this slice first:
  - shared AI task endpoint in `api/`
  - shared `useAiTask` hook in `memento-web`
  - story composer Assistant tab upgraded from placeholder to real assist mode
  - upload organization + title/tag generation unified under one system

### Why this first milestone

- [x] It solves the most visible current product gap.
- [x] It prevents the new composer assistant from becoming another disconnected AI experiment.
- [x] It creates the clean seam needed for host chat, onboarding, and future Eve adoption.

---

## 11. Implementation Recommendation

- [ ] Build this in a framework-neutral way first.
- [ ] Use the existing `api/` AI routing and telemetry foundation, but add Eve at the backend runtime layer where durable workflows need it.
- [ ] Add a workflow layer before adding more AI UI.
- [ ] Do not wait until the very end to prepare for Eve:
  - make Phase 0 and Phase 1 Eve-compatible now
  - activate Eve first on the workflows that actually benefit from durability and tool orchestration

- [ ] The target operating model should be:
  - one visible Assistant for the user
  - 5 specialized subagents behind it
  - Eve used selectively for the subagents that truly need durable, resumable, multi-step execution

This is the cleanest route because it improves the current app immediately, reduces future refactor cost, and keeps the product free to adopt a stronger agent runtime later without rewriting the frontend again.
