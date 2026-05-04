# OpenRouter Migration Handoff Context

Use this file to continue the OpenRouter migration discussion from the exact current state.

## Session Snapshot

- Workspace: `memento-web` (frontend repo)
- Active branch: `voicemode`
- Topic: OpenRouter model strategy across frontend + backend
- Current decision: two-phase rollout
  - Phase 1: migrate text/non-realtime flows to OpenRouter
  - Phase 2: defer voice migration until capability parity is validated

## Key Decisions Already Made

1. **Environment model defaults**
  - `dev/staging`: `google/gemma-4-26b-a4b-it:free`
  - `production` critical conversational UX: `google/gemma-4-26b-a4b-it` (paid)
  - `production` non-critical tasks: free primary + paid fallback
2. **Voice migration**
  - Do not migrate voice off Google in Phase 1.
  - Revisit in Phase 2 only after realtime quality/latency/reliability checks pass.
3. **Prompt governance requirement**
  - Prompt changes must be versioned and reviewed like code because they directly change product behavior.

## Documents Created/Updated

1. `docs/OPENROUTER_MODEL_ROLLOUT.md` (created, then updated)
  - includes routing table, implementation steps, fallback strategy, switch playbook
  - now explicitly includes:
    - Prompt Governance section
    - Voice deferred to Phase 2

## Frontend AI Surface Map (already identified)

- Main chat stream: `src/pages/dashboard/chat/conversation/index.tsx` (`/ai/prompt`)
- Sidebar chat stream: `src/pages/dashboard/component/dashboard-chat-sidebar.tsx` (`/ai/prompt`)
- Onboarding stream client: `src/api/host-onboarding-chat.ts` (`/users/onboarding/chat/prompt`)
- Tags generation trigger: `src/components/Buttons/AutogenerateTagsButton.tsx` (`/ai/generate-tags`)
- Transcription usage: `src/components/player/transcription.tsx` (`/ai/transcribe-audio`)
- Voice realtime hook (Google SDK): `src/hooks/use-live-api/index.ts`
- Voice preview (Google SDK): `src/lib/gemini-voice-preview.ts`
- Endpoint registry: `src/api/endpoint.ts`

## Recommended Backend Work (to implement in backend repo)

1. Add provider router (`AiProviderRouter`) with task-based aliases.
2. Centralize env-driven model routing:
  - `OPENROUTER_API_KEY`
  - `OR_MODEL_CHAT_PRIMARY`, `OR_MODEL_CHAT_FALLBACK`
  - `OR_MODEL_TAGS_PRIMARY`, `OR_MODEL_TAGS_FALLBACK`
  - `OR_MODEL_TRANSCRIPTION_PRIMARY`, `OR_MODEL_TRANSCRIPTION_FALLBACK`
  - voice aliases reserved for Phase 2
3. Keep endpoint contracts stable:
  - `/ai/prompt`
  - `/ai/conversation/new`
  - `/ai/generate-tags`
  - `/ai/transcribe-audio`
  - `/users/onboarding/chat/prompt`
4. Add fallback/retry/timeout policy.
5. Add schema validation for structured outputs.
6. Add telemetry:
  - task, effective model, latency, token usage, fallback count
7. Add rollout controls:
  - feature flags + budget guardrails.

## Open Questions To Resolve In Backend Repo

1. Current backend stack/framework details and file locations for AI calls.
2. Existing provider abstraction (if any) and how model selection is currently done.
3. Exact streaming transport details for `/ai/prompt` and onboarding stream.
4. Whether transcription currently uses LLM, dedicated ASR, or provider-specific endpoint.
5. Existing observability and feature-flag infrastructure.

## Immediate Next Step Once Backend Repo Is Open

1. Locate where `/ai/prompt`, `/ai/conversation/new`, `/ai/generate-tags`, `/ai/transcribe-audio`, and onboarding chat are implemented.
2. Design a concrete `AiProviderRouter` in that codebase.
3. Produce a backend-specific migration PR plan (file-by-file) and start implementation for Phase 1.

## Status Update (Implemented)

The backend implementation has now started in `api/`:

- Added `api/src/services/ai/model-routing.ts` for task-based model aliases.
- Added `api/src/services/ai/openrouter.ts` for OpenRouter calls with primary/fallback model behavior.
- Added `api/src/services/ai/groq.ts` for Groq streaming/non-streaming fallback behavior.
- Updated `api/src/module/api/ai/service.ts` to route text chat/bootstrap/tags through OpenRouter when configured.
- Kept Gemini fallback path for file attachments, transcription, and live voice token endpoints.
- Updated `api/.env.example` and `api/src/utils/config.ts` with OpenRouter env keys.
- Gemini now prefers `GEMINI_API_KEY_ALT` everywhere Gemini is used (chat fallback, transcription, and voice ephemeral token).
- Added prompt version logging for chat, onboarding, tags, and transcription requests.
- Added strict schema validation for onboarding trailer metadata and tags output parsing.
- Added per-user short backoff window for repeated provider `429/402` storms on chat paths.
- Added persistent AI telemetry model + writer (`ai_metric`) to persist route/provider/model/latency metadata.
- Added token-usage persistence for non-stream text calls when providers return usage fields.
- Added prompt-version registry with env-based overrides for rollback without redeploy.
- Added explicit `ASR_PROVIDER` config (Phase 1 default remains `gemini`).
- Added internal observability API endpoint: `GET /ai/metrics/overview?hours=24` (auth required).
- Added internal observability API endpoint: `GET /ai/metrics/timeseries?hours=24&interval_minutes=60` (auth required).
- Added prompt-governance health endpoint: `GET /ai/prompt-governance/status` (auth + dev-only).
- Added SLO thresholds in config (`AI_SLO_*`) and overview alert evaluation from persisted metrics.
- Added AI Health page sections for SLO targets, active alerts, and prompt governance status.

Still pending:

- Tune onboarding chat prompt copy further to product voice and completion heuristics (explicitly deferred by product).
- Implement non-Gemini ASR provider path if/when Phase 2 migration is approved.

Latest reliability update:

- Critical chat/onboarding text flows no longer rely on free models by default.
- Added multi-provider fallback chain for critical text:
  - Groq -> Gemini -> OpenRouter (last resort) -> safe degraded message.
- Added Groq bounded context strategy to reduce payload-size failures while preserving recent context.

## Current Provider Reality (Apr 2026)

- Critical chat runtime order is currently Groq-first.
- Gemini is second in chain and now uses `GEMINI_API_KEY_ALT` by default.
- OpenRouter is last text fallback and may return `402` when credits are unavailable.
- Voice remains Google-native in Phase 1.

## Source References

- Paid model: [https://openrouter.ai/google/gemma-4-26b-a4b-it/api](https://openrouter.ai/google/gemma-4-26b-a4b-it/api)
- Free model: [https://openrouter.ai/google/gemma-4-26b-a4b-it:free](https://openrouter.ai/google/gemma-4-26b-a4b-it:free)