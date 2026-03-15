# Host Onboarding (Groot) — Implementation Plan

Step-by-step implementation plan for the [Host Onboarding PRD](../memento-onboarding-prd.md). Each step must be completed (including unit + component tests) before moving to the next. Backend-only work is called out and skipped.

---

## Backend Dependencies (Skipped — Document Only)

The following require backend implementation and are **not** in this repo:

| Item | Description | Backend Action Required |
|------|-------------|-------------------------|
| `POST /api/host/onboarding` | Save onboarding data on completion | Implement endpoint; return `{ success, enrichmentScoreSeed }` |
| `PATCH /api/host/onboarding/progress` | Save step progress on each advance | Implement endpoint for server-side progress |
| `GET /api/host/profile` | Fetch host record for revisit mode | May map to existing `/users/profile` with extended fields |
| User model fields | `onboarding_complete`, `onboarding_step_reached`, `onboarding_skipped` | Add to user schema; return in profile response |
| Enrichment Score seed | Compute weights from `priorityDimensions` | Backend logic: selected→1.2, unselected→0.8, baseline→1.0 |

**Frontend approach:** Implement API client functions that call these endpoints. Use MSW to mock responses in tests. Document contract for backend team.

---

## Step 1: Types, Constants, and Adaptive Logic

**Goal:** Establish the data model and pure functions. No UI yet.

**Tasks:**
1. Create `src/features/onboarding-groot/types.ts`:
   - `OnboardingState`, `DimensionKey`, `ExpressionMode`, `HostArchetype`, `MotivationType`
   - `ARCHETYPE_OPTIONS`, `MOTIVATION_OPTIONS`, `DIMENSION_OPTIONS`, `EXPRESSION_OPTIONS`
2. Create `src/features/onboarding-groot/adaptive.ts`:
   - `getStep4Headline(motivation)`
   - `getStep5Body(motivation)`
   - `getPrimaryCTA(motivation, modes): CTAConfig`
3. Create `src/utility/constant.ts` addition: `ONBOARDING_STORAGE_KEY = "memento_onboarding_state"`

**Tests:**
- `adaptive.test.ts`: Unit tests for `getStep4Headline`, `getStep5Body`, `getPrimaryCTA` (all branches)
- `types.test.ts`: Optional — validate option arrays have expected shape

**Definition of done:** All adaptive functions tested; types exported.

---

## Step 2: SelectionCard Component

**Goal:** Reusable card used in Steps 1–4.

**Tasks:**
1. Create `src/features/onboarding-groot/components/SelectionCard.tsx`:
   - Props: `value`, `label`, `sublabel?`, `icon`, `isSelected`, `onClick`, `disabled?`
   - States: default, hover, selected (checkmark badge), disabled, focus
   - Min height 48px; transitions 150ms
   - Design tokens per PRD (§7, §14)
2. Add onboarding design tokens to `src/index.css` (or use Tailwind arbitrary values)

**Tests:**
- `SelectionCard.test.tsx`: Renders label/sublabel/icon; click calls onClick with value; selected shows checkmark; disabled prevents click; keyboard (Enter/Space) activates

**Definition of done:** Component renders correctly; all states and interactions tested.

---

## Step 3: OnboardingShell Component

**Goal:** Layout wrapper for all 5 steps.

**Tasks:**
1. Create `src/features/onboarding-groot/components/OnboardingShell.tsx`:
   - Props: `currentStep`, `totalSteps`, `stepLabel`, `canAdvance`, `onAdvance`, `onBack`, `onSkip`, `advanceLabel?`, `showBack?`
   - Topbar: Logo (link to home), "Skip for now →" (hidden when `showSkip === false`)
   - Step dots: filled / outlined / empty per PRD
   - Step label below dots
   - Content area: max-w-[560px] centred
   - Footer: Back (when showBack), Continue/advanceLabel
2. Use existing logo/link patterns from codebase

**Tests:**
- `OnboardingShell.test.tsx`: Renders step dots and label; Back hidden when showBack false; Skip hidden when on step 5; Continue disabled when canAdvance false; onAdvance/onBack/onSkip called on click

**Definition of done:** Shell renders; nav behaviour tested.

---

## Step 4: Step Content Components

**Goal:** Implement each step's content.

**Tasks:**
1. **Step 1** — `OnboardingStep1.tsx`:
   - Name input (required, 1–40 chars, placeholder)
   - Archetype selector (SelectionCard, single-select)
   - Conditional "other" textarea (when archetype === 'other', 280 chars)
   - Validation messages on advance attempt
2. **Step 2** — `OnboardingStep2.tsx`:
   - Motivation selector (SelectionCard, single-select, stacked)
3. **Step 4** — `OnboardingStep4.tsx`:
   - Adaptive headline via `getStep4Headline`
   - Expression mode selector (SelectionCard, multi-select, max 2)
   - Tooltip when 3rd selected: "Pick your top two."
4. **Step 3** — `OnboardingStep3.tsx`:
   - Dimension selector (SelectionCard, multi-select, min 1)
   - Validation message on advance
5. **Step 5** — `OnboardingStep5.tsx`:
   - Headline: "You're all set, {displayName}. Let's begin."
   - Adaptive body via `getStep5Body`
   - Primary CTA via `getPrimaryCTA` (button label + action)
   - Secondary link: "Or take me to the dashboard — I'll explore on my own →"
   - No Back, no Skip

**Tests (per step):**
- Step 1: Renders; validation blocks advance; valid input allows advance; "other" shows textarea
- Step 2: Renders; selection required
- Step 3: Renders; min 1 required; validation message
- Step 4: Renders; max 2; adaptive headline; tooltip on 3rd select
- Step 5: Renders; adaptive body/CTA; secondary link present

**Definition of done:** All 5 steps implemented and tested.

---

## Step 5: useOnboardingState Hook

**Goal:** State + localStorage persistence.

**Tasks:**
1. Create `src/features/onboarding-groot/useOnboardingState.ts`:
   - State: `OnboardingState`
   - `advanceStep()`, `goBack()`, `updateField()`, `complete()`, `skip()`
   - Persist to `memento_onboarding_state` on every change
   - Restore from localStorage on init
   - `canAdvance(step)`: validation per step
   - `validationErrors(step)`: messages for Step 1–4
2. Handle revisit mode: accept initial state from props (e.g. from API)

**Tests:**
- `useOnboardingState.test.ts`: Initial state; advance/goBack updates currentStep; localStorage written on advance; restore from localStorage; canAdvance per step; validationErrors

**Definition of done:** Hook manages state and persistence; tests pass.

---

## Step 6: Step Transitions

**Goal:** Animate step changes.

**Tasks:**
1. Add CSS or motion classes:
   - Outgoing: opacity 0, translateY -12px, 180ms ease-in
   - Incoming: opacity 1, translateY 0, 220ms ease-out, 160ms delay
2. Wrap step content in transition wrapper; use step key to trigger

**Tests:**
- Optional: Visual/snapshot or ensure no regression in step navigation

**Definition of done:** Transitions work; no layout shift.

---

## Step 7: Onboarding Page and Routing

**Goal:** Wire everything together.

**Tasks:**
1. Create `src/pages/onboarding-groot/index.tsx` (or `src/features/onboarding-groot/pages/OnboardingPage.tsx`):
   - Use `useOnboardingState`
   - Render `OnboardingShell` with current step content
   - Handle `?mode=revisit` — fetch profile (mock until backend); pre-populate
   - On complete: call `POST /api/host/onboarding` (mock); clear localStorage; navigate to `/overview` or CTA action
   - On skip: set `onboarding_skipped` in localStorage; navigate to `/overview`
2. Add route `/onboarding` to router (sibling to `/onboard`, inside auth)
3. Create layout for onboarding (similar to OnboardLayout — centred, no sidebar)

**Tests:**
- `OnboardingPage.test.tsx`: Renders step 1; advancing moves to step 2; back from step 2 to 1; skip navigates; complete navigates; revisit mode pre-populates (with mock)

**Definition of done:** Full flow works; route added.

---

## Step 8: API Client (Frontend Only)

**Goal:** Define endpoints and mutation helpers. Backend not implemented.

**Tasks:**
1. Add to `src/api/endpoint.ts`:
   - `hostOnboarding: "/api/host/onboarding"` (or `/users/onboarding` if backend uses that)
   - `hostOnboardingProgress: "/api/host/onboarding/progress"`
   - `hostProfile: "/api/host/profile"` (or reuse `profile` if same)
2. Create `src/api/onboarding.ts` (or add to existing):
   - `saveOnboarding(data)`
   - `saveOnboardingProgress(partial)`
   - `fetchHostProfile()` for revisit
3. Add MSW handlers in `src/test/mocks/handlers.ts` for tests

**Tests:**
- API module: Mock handlers; verify correct URL and body shape in tests

**Definition of done:** Client ready; tests use mocks.

---

## Step 9: Redirect Logic

**Goal:** New host → `/onboarding`.

**Backend dependency:** User profile must include `onboarding_complete` (and optionally `onboarding_step_reached`, `onboarding_skipped`). If not present, skip or use localStorage fallback.

**Tasks:**
1. Extend `IUser` in `utility/interface.ts`: `onboarding_complete?: boolean`, `onboarding_skipped?: boolean`, `onboarding_step_reached?: number`
2. In AuthCheck or a new `OnboardingGuard`:
   - After profile load: if `onboarding_complete === false` and not on `/onboarding`, redirect to `/onboarding`
   - If `onboarding_skipped` and user navigates to dashboard, show nudge (Step 10)
3. **Fallback:** If backend doesn't return these fields yet, use localStorage: `memento_onboarding_complete` — set on completion, clear on skip. Document that backend should eventually own this.

**Tests:**
- Redirect when onboarding_complete false
- No redirect when on /onboarding
- No redirect when onboarding_complete true

**Definition of done:** Redirect works with mock/mock user; documented fallback.

---

## Step 10: Dashboard Nudge Banner

**Goal:** Banner when onboarding incomplete.

**Tasks:**
1. Create `OnboardingNudgeBanner.tsx`:
   - Copy: "Finish setting up your Memento — it only takes a few minutes."
   - CTA: "Continue setup →" → navigate to `/onboarding`
   - Dismiss: set `onboarding_skipped` in localStorage; hide for session
   - Style: amber-pale bg, 4px amber left border, rounded-xl
2. Add to DashboardLayout: render banner at top of main content when `onboarding_complete === false` and not on `/onboarding` and not dismissed
3. Use user from store; if fields missing, use localStorage fallback

**Tests:**
- Renders when incomplete; CTA navigates; dismiss hides banner

**Definition of done:** Banner shows and behaves correctly.

---

## Step 11: CTA Actions

**Goal:** Wire Step 5 primary CTA to real actions.

**Tasks:**
1. Map `getPrimaryCTA` actions:
   - `voice_recorder` → open `audio-recorder` modal
   - `reflection_prompt` → navigate to `/explore` or open prompt modal
   - `file_upload` → open `create-memory` or `file-upload` modal
   - `time_capsule` → navigate to `/capsule` or open create capsule modal
   - `dashboard` → navigate to `/overview`
2. Secondary link always → `/overview`

**Tests:**
- Each action triggers correct navigation/modal

**Definition of done:** All CTAs work.

---

## Step 12: Settings "Revisit preferences"

**Goal:** Link from Settings to `/onboarding?mode=revisit`.

**Backend dependency:** `GET /api/host/profile` (or `/users/profile` with onboarding fields) for pre-population.

**Tasks:**
1. Add "Revisit preferences" link in Settings (e.g. General tab or new section)
2. Link: navigate to `/onboarding?mode=revisit`
3. Onboarding page in revisit mode: fetch profile, pre-populate, no skip link, Step 5 button "Save changes →"

**Tests:**
- Link navigates with correct query
- Revisit mode pre-populates (with mock)

**Definition of done:** Link added; revisit flow works with mock.

---

## Step 13: Accessibility

**Goal:** Meet PRD §12.

**Tasks:**
1. SelectionCard: `tabIndex`, `role`, `aria-pressed` or `aria-selected`
2. OnboardingShell: focus trap (e.g. `focus-trap-react` or manual)
3. Forward/Back: keyboard activation
4. Ensure no auto-advance

**Tests:**
- Tab order; Enter/Space on cards; focus trap

**Definition of done:** Accessibility requirements met.

---

## Execution Order Summary

| Step | Description | Depends On |
|------|-------------|------------|
| 1 | Types, constants, adaptive logic | — |
| 2 | SelectionCard | 1 |
| 3 | OnboardingShell | 1 |
| 4 | Step content (1–5) | 1, 2 |
| 5 | useOnboardingState | 1 |
| 6 | Step transitions | 4 |
| 7 | Onboarding page + routing | 3, 4, 5, 6 |
| 8 | API client | — |
| 9 | Redirect logic | 7, 8 |
| 10 | Dashboard nudge | 9 |
| 11 | CTA actions | 7 |
| 12 | Settings revisit link | 7, 8 |
| 13 | Accessibility | 2, 3, 4 |

---

## Final Summary

**Achieved:**
- [x] Types, constants, adaptive logic
- [x] SelectionCard component
- [x] OnboardingShell component
- [x] All 5 step components
- [x] useOnboardingState hook
- [x] Step transitions
- [x] Onboarding page and route
- [x] API client (with MSW mocks)
- [x] Redirect logic (with fallback)
- [x] Dashboard nudge banner
- [x] CTA actions
- [x] Settings revisit link
- [x] Accessibility

**Left out (backend):**
- POST /api/host/onboarding
- PATCH /api/host/onboarding/progress
- GET /api/host/profile (with onboarding fields)
- User model: onboarding_complete, onboarding_step_reached, onboarding_skipped
- Enrichment Score seed computation

**Notes:**
- Frontend uses localStorage for progress and skip state until backend is ready.
- Revisit mode requires backend to return onboarding data in profile for pre-population.
- CTA actions for voice_recorder and file_upload navigate to /overview with state.openModal="create-memory"; DashboardLayout opens the modal on mount.
- Accessibility: SelectionCard has aria-pressed, tabIndex, Enter/Space; OnboardingShell has focus trap (Tab cycles within shell), role="main", aria-label.
