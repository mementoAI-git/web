# Handoff: `/onboard/misc` onboarding (May 2026)

Use this document to resume work in another IDE or machine. It summarizes **what shipped**, **where the code lives**, **API/backend expectations**, and **what is still open** after the onboarding summary and first-host-message pass.

---

## Product intent (unchanged)

- **Hook (Q1–Q5):** motivation, age, life situation / work, “home” narrative, personality traits (capped).
- **Branch (after Q5):** “Continue later” (partial / skip deep) vs “Keep going…” (deep phase).
- **Deep (Q6–Q10 in product copy):** memory treasures, passions, chronotype, sharing intent, focus-first enrichment categories (capped).
- **Closing:** adaptive primary CTA from Q1 motivation, with `getStep5Body` supporting partial personalization copy when user skipped deep steps.

---

## Implementation model (important)

The **internal step machine** uses **`OnboardQuestionsStep` = 1…12** in `useOnboardQuestionsState.ts`:

| Step | Meaning |
|------|--------|
| 1–5 | Hook questions (product Q1–Q5) |
| 6 | Branch screen (not a counted “question dot” the same way) |
| 7–11 | Deep questions (product Q6–Q10) |
| 12 | Closing / “You’re all set” |

**Progress UI:** `TOTAL_QUESTION_DOTS = 10` in `misc/index.tsx`; `progressDots()` maps internal `step` to 10 dots (branch at dot index 5; step 12 fills all dots).

If you extend the flow, update **`ONBOARD_QUESTIONS_STEP_LABELS`**, **`canAdvance`**, **`prevStep`** (already jumps 7→6), **`progressDots`**, and **`completeAndNavigate`** `stepReached` logic (`skipped ? 6 : 12`).

---

## Primary files

| Path | Role |
|------|------|
| `src/pages/onboard/misc/index.tsx` | Page UI, chip grids, `completeAndNavigate`, progress dots, shadcn `Button` / `Input` / `Textarea` / `Label` |
| `src/pages/onboard/misc/useOnboardQuestionsState.ts` | State, caps, `canAdvance`, `goToDeepPhase`, `prevStep` / `nextStep` |
| `src/pages/onboard/misc/useOnboardQuestionsState.test.ts` | Unit tests (subset of flow; expand if you add edge cases) |
| `src/pages/onboard/summary.tsx` | Post-onboarding summary screen with live enrichment score, territory map, and host-chat handoff |
| `src/pages/onboard/summary-helpers.ts` | Summary snapshot storage, touched-category derivation, post-onboarding destinations, personalized host starter builder |
| `src/pages/onboard/misc/OnboardQuestionHeader.tsx` | Title + hint + “Why?” (`DropdownMenu`, `CircleHelp`) |
| `src/pages/onboard/misc/onboard-misc-copy.ts` | `ONBOARD_MISC_WHY` hints + long copy per step (excludes 6 and 12) |
| `src/pages/onboard/misc/OnboardSelectionCard.tsx` | Chip button; V3 semantic borders/backgrounds; `active:scale-[0.98]` |
| `src/features/onboarding-groot/types.ts` | Chips keys, labels, caps constants, `ONBOARDING_FOCUS_FIRST_OPTIONS`, etc. |
| `src/features/onboarding-groot/adaptive.ts` | `getPrimaryCTA(motivation, modes)` — **empty `modes`** = misc-only CTA; non-empty = legacy Groot matrix |
| `src/api/onboarding.ts` | `SaveOnboardingApiBody` / onboarding-details mapping for misc payloads and revisit hydration |
| `src/components/modal/settings/stats.tsx` | “Update my story” entry point into `/onboard/misc?mode=revisit` |

**Legacy Groot** (`/onboarding`, Identity flow) still uses expression modes and **non-empty** `modes` for `getPrimaryCTA`. Tests were updated so capsule navigation is not asserted via removed motivation copy; see `OnboardingGrootPage.test.tsx`.

---

## Completion and payloads

- **`completeAndNavigate(action, { skippedDeep?: boolean })`** posts **`completeOnboarding`** twice (existing pattern): first object matches extended onboarding shape; second carries `join_reasons`, `self_description`, `current_priority` string.
- **“Continue later”** calls `completeAndNavigate("dashboard", { skippedDeep: true })` so the POST does not rely on a batched `setState` before submit.
- **`skippedDeep`:** omits `chronotype` / `sharingIntent` from payload where applicable; sets `stepReached: 6` vs `12`; sets `skippedDeepPersonalization` on body.
- **`motivationForApi`:** `something_else` → `"explorer"` for `MotivationType` / CTA unless you add a dedicated API enum later.
- After completion, onboarding now saves a **summary snapshot** into session storage and routes to **`/onboard/summary`** instead of jumping straight to overview/capsule/explore.
- The summary screen reads **live enrichment data from `GET /users/stats`**, shows the current score, renders a **10-category touched vs unexplored map**, and offers:
  - a next-step CTA (`Go to dashboard`, `Browse prompts`, etc.), and
  - a **`Talk with Memento`** CTA that opens host chat with a personalized `?starter=` draft based on the user’s onboarding answers.
- Revisit mode is now real: **`/onboard/misc?mode=revisit`** fetches onboarding details, hydrates misc answers, and lets the user continue from a populated state instead of a blank flow.

---

## Design / tokens

- Prefer **V3 semantic classes** (`border-v3-stroke-weak`, `bg-v3-fill-weaker`, etc.) on selection UI — see `OnboardSelectionCard.tsx` and project command `memento-web/.cursor/commands/check-variables.md`.
- Motion: light **ease-out** / short durations; press feedback on chips — aligned with Emil-style guidance used in this pass.

---

## Tests

- Targeted onboarding tests and the web build were green after the summary/bootstrap pass.
- Touch onboarding when changing: `OnboardSelectionCard.test.tsx`, `useOnboardQuestionsState.test.ts`, `adaptive.test.ts`, `types.test.ts`, `OnboardingGrootPage.test.tsx`, `settings/index.test.tsx` (nav test decoupled from removed “My stats” UI).
- Also touch: `summary.test.tsx`, `summary-helpers.test.ts`, `stats.test.tsx`, `onboarding.test.ts`.

---

## Backend / contract follow-ups

1. **Q8 chronotype → notifications:** chronotype is captured and round-tripped, but still only as a signal. No notification timing or preference behavior should be invented in web until backend support exists.
2. **Onboarding completion state:** the app currently leans on `onboarding_status = "completed"` but there is still cleanup to do around legacy `onboarded` / typo-era behavior on the backend.
3. **Host chat seeding depth:** current host handoff uses the existing `?starter=` composer bootstrap. If product later wants a deeper server-seeded first exchange, align that with `docs/MEMENTO_HOST_ONBOARDING_CHAT.md`.

---

## Still to build (see updated plan)

1. **Chronotype follow-up note** — keep Q8 as captured signal only until notification/preferences backend support exists.
2. **Auth-before-signup spike** — anonymous partial onboarding vs current auth gate.
3. **Onboarding completion-state cleanup** — make backend completion state unambiguous around `onboarding_status`.
4. **Copy / QA pass** on `ONBOARD_MISC_WHY` vs final product voice; add rows if new questions appear.

---

## Quick local verify

1. Run web app (e.g. Vite on port **5173**).
2. Visit **`/onboard/misc`** with a user that has nickname set (otherwise redirect to `/onboard/nickname`).
3. Walk hook → branch → deep → closing; try **Continue later** and full path; confirm navigation matches `getPrimaryCTA` for each motivation chip.
4. Confirm completion lands on **`/onboard/summary`**, shows a live enrichment score, and renders touched vs untouched categories.
5. Click **`Talk with Memento`** and confirm host chat opens with a personalized draft already in place.

---

## Related plan file

Cursor plan (living checklist):  
`/Users/admin/.cursor/plans/updated_onboarding_may_13th_a006f257.plan.md`
