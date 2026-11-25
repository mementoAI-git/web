# Eve chat sandbox — proposed design

Status: approved by the owner on 2026-10-14 for a separate local team-testing sandbox. Shipping and integration require explicit separate permission.

## Purpose

Evaluate whether Eve can improve Memento chat by choosing tools, retrieving a user's memories, researching the web, and combining those sources into useful responses. Keep the first experiment separate from the existing chat experience.

## Approaches

1. **Separate TanStack Start sandbox (recommended):** start from the linked Eve template in `eve-chat-sandbox/`. This tests the actual framework integration and keeps experiments separate from the active Memento repositories. It adds a separate development server and requires an authenticated bridge to Memento.
2. **Sandbox page inside Memento:** reuse its UI and login, adapting Eve's React client and server runtime. This makes memory access easier but tests a custom integration before establishing that the template works for our needs.
3. **Replace existing chat immediately:** premature for this experiment; requires handling existing persistence, voice, attachments, billing, and chat settings together.

## First experiment

- A local chat interface with streamed replies, new conversation, cancellation, and visible failures with retry.
- Visible tool activity and source references for web results and stored memories.
- Web research using a supported Eve search provider; explicitly report unavailable configuration or provider failures.
- Read-only memory search through Memento's authenticated API. Resolve the account on the server from the authenticated session; never accept an agent-supplied user ID as authorization.
- Memory retrieval returns structured, bounded results with IDs, titles, excerpts, and dates, subject to existing access and entitlement rules. Opening a memory uses the same authorization checks.
- A clearly labeled sample-memory mode allows initial testing without a Memento login. Sample data cannot be presented as the user's real memories. Real-user mode must use actual authentication, not preview identity fixtures.
- Model and search credentials stay on the server. Choose the deployable model/provider after inspecting the template's pinned dependencies and configuration; expose missing setup clearly.
- Keep sandbox transcripts separate from Memento conversations. No automatic saving, editing, or deleting of memories in this first experiment.
- Keep public web queries free of private memory excerpts unless the user explicitly requests sharing that information with a search provider. Treat retrieved web pages and memories as source data, not instructions.

## Existing Memento integration points

Memento's frontend is React 19, Vite, and React Router; its API uses Express and TypeScript. The template should remain a separate app rather than introducing TanStack routing into the existing frontend.

`api/src/services/supermemory/index.ts` provides user-scoped long-term context. `api/src/module/api/ai/voice/memory-search.ts` also searches stored memories. Reuse the underlying retrieval patterns behind an authenticated sandbox contract rather than importing backend code into browser components. Existing text chat injects retrieved context before generation; the experiment evaluates agent-directed retrieval during a turn.

Existing repository changes are extensive. Implementation must preserve them and keep sandbox changes identifiable.

## Evaluation

1. Ask a question answered by a sample or personal memory; verify correct source attribution.
2. Ask a current web question; verify working search and clickable supporting sources.
3. Ask a question requiring both sources; verify the answer distinguishes remembered facts from web information.
4. Ask about a missing memory; verify no invented personal facts.
5. Exercise provider failure, missing credentials, cancellation, and retry.
6. Verify that an authenticated account cannot retrieve another account's memories.
7. Check keyboard use, mobile layout, focus behavior, and reduced motion.

Record response latency and provider usage alongside answer quality before deciding on integration. Verify build, relevant unit/API tests, and browser interactions. Passing the experiment leads to a separate plan for adapting Eve's agent runtime into Memento's existing chat, preserving its product behavior.

## Research and outstanding verification

- User-selected template: https://eve.dev/templates/eve-tanstack-start-template
- Eve public API: https://github.com/vercel/eve/blob/main/docs/reference/typescript-api.md
- The public API documents `defineTool`, `useEveAgent`, memory providers, and provider-managed web search.
- The MIT upstream template was inspected and forked locally. It requires Node 24, uses Eve 0.76.3, and uses AI Gateway for its preserved model. Memento authentication and read-only memory retrieval were added through its existing API without modifying either Memento repository.
