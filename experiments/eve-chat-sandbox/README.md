# Memento chat lab

Private team experiment based on the MIT [Eve TanStack Start template](https://github.com/vercel-labs/eve-tanstack-start-template). Test chat that can research the web, retrieve memories, and explain where its answers came from.

This directory is a self-contained experiment inside Memento’s web repository. It has its own app, dependencies, lockfile, and checks. The product app does not import or build it. Integration, hosted deployment, or merging this experiment requires the owner’s explicit permission. The `deploy` command deliberately stops without deploying.

## Run locally

Use Node.js 24 and pnpm 10. From the repository root:

```sh
cd experiments/eve-chat-sandbox
corepack pnpm install --frozen-lockfile
corepack pnpm run setup
```

`setup` creates a private `.env.local` without overwriting an existing file. Open it to copy `EVE_ACCESS_PASSWORD`, the password testers enter before opening chat. Add `DEEPSEEK_API_KEY` for live chat. The sandbox calls DeepSeek directly using `deepseek-flash`, including memory and interface tool calls. Add your key locally, never in chat. No credentials are included or automatically inherited from the product app. No Vercel AI Gateway credential is needed.

Web research uses a separate OpenRouter request with its Exa search plugin. Set `OPENROUTER_API_KEY` and optionally `OPENROUTER_SEARCH_MODEL` (default `google/gemma-4-26b-a4b-it`). Only the public query goes to this search service, without chat history or memory excerpts. Search requests and their model response may incur OpenRouter charges. Each tester supplies the appropriate credentials in this directory’s ignored `.env.local`.

Chat uses non-thinking mode for faster conversational replies. Hiding reasoning in the interface is separate from this model setting. The agent’s core identity and conversation policy are copied from Memento’s `api/src/utils/ai-prompt/index.ts`, with sandbox tool rules added. The model receives the current browser’s connection state on each turn. For personal questions, `get_personal_context` reads selected profile facts, communication preferences, and at most five recent memory excerpts. It does not send contact details, authentication settings, or tokens to the model. Specific questions use account-scoped memory search. Persona notes, full session context, and semantic Supermemory retrieval are not imported in this first adapter.

Chat has no automatic provider fallback in this evaluation, so testers can assess DeepSeek accurately. Memento’s Groq, Gemini, and OpenRouter fallback routing remains in the existing app. Failed search returns an explicit unavailable result; it does not silently switch providers.

```sh
corepack pnpm dev
```

Open [localhost:5180](http://localhost:5180) and enter the sandbox password. The local app and Eve run together without linking or deploying a Vercel project. **Memory sources & test setup** includes a sample-memory browser that works without an AI credential. Those memories belong to a fictional Alex.

## Connect personal memories

Set `MEMENTO_API_URL` to your existing API address ending in `/api`. HTTPS is required except for localhost. Set `MEMENTO_WEB_URL` to your Memento web origin to enable **Open in Memento** source links. Restart after editing the environment.

Open **Memory sources & test setup** and sign in with your own Memento email and password. Accounts with two-factor authentication also enter their six-digit code. The sandbox verifies the account against Memento and encrypts its access token on the server. The browser and model never receive that access token. Connecting or disconnecting starts a new private conversation.

Memory access uses existing authenticated GET endpoints. It does not change memories, store sandbox chats in Memento, or create a second Supermemory collection. This first experiment uses Memento's existing text search, rather than semantic Supermemory retrieval. Personal excerpts used in answers are sent to the configured model provider; use test accounts and suitable memories for team evaluation.

## Team testing

Share the source-only team-test archive or give each tester a copy of this folder. Each tester installs dependencies, runs `setup`, and adds the appropriate server credential locally. The archive excludes passwords, account tokens, generated conversations, and dependencies.

For a trusted team on the same local network, the owner can run `corepack pnpm dev:team` and share `http://<computer-local-address>:5180` plus the sandbox password privately. This development server is for a trusted local network. For personal account sign-in over a network, use a local HTTPS arrangement or have testers run their own copy; the browser should not send account passwords over a plain HTTP LAN connection. No internet tunnel or hosted preview has been created.

Use [the team testing guide](docs/TEAM_TESTING.md) for prompts, expected behavior, and a feedback worksheet. Existing conversations stay private to the browser that created them. The sandbox does not have conversation sharing.

## Checks

```sh
corepack pnpm test
corepack pnpm validate
corepack pnpm build:agent
corepack pnpm build:web
```

For a local preview of the built app, run these in two terminals after building:

```sh
PORT=5181 HOST=127.0.0.1 node --env-file=.env.local .output/server/index.mjs
```

```sh
corepack pnpm preview:web
```

The preview proxies the agent and workflow callback routes to localhost:5181. Build output remains local. Registry dependencies produce bundler warnings about `use client` directives; the build succeeds.

## Files

| Area | Location |
| --- | --- |
| Agent behavior and tool limits | `agent/instructions.md`, `agent/agent.ts` |
| Read-only memory and web tools | `agent/tools/` |
| Memory transport and fictional samples | `agent/lib/memories.ts`, `agent/lib/sample-memories.ts` |
| Account encryption and conversation ownership | `agent/lib/private-store.ts`, `agent/lib/session-access.ts` |
| Tester controls and chat | `apps/web/app/_components/` |
| Ignored runtime data | `.sandbox-data/`, `.eve/`, `.output/`, `apps/web/.output/` |

Eve is in preview. Evaluate reliability, response quality, provider usage, and failure handling before planning integration. The upstream customization notes are preserved in `CUSTOMIZATION.md` as reference, but their deployment instructions are outside this experiment's authorization.
