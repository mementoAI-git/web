# TODO CODEX

May 2026 onboarding push. This is the working Codex checklist for the current phase of Memento. The goal is to finish the onboarding loop around `/onboard/misc`, not rebuild the misc flow itself.

## Status Markers

- `TODO` - not started
- `IN PROGRESS` - actively being worked
- `DONE` - implemented and verified well enough for this phase
- `BLOCKED` - cannot proceed without an external decision or dependency

## Where We Stopped

- `DONE` `/onboard/misc` is already implemented around an internal `1..12` step machine, with 10 progress dots, branch at step `6`, and closing at step `12`.
- `DONE` The current misc onboarding core already lives in `src/pages/onboard/misc/*`, `src/api/onboarding.ts`, `src/features/onboarding-groot/types.ts`, and `src/features/onboarding-groot/adaptive.ts`.
- `DONE` Completion behavior already supports `skippedDeepPersonalization`, `stepReached`, and adaptive CTA behavior.
- `DONE` The handoff state says tests were green at that point, so the main risk is not the misc flow shell itself. The remaining work is backend contract confidence, revisit/prefill parity, and the post-completion experience.

## Onboarding Todos

- `DONE` Backend contract verification for onboarding payloads
  Confirm `completeOnboarding` and related onboarding endpoints accept and persist `life_situation`, `personality_traits`, `memory_treasures`, `chronotype`, `sharing_intent`, `motivation_detail`, and `skippedDeepPersonalization` without silently dropping fields.

- `DONE` Prefill / revisit mapping
  Extend onboarding-details typing and `mapOnboardingDetailsToState` so “Update my story” can restore the newer misc answers, not just legacy passions and current-priority values.

- `DONE` Post-onboarding enrichment summary
  Add the completion experience that reads live enrichment data from `GET /users/stats` and shows the real score, with no fake or hardcoded bump.

- `DONE` 10-category territory map
  Add a touched-vs-unexplored onboarding summary using the existing `EnrichmentCategory` taxonomy so the user sees what onboarding already covered and what is still open terrain.

- `TODO` Chronotype follow-up note
  Keep Q8 as captured signal only until notification/preferences backend support exists. Do not invent scheduling behavior in the web app yet.

- `DONE` First host message bootstrap
  Connect onboarding completion to a personalized first host-chat turn so the user lands in a warm opener rather than an empty conversation surface.

- `LATER` Auth funnel spike
  Investigate anonymous-before-signup onboarding as a product/architecture spike only. Do not treat it as part of the immediate implementation path.

## Cross-Cutting Cleanup Todos

- `DONE` Update stale enrichment docs in `api/docs/enrichment-score-guide.md` so they reflect current code and `/users/stats` behavior.

- `TODO` Fix onboarding completion consistency around `onboarding_status` versus fallback `onboarded` / typo-based behavior so completion state is represented one clear way.

- `TODO` Revisit `beneficiary_access_unlocked` so “unlock forever” becomes persisted behavior instead of a pure computed threshold from the current score.

## Acceptance Checks

- `DONE` misc onboarding payload persists without silent field loss
- `DONE` revisit mode restores the new misc answers
- `DONE` completion screen reads real enrichment stats
- `DONE` category map reflects onboarding coverage accurately
- `DONE` first post-onboarding host entry feels personalized
- `DONE` docs match actual implementation

## Verification Notes

- Verify against `memento-web/docs/ONBOARDING_MISC_HANDOFF.md`.
- Verify against `/Users/admin/.cursor/plans/updated_onboarding_may_13th_a006f257.plan.md`.
- Verify against the current dirty workspace changes in `src/pages/onboard/misc`, `src/api/onboarding.ts`, `src/features/onboarding-groot/*`, and related tests.
- Treat this file as a synthesis of those sources, not a copy of either one.
