# Memento Eve sandbox implementation plan

> Execute inline with the global executing-plans skill. This experiment must not ship or merge with Memento without explicit user permission.

**Goal:** Give the founder and team an isolated, testable Eve chat with web research, source attribution, sample memories, and optional authenticated personal memory retrieval.

**Architecture:** Fork the MIT TanStack template into its own repository and sandbox branch. Retain its model, chat components, generated UI, cancellation, and streaming. Add server-side read-only adapters to the existing Memento API without changing either Memento repository. Store per-browser credentials encrypted in the sandbox's private local data directory; record session ownership to prevent cross-tester transcript access. The team can run copies locally; no hosted deployment is authorized.

**Tech stack:** Node 24, pnpm 10, Eve 0.76.3, TanStack Start, React, Zod, Node's built-in test runner.

## Task 1: Isolate and configure

- [x] Clone upstream into `eve-chat-sandbox/`, create `sandbox/memento-eve-evaluation`, and rename the remote to `template-upstream`.
- [x] Add `scripts/setup.mjs` to create ignored `.env.local` with a random sandbox password and absolute private data directory. It must preserve an existing environment file.
- [x] Replace deploy scripts with a guard that exits nonzero and explains that explicit approval is required. Document that no Memento release command references this repository.
- [x] Add a local `dev` script using the documented `eveTanStack({ eveRoot })` integration so no Vercel account/link is needed for local testing.

## Task 2: Test the read-only data and authorization boundaries first

Files: `test/memories.test.ts`, `test/private-store.test.ts`, `test/session-access.test.ts`, `agent/lib/memories.ts`, `agent/lib/private-store.ts`, `agent/lib/session-access.ts`.

- [x] Run `node --experimental-strip-types --test test/*.test.ts` and observe missing functionality.
- [x] Test sample search and explicit sample provenance, no matching results, bounded excerpts, safe source links, and rejection of draft/deleted or malformed API records.
- [x] Test account-scoped encrypted credential persistence, wrong-password rejection, disconnect, and session owner denial for a different visitor.
- [x] Test that API requests use the stored authenticated bearer, never a model-supplied user ID, reject API redirects, report auth/provider errors, and make only GET requests for memories.
- [x] Implement typed sample-memory and Memento API adapters using `GET /api/memories?search=...&limit=5` and `GET /api/memories/:id` with bounded output.
- [x] Implement encrypted credential files under `.sandbox-data/` with AES-256-GCM and a password-derived key. Use hashed principal filenames, private permissions, and no credentials in tool results or model context.
- [x] Re-run tests until passing.

## Task 3: Wire the agent

Files: `agent/tools/search_memories.ts`, `agent/tools/get_memory.ts`, `agent/tools/web_search.ts`, `agent/hooks/session-owner.ts`, `agent/channels/eve.ts`, `agent/instructions.md`, `agent/agent.ts`.

- [x] Disable optional default tools and explicitly retain native web search plus custom read-only memory tools, question forms, and generated UI.
- [x] Scope memory tools to `ctx.session.auth.current.principalId`.
- [x] Record ownership before returning the session-create response, with `session.started` as a consistency check; reject every existing-session request whose visitor does not own it, including streams and controls.
- [x] Require the sandbox password even locally; remove synthetic shared local authentication.
- [x] Explain sample versus personal results, citations, unavailable search, private query handling, and source data versus instructions in the agent instructions.

## Task 4: Tester interface

Files: `apps/web/app/sandbox.ts`, `apps/web/app/_components/sandbox-panel.tsx`, `agent-chat.tsx`, `agent-message.tsx`, `globals.css`, `routes/__root.tsx`, `routes/login.tsx`.

- [x] Add clearly visible experimental identity, sample/personal memory state, credential configuration status, and example prompts.
- [x] Add authenticated account linking through Memento email/password login, including its optional 2FA step. Encrypt access tokens on the server and never return them to the browser.
- [x] Rotate the browser principal and start a new chat on connection/disconnection so prior account context cannot leak into another mode.
- [x] Render memory tool results as titled source references and bounded excerpts; retain generic tool activity and web sources.
- [x] Retain streaming and stop; add retry of the last submitted prompt after a failure. Preserve composer text on failure.
- [x] Apply only the relevant thinking-state transition with reduced-motion handling. Reuse the template's UI controls.

## Task 5: Verify and hand off

- [x] Run `pnpm test`, `pnpm validate`, `pnpm build:web`, `pnpm build:agent`, and `pnpm exec eve info --json`. Inspect actual tool discovery and channel configuration.
- [x] Inspect the built app through T3 preview with desktop/mobile layouts, password access, sample state, account form, keyboard use, provider errors, and retry/cancel when available.
- [x] Complete a live AI turn only if a credential is supplied; clearly report missing credentials instead of substituting fake answers.
- [x] Write team setup, evaluation prompts, expected source behavior, feedback logging, limitations, and explicit non-shipping instructions in `README.md` and `docs/TEAM_TESTING.md`.
- [x] Confirm no files changed in `memento-web/` or `api/`, no deploy ran, no PR opened, and no production environment changed.

## Verification limits

No AI Gateway credential exists in the active project environments. Live generation and web-search quality remain unverified; a missing-credential turn was tested and correctly reported failure while restoring the draft. Personal account retrieval was tested through typed API fixtures, not by signing in as a real user. No hosted deployment, push, PR, merge, or Memento release change occurred.
