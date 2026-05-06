# OpenRouter Model Rollout Guide

This document defines how to use OpenRouter models across the app (backend + frontend), with environment-based defaults, production fallback strategy, and a clean model-switch process.

## Goals

- Use OpenRouter as the model gateway instead of a single-provider hard dependency.
- Default `dev/staging` to free model for cost control.
- Default production conversational UX to paid model for quality consistency.
- Use free model in production for selected non-critical tasks.
- Keep frontend API contracts stable while backend owns model routing.
- Ship in two phases: text/non-realtime first, voice migration only after capability parity is proven.

## Model Policy By Environment

- `dev`: `google/gemma-4-26b-a4b-it:free`
- `staging`: `google/gemma-4-26b-a4b-it:free`
- `production` (critical UX): `google/gemma-4-26b-a4b-it`
- `production` (non-critical tasks): `google/gemma-4-26b-a4b-it:free` with paid fallback

## Model Routing Table

| App area | Endpoint / flow | Criticality | Primary model | Fallback model | Notes |
|---|---|---|---|---|---|
| Main host chat | `/ai/prompt` | High | `google/gemma-4-26b-a4b-it` | Paid fallback alias | Keep tone/quality stable |
| Sidebar quick chat | `/ai/prompt` | High | `google/gemma-4-26b-a4b-it` | Paid fallback alias | Same contract as main chat |
| Onboarding host chat text | `/users/onboarding/chat/prompt` | High | `google/gemma-4-26b-a4b-it` | Paid fallback alias | First-impression sensitive |
| Start conversation bootstrap | `/ai/conversation/new` | High | `google/gemma-4-26b-a4b-it` | Paid fallback alias | Avoid inconsistent opening quality |
| Auto-generate tags | `/ai/generate-tags` | Medium/Low | `google/gemma-4-26b-a4b-it:free` | `google/gemma-4-26b-a4b-it` | Best first production free candidate |
| Audio transcription | `/ai/transcribe-audio` | Medium | `google/gemma-4-26b-a4b-it:free` (optional) | `google/gemma-4-26b-a4b-it` | Enable only with QoS monitoring |
| Voice realtime + voice preview | Current frontend live voice flows | High | Keep current Google flow (Phase 1) | N/A in Phase 1 | Re-evaluate in Phase 2 after capability validation |

## Current Frontend Touchpoints

- Main chat send/stream: `src/pages/dashboard/chat/conversation/index.tsx`
- Sidebar chat send/stream: `src/pages/dashboard/component/dashboard-chat-sidebar.tsx`
- Onboarding chat stream client: `src/api/host-onboarding-chat.ts`
- Tag generation trigger: `src/components/Buttons/AutogenerateTagsButton.tsx`
- Transcription usage: `src/components/player/transcription.tsx`
- Voice live session hook: `src/hooks/use-live-api/index.ts`
- Voice preview implementation: `src/lib/gemini-voice-preview.ts`
- API endpoint map: `src/api/endpoint.ts`

## Backend Implementation Steps (Clean Architecture)

1. Create an `AiProviderRouter` (task-based routing):
   - task keys: `chat_primary`, `chat_bootstrap`, `onboarding_chat`, `tags_generate`, `transcription`, `voice_realtime`, `voice_preview`.
2. Add model alias config in one file (`model-routing.ts`):
   - `OPENROUTER_API_KEY`
   - `OR_MODEL_CHAT_PRIMARY`
   - `OR_MODEL_CHAT_FALLBACK`
   - `OR_MODEL_TAGS_PRIMARY`
   - `OR_MODEL_TAGS_FALLBACK`
   - `OR_MODEL_TRANSCRIPTION_PRIMARY`
   - `OR_MODEL_TRANSCRIPTION_FALLBACK`
   - `OR_MODEL_VOICE_PRIMARY`
   - `OR_MODEL_VOICE_FALLBACK`
3. Keep existing API contracts stable:
   - `/ai/prompt`, `/ai/conversation/new`, `/ai/generate-tags`, `/ai/transcribe-audio`, `/users/onboarding/chat/prompt`.
4. Add reliability controls:
   - per-task timeout
   - retry policy
   - fallback cascade
   - safe terminal error payload
5. Add output validation:
   - schema checks for tags, onboarding metadata, structured fields.
6. Add observability:
   - log model alias, effective model, task, latency, token usage, fallback count.
7. Add cost guardrails:
   - optional budget threshold to shift low-priority tasks to free model automatically.

## Frontend Implementation Steps

1. Keep frontend provider-agnostic:
   - no model/provider decision logic in frontend request code.
2. Update provider-specific copy:
   - neutralize wording that hardcodes Google where behavior becomes routed/provider-agnostic.
3. Prepare voice abstraction:
   - migrate from direct provider SDK coupling to backend-mediated voice session contracts.
4. Update tests/mocks:
   - add fallback/degraded path tests and update API mocks for routing/fallback metadata where exposed.

## Prompt Governance (Why It Matters)

Prompt governance is important because prompts directly control app behavior: tone, safety, structure, and output quality. In this app, a prompt edit can change user experience as much as a code change.

Without governance, prompt edits become untracked behavior changes that are difficult to debug and roll back.

Minimum policy:

1. Store prompts in versioned source files (not ad hoc runtime edits).
2. Assign each prompt a stable id + version (example: `host_chat_system:v3`).
3. Require PR review for prompt changes.
4. Log prompt version + model alias per request.
5. Maintain rollback aliases so prior prompt version can be restored quickly.
6. Use a golden test set to compare behavior before promoting prompt updates.

## Step-By-Step: How To Switch Models Later

1. Update model alias values in backend `model-routing.ts` (or env layer).
2. Set env values for target environment (`dev`, `staging`, `production`).
3. Run smoke tests for:
   - host chat
   - onboarding stream
   - tags
   - transcription
   - voice
4. Deploy behind feature flag (example: `AI_ROUTING_VERSION=v2`).
5. Observe for 24-48 hours:
   - fallback rate
   - p95 latency
   - structured parse failures
   - user-visible quality regressions
6. Promote gradually to 100%; rollback by alias if metrics degrade.

## Fallback Strategy

- Critical text chat (prod): paid primary -> paid fallback alias.
- Non-critical tasks (prod): free primary -> paid fallback alias.
- Voice (Phase 1): stay on existing Google flow.
- Voice (Phase 2): voice-capable primary route -> paid voice-capable fallback alias.
- Final guard: return controlled error instead of malformed output.

## Rollout Order

### Phase 1 (now)

1. Tags (`/ai/generate-tags`)
2. Transcription + onboarding metadata
3. Main host chat + sidebar chat
4. Keep voice on current Google implementation

### Phase 2 (later, only if criteria pass)

1. Evaluate OpenRouter voice-capable options for realtime audio quality, latency, interruption handling, and voice variety
2. Build backend-mediated voice session abstraction
3. Run side-by-side quality and latency tests against current voice mode
4. Migrate voice only when acceptance criteria are met

## Consistency Risks and Mitigations

- Risk: output tone/format drift between paid and free routes.
- Mitigations:
  - task-specific prompt versioning
  - lower temperature for structured tasks
  - schema validation before returning response
  - golden prompt set to compare model drift before rollout

## What You Might Be Leaving Out

- **Prompt/version governance:** define who owns prompt changes and version release flow.
- **Data/privacy policy:** confirm OpenRouter/provider data-retention mode and legal approval.
- **Rate limits and burst handling:** add explicit queue/backoff policy per endpoint.
- **Idempotency for retries:** prevent duplicate writes/actions on retries and fallback retries.
- **SLOs by task:** define target latency/error budgets before rollout.
- **Incident playbook:** document when to force paid-only or disable free routing quickly.
- **Voice capability validation:** keep voice on Google until OpenRouter (or alternative providers) pass parity checks for realtime quality and reliability.

## References

- [OpenRouter Gemma 4 26B A4B (paid)](https://openrouter.ai/google/gemma-4-26b-a4b-it/api)
- [OpenRouter Gemma 4 26B A4B (free)](https://openrouter.ai/google/gemma-4-26b-a4b-it:free)

## Implementation Status (Apr 2026)

Backend progress completed in `api/`:

- Added centralized task routing in `api/src/services/ai/model-routing.ts`.
- Added OpenRouter client with timeout + fallback logic in `api/src/services/ai/openrouter.ts`.
- Added a short OpenRouter circuit breaker for repeated `429/402` responses so chat fails fast and avoids long hangs when upstream capacity is constrained.
- Wired AI service routes to use OpenRouter when configured:
  - `/ai/prompt` (text-only path)
  - `/ai/conversation/new` (text-only path)
  - `/ai/generate-tags`
  - conversation title generation helper
- Preserved Gemini paths as safe fallback for:
  - requests with attachments/files
  - audio transcription
  - voice ephemeral token flow
- Added env variables in `api/.env.example` and config exports in `api/src/utils/config.ts`.
- Added prompt version registry + env overrides for prompt rollback (`PROMPT_VERSION_*`).
- Added persistent AI telemetry documents (`ai_metric`) and route-level metric writer.
- Added token usage capture for non-stream text responses where providers expose usage.
- Added explicit ASR provider setting (`ASR_PROVIDER`) with current default `gemini`.
- Added SLO configuration keys (`AI_SLO_ERROR_RATE_MAX`, `AI_SLO_FALLBACK_RATE_MAX`, `AI_SLO_P95_LATENCY_MS_MAX`) and SLO breach evaluation in metrics overview.
- Added prompt governance status endpoint (`/ai/prompt-governance/status`) and surfaced status in internal AI Health dashboard.

Current limitation:

- Onboarding chat route now exists, but currently uses a lightweight onboarding prompt and static trailer heuristics; this can be tuned further with product-specific prompt governance.
- Transcription remains Gemini-backed in Phase 1 (non-Gemini ASR not implemented yet).

## Phase 1 Finalization Snapshot

Completed:

- Provider routing/fallback chain is implemented and documented (`Groq -> Gemini -> OpenRouter` for critical text).
- Circuit breaker + per-user backoff are active for degraded provider scenarios.
- Structured output validation is active for tags and onboarding trailer metadata.
- Prompt version registry + runtime overrides are live.
- Persistent observability (`ai_metric`) is live with overview/timeseries endpoints.
- Internal AI Health dashboard is live in local/dev with SLOs and alert visibility.

Remaining (intentional):

- Onboarding prompt refinement (deferred by product for later iteration).
- ASR provider migration beyond Gemini (Phase 2).

## Keys / Config Needed To Turn It On

Minimum required now:

1. `OPENROUTER_API_KEY`
2. `GEMINI_API_KEY_ALT` (preferred Gemini key for all Gemini runtime paths, including voice + transcription)

Recommended model aliases (already defaulted, but you can override per env):

- `OR_MODEL_CHAT_PRIMARY`
- `OR_MODEL_CHAT_FALLBACK`
- `OR_MODEL_TAGS_PRIMARY`
- `OR_MODEL_TAGS_FALLBACK`

Optional metadata headers:

- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`

Gemini key precedence:

- Runtime now uses `GEMINI_API_KEY_ALT` first.
- Falls back to `GEMINI_API_KEY` only if `GEMINI_API_KEY_ALT` is not set.

## Recommended Chat Model Defaults

To avoid free-tier throttling on core chat (critical features):

- `OR_MODEL_CHAT_PRIMARY=google/gemma-4-26b-a4b-it`
- `OR_MODEL_CHAT_FALLBACK=google/gemma-4-26b-a4b-it`

For lower-priority tasks (tags), keep free-first:

- `OR_MODEL_TAGS_PRIMARY=google/gemma-4-26b-a4b-it:free`
- `OR_MODEL_TAGS_FALLBACK=google/gemma-4-26b-a4b-it`

## Multi-Provider Fallback Chain (Critical Text Flows)

Critical text paths now follow this order:

1. Groq (`GROQ_MODEL_CHAT_PRIMARY` -> `GROQ_MODEL_CHAT_FALLBACK`) when `GROQ_API_KEY` is configured
2. Gemini (using `GEMINI_API_KEY_ALT` first, fallback to `GEMINI_API_KEY`)
3. OpenRouter (`OR_MODEL_CHAT_PRIMARY` -> `OR_MODEL_CHAT_FALLBACK`) when `OPENROUTER_API_KEY` is configured
4. Safe user-facing degraded message if all providers are unavailable

## Groq Conservative Context Strategy

To reduce `413` payload errors while preserving important continuity:

- OpenRouter behavior remains unchanged.
- Groq path uses a bounded context builder:
  - keep the most recent turns verbatim
  - compress older turns into a short summary block
  - cap oversized system prompt text only on Groq path
- This applies to critical chat and onboarding Groq fallback paths only.

## Operations Runbook (Provider Incidents)

Use this checklist when chat quality/latency degrades in production:

### 1) OpenRouter returns `402 Payment Required`

- Confirm org credits and billing status in OpenRouter dashboard.
- Temporarily reduce OpenRouter impact by relying on Groq-first chain (current default).
- Keep `OR_MODEL_CHAT_PRIMARY` and `OR_MODEL_CHAT_FALLBACK` set to paid models when OpenRouter is enabled.

### 2) OpenRouter returns repeated `429`

- Confirm OpenRouter cooldown behavior is active (circuit breaker in backend).
- Keep traffic on Groq + Gemini while OpenRouter recovers.
- Review model-specific rate limits and swap to alternate paid OpenRouter model alias if needed.

### 3) Groq returns `413 Payload Too Large`

- Ensure Groq bounded-context path is active.
- Reduce prompt/history size budgets if needed:
  - lower recent-turn count
  - tighten compressed-summary size
  - tighten Groq system prompt cap

### 4) Gemini returns `429 Resource Exhausted`

- Treat Gemini as last resort for critical text.
- Verify Gemini quota/billing for fallback-only usage.
- Keep degraded-safe message path enabled to avoid hard user-facing failure.

### 5) End-user impact controls

- If two providers are degraded, keep chat available with safe degraded copy rather than 500s.
- Monitor p95 latency + fallback frequency before changing routing order.
- Roll back by env toggles first; avoid hot code changes during active incident.

See also: `docs/AI_INCIDENT_CHECKLIST.md` for a fast on-call workflow.
