# AI Incident Checklist

Use this during production AI incidents to restore stability quickly.

## 0) Confirm user impact first

- Is chat failing with 500s?
- Is p95 latency spiking?
- Is this all users or a subset?

If user impact is high, switch to stability-first routing immediately.

## 1) Check provider health from logs

Look for these patterns:

- OpenRouter: `402`, `429`
- Groq: `413`, `429`
- Gemini: `429 RESOURCE_EXHAUSTED`

Confirm which provider is failing first and which fallback is still healthy.

Also check internal observability endpoints (dev/local):

- `/ai/metrics/overview?hours=24` for SLO breaches/alerts
- `/ai/metrics/timeseries?hours=24&interval_minutes=60` for trend diagnosis
- `/ai/prompt-governance/status` for prompt registry validity

## 2) Apply quick env toggles (no code deploy)

Critical chat stability toggles in `api/.env`:

- `OPENROUTER_CRITICAL_ENABLED=false`  
  Disable OpenRouter in critical chat chain while credits/rate limits are unresolved.

- `GROQ_MODEL_CHAT_PRIMARY=llama-3.1-8b-instant`  
  Prefer faster model for lower latency.

- `GROQ_MODEL_CHAT_FALLBACK=llama-3.3-70b-versatile`  
  Keep stronger fallback for quality.

- `GROQ_FAST_MODE_ENABLED=true`  
  Enable fast-mode routing for short prompts.

Restart backend after env changes.

## 3) Validate after change (2-minute smoke test)

Run:

1. Send one short chat message
2. Send one long chat message
3. Send onboarding chat turn

Expected:

- Requests complete without 500
- Logs show intended provider order
- Fallback occurs gracefully when provider is degraded

## 4) If all providers degrade

- Keep safe degraded response path enabled (do not remove).
- Reduce retries and keep cooldown/circuit behavior active.
- Communicate temporary capacity issue in status/update channels.

## 5) Recovery and follow-up

- Re-enable disabled providers gradually.
- Observe fallback rate and p95 for 30-60 minutes.
- Document incident:
  - root cause
  - mitigation used
  - final stable config
  - permanent fixes needed
