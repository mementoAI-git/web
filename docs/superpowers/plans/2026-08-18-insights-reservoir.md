# Insights Reservoir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current heuristic narrative-card experience with a member-owned insight reservoir plus distinct, actionable reflection prompts.

**Architecture:** The API promotes approved extractions into durable `InsightObservation` records and exposes a backward-compatible observation read/mutate contract. The web consumes that contract in focused reservoir components, renders all member-facing observations in second person, and keeps `Explore next` as a separate prompt surface backed by the existing stats nudge/jump-pill data.

**Tech Stack:** Express, TypeScript, Mongoose, Zod, BullMQ worker, React 19, SWR, React Router, Tailwind, Vitest, MSW.

---

## Repository and branch prerequisites

`memento-web` is already on the `insights` branch. The API is a separate Git repository with unrelated uncommitted work; do not add this feature to that dirty tree. Before Task 1, create a clean API branch (for example `insights-api`) from the agreed API base branch and deliver it as its own dependency PR. The web PR must not claim the API behavior is live until that API PR is deployed.

## Planned file structure

### API repository (`../api`)

- Create: `src/module/database/model/insight-observation.ts` — durable approved observations and source metadata.
- Modify: `src/module/database/model/pending-insight.ts` — optional category captured at extraction time.
- Modify: `src/utils/ai-prompt/index.ts` — second-person extraction schema and canonical category instruction.
- Modify: `src/workers/insight/persona.ts` — pass the member’s preferred name into extraction.
- Modify: `src/workers/insight/story.ts` — pass the member’s preferred name into extraction.
- Modify: `src/workers/insight/index.ts` — store structured extraction results in pending insights.
- Modify: `src/module/api/persona/service.ts` — promote approval into an observation and read/edit/delete observations.
- Modify: `src/module/api/persona/controller.ts`, `dto.ts`, `routes.ts` — validated observation endpoints.
- Modify: `src/docs/persona.docs.ts` — document the new contract.

### Web repository (`memento-web`)

- Create: `src/features/insights/observation-types.ts` — API-facing observation and source types.
- Create: `src/features/insights/observation-voice.ts` and `.test.ts` — pure, tested legacy wording normalization.
- Create: `src/features/insights/insight-reservoir.tsx` and `.test.tsx` — grouped remembered-observation UI, review/edit/remove lifecycle.
- Create: `src/features/insights/explore-next.tsx` and `.test.tsx` — up to two optional, dismissible prompts and Host Chat handoff.
- Modify: `src/api/endpoint.ts` — observation endpoint templates.
- Modify: `src/components/modal/memory-insights/index.tsx` and `.test.tsx` — replace narrative cards with the two approved sections.
- Modify: `src/components/modal/settings/stats.tsx` and `.test.tsx` — link Settings to the complete reservoir rather than duplicating old narrative cards.
- Modify: `src/test/mocks/handlers.ts` — safe default observation API handlers.

### Task 1: Define and persist a durable approved observation in the API

**Files:**
- Create: `../api/src/module/database/model/insight-observation.ts`
- Modify: `../api/src/module/database/model/pending-insight.ts`
- Modify: `../api/src/workers/insight/index.ts`
- Modify: `../api/src/module/api/persona/service.ts`
- Modify: `../api/src/module/api/persona/routes.ts`
- Modify: `../api/src/module/api/persona/dto.ts`
- Modify: `../api/src/module/api/persona/controller.ts`

- [ ] **Step 1: Write an API-level approval regression test or isolated service test before implementation.**

  Add a test harness using the repository’s selected runner or a temporary `node:test` unit test that stubs `PendingInsight`, `Persona`, `InsightObservation`, and `addApprovedMemory`. Assert that approving a pending record with one source writes this exact observation payload before deleting the pending row:

  ```ts
  {
    user: 'user-1',
    field: 'key_preferences',
    content: 'You prefer quiet Sundays.',
    category: 'everyday_life',
    sources: [{ memory: 'memory-1', source: 'conversation' }],
  }
  ```

- [ ] **Step 2: Run the API test and verify it fails because `InsightObservation` is unavailable.**

  Run the chosen test command, or if the repository has no runner yet, run `npx ts-node --transpile-only` against the isolated test file. Expected result: failure naming the missing model/import; do not continue if the test passes before the model exists.

- [ ] **Step 3: Add the model and pending category.**

  Create a Mongoose model with this shape and indexes:

  ```ts
  export interface IInsightObservation {
    user: string;
    field: PendingInsightField;
    content: string;
    category?: EnrichmentCategory;
    sources: Array<{ memory: string; source: PendingInsightSource }>;
    created_at: Date;
    updated_at: Date;
  }

  insightObservationSchema.index({ user: 1, created_at: -1 });
  insightObservationSchema.index({ user: 1, category: 1, created_at: -1 });
  ```

  Add optional `category?: EnrichmentCategory` to `IPendingInsight` and its schema. In `approvePendingInsight`, create the observation from the pending row only after the Persona `$addToSet` succeeds, retain the existing Supermemory synchronization, then delete the pending row.

- [ ] **Step 4: Run the API test and TypeScript compile.**

  Run: `npm run compile` from `../api`.

  Expected: the approval test passes and TypeScript reports no errors.

- [ ] **Step 5: Commit the API persistence change on the clean API branch.**

  ```bash
  git add src/module/database/model/insight-observation.ts src/module/database/model/pending-insight.ts src/workers/insight/index.ts src/module/api/persona
  git commit -m "Persist approved insight observations"
  ```

### Task 2: Generate second-person, categorised pending observations

**Files:**
- Modify: `../api/src/utils/ai-prompt/index.ts`
- Modify: `../api/src/workers/insight/persona.ts`
- Modify: `../api/src/workers/insight/story.ts`
- Modify: `../api/src/workers/insight/index.ts`

- [ ] **Step 1: Write a failing unit test for extraction-result normalization.**

  Extract a pure `normalizeExtractedInsights` helper from the worker and assert both the new and existing response forms normalize correctly:

  ```ts
  normalizeExtractedInsights({
    key_preferences: [{ content: 'You prefer quiet Sundays.', category: 'everyday_life' }],
  }).key_preferences[0]
  // => { content: 'You prefer quiet Sundays.', category: 'everyday_life' }

  normalizeExtractedInsights({ key_preferences: ['The user prefers quiet Sundays.'] })
    .key_preferences[0]
  // => { content: 'The user prefers quiet Sundays.', category: undefined }
  ```

- [ ] **Step 2: Run the normalizer test and verify the missing helper is the failure.**

  Run the API test command selected in Task 1. Expected: failure due to missing `normalizeExtractedInsights`, not an environment or database error.

- [ ] **Step 3: Update extraction prompts and worker inputs.**

  Change `buildInsightsPrompt` to accept `{ existingContext, preferredName }`; use `preferredName = user.nickname?.trim() || user.first_name?.trim() || ''`. Require this JSON form for each of the four existing insight fields:

  ```json
  {
    "key_preferences": [
      { "content": "You prefer quiet Sundays.", "category": "everyday_life" }
    ]
  }
  ```

  The prompt must require second person, prohibit “the user”, and allow the preferred name only for intentional direct address. It must restrict `category` to `ENRICHMENT_CATEGORIES`. The normalizer accepts legacy string array items so jobs from an older model response remain safe. Pass the loaded `User` document’s nickname/first_name through both conversation and story extraction paths. Update `savePendingInsights` to persist `content` and optional validated category.

- [ ] **Step 4: Run the normalizer test and API compile.**

  Run: `npm run compile` from `../api`.

  Expected: new object output and legacy string output both pass; compile is green.

- [ ] **Step 5: Commit the generation change.**

  ```bash
  git add src/utils/ai-prompt/index.ts src/workers/insight/persona.ts src/workers/insight/story.ts src/workers/insight/index.ts
  git commit -m "Generate member-facing insight observations"
  ```

### Task 3: Expose a backward-compatible observation API

**Files:**
- Modify: `../api/src/module/api/persona/service.ts`
- Modify: `../api/src/module/api/persona/controller.ts`
- Modify: `../api/src/module/api/persona/dto.ts`
- Modify: `../api/src/module/api/persona/routes.ts`
- Modify: `../api/src/docs/persona.docs.ts`

- [ ] **Step 1: Write failing service/controller tests for list, edit, and delete.**

  Cover these observable contracts:

  ```ts
  GET    /persona/observations
  PATCH  /persona/observations/:observationId  { content: 'You enjoy quiet Sundays.' }
  DELETE /persona/observations/:observationId
  ```

  The list response must include stored records with `{ id, content, field, category, sources, created_at, updated_at, editable: true }`. Existing Persona-array entries must be returned as `{ id: 'legacy:<field>:<index>', content, field, editable: false, sources: [] }` so old data remains visible without fabricated provenance.

- [ ] **Step 2: Run the endpoint tests and verify they fail for the missing routes.**

  Run the API test command selected in Task 1. Expected: 404/missing controller method for `/persona/observations`.

- [ ] **Step 3: Implement the read and mutation endpoints.**

  Add Zod schemas for a Mongo observation ID and `content: z.string().trim().min(1).max(600)`. Implement:

  ```ts
  listObservations(userId): Promise<{ data: InsightObservationDto[]; message: string }>
  updateObservation(observationId, payload, userId): Promise<{ data: InsightObservationDto; message: string }>
  deleteObservation(observationId, userId): Promise<{ data: null; message: string }>
  ```

  Scope all queries by `{ _id: observationId, user: userId }`; return `NotFoundException` for another member’s ID. For an edited stored observation, update both `InsightObservation.content` and the matching content in its Persona array only when the old content is present. For deletion, `$pull` that exact old content from its Persona array, then delete the observation. Do not allow mutation of `legacy:*` IDs.

- [ ] **Step 4: Run endpoint tests, compile, and lint.**

  Run from `../api`:

  ```bash
  npm run compile
  npm run lint
  ```

  Expected: list/mutation tests pass; TypeScript and GTS are green.

- [ ] **Step 5: Commit the contract.**

  ```bash
  git add src/module/api/persona src/docs/persona.docs.ts
  git commit -m "Expose insight observation management API"
  ```

### Task 4: Build pure web types and legacy voice protection

**Files:**
- Create: `src/features/insights/observation-types.ts`
- Create: `src/features/insights/observation-voice.ts`
- Test: `src/features/insights/observation-voice.test.ts`
- Modify: `src/api/endpoint.ts`

- [ ] **Step 1: Write failing voice-normalizer tests.**

  Add these assertions:

  ```ts
  expect(memberFacingObservation('The user values quiet Sundays.')).toBe('You value quiet Sundays.');
  expect(memberFacingObservation('the member prefers tea')).toBe('You prefer tea.');
  expect(memberFacingObservation('Maya, this appears in three memories.')).toBe('Maya, this appears in three memories.');
  expect(memberFacingObservation('')).toBe('');
  ```

- [ ] **Step 2: Run the test and verify it fails for the absent utility.**

  Run: `pnpm test -- src/features/insights/observation-voice.test.ts`.

  Expected: failure stating the module/export does not exist.

- [ ] **Step 3: Add types, endpoint templates, and the minimal normalizer.**

  Define `InsightObservation`, `InsightObservationSource`, and `InsightObservationField` in `observation-types.ts`. Add:

  ```ts
  personaObservations: '/persona/observations',
  personaObservation: '/persona/observations/:observationId',
  ```

  Implement `memberFacingObservation` as a display-only safeguard that replaces leading, case-insensitive `the user`, `the member`, or `the host` with `You`, adjusts the following `is/has/values/prefers/enjoys` verb for singular second person, and preserves arbitrary names/content. Do not attempt broad grammatical rewriting.

- [ ] **Step 4: Run the focused test.**

  Run: `pnpm test -- src/features/insights/observation-voice.test.ts`.

  Expected: all normalizer assertions pass.

- [ ] **Step 5: Commit the foundation.**

  ```bash
  git add src/features/insights/observation-types.ts src/features/insights/observation-voice.ts src/features/insights/observation-voice.test.ts src/api/endpoint.ts
  git commit -m "Add insight observation client foundation"
  ```

### Task 5: Implement the remembered-observation reservoir

**Files:**
- Create: `src/features/insights/insight-reservoir.tsx`
- Test: `src/features/insights/insight-reservoir.test.tsx`
- Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: Write failing component tests.**

  Use MSW to return a stored observation and a legacy observation. Test that the component:

  ```tsx
  expect(await screen.findByText('You prefer quiet Sundays.')).toBeInTheDocument();
  expect(screen.getByText('Everyday Life')).toBeInTheDocument();
  expect(screen.getByText('Based on 1 memory')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /review quiet sundays/i }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Sources');
  ```

  Add individual tests for no observations, source-less legacy fallback, edit PATCH success, and remove DELETE success. For the legacy entry, assert it shows its content but does not expose edit/remove controls.

- [ ] **Step 2: Run the reservoir test and verify it fails because the component is missing.**

  Run: `pnpm test -- src/features/insights/insight-reservoir.test.tsx`.

  Expected: module-not-found failure.

- [ ] **Step 3: Implement the focused reservoir component.**

  Fetch `endpoint.personaObservations` with SWR. Group only categorised stored observations by `enrichmentCategoryLabel(category)` and place uncategorised/legacy entries in “Other things Memento remembers.” Render one concise card per observation with normalized text, optional “Based on N memory/memories,” and a Review dialog. Use `useMutation` for PATCH and DELETE, invalidate `endpoint.personaObservations` and `endpoint.persona` after success, and use existing `Dialog`, `Button`, `Card`, `Separator`, and destructive confirmation styling. Ensure all buttons have specific accessible names.

- [ ] **Step 4: Run focused component tests.**

  Run: `pnpm test -- src/features/insights/insight-reservoir.test.tsx`.

  Expected: remembered cards, review, mutation, and legacy fallback tests pass.

- [ ] **Step 5: Commit the reservoir.**

  ```bash
  git add src/features/insights/insight-reservoir.tsx src/features/insights/insight-reservoir.test.tsx src/test/mocks/handlers.ts
  git commit -m "Build the insight reservoir"
  ```

### Task 6: Implement Explore next as a separate, actionable surface

**Files:**
- Create: `src/features/insights/explore-next.tsx`
- Test: `src/features/insights/explore-next.test.tsx`
- Modify: `src/components/modal/memory-insights/index.tsx`
- Modify: `src/components/modal/memory-insights/index.test.tsx`
- Modify: `src/components/modal/settings/stats.tsx`
- Modify: `src/components/modal/settings/stats.test.tsx`

- [ ] **Step 1: Write failing Explore next tests.**

  Given a stats nudge and two jump pills, assert the component renders no more than two prompts; `Reflect in chat` links to the primary conversation with the selected `starter` query; and `Dismiss` removes only that prompt from the current browser session. Given no nudge and no jump pills, assert the entire section is absent.

- [ ] **Step 2: Run the Explore next test and verify the component is missing.**

  Run: `pnpm test -- src/features/insights/explore-next.test.tsx`.

  Expected: module-not-found failure.

- [ ] **Step 3: Implement Explore next.**

  Convert `stats.nudge` to the first prompt and distinct `stats.jump_pills` to optional additional prompts, capped at two. Build the existing `/chat/:primaryConversationId?starter=...` or `/chat?starter=...` URL. Persist dismissal in `sessionStorage` by a stable key derived from category key and prompt text; do not call any API on dismissal. Use second-person copy and add an accessible reason line such as “A quieter part of your memory map.”

- [ ] **Step 4: Replace the old narrative card placement.**

  In `MemoryInsightsModal`, remove `useNarrativeInsights`, `NarrativeInsightsBlock`, and the duplicate raw Persona **All observations** details. Insert **What Memento remembers** with `InsightReservoir`, then **Explore next** with `ExploreNext`, before At a glance. Keep the snapshot hero and beneficiaries. In Settings Stats, remove the old narrative carousel and retain a clear “See full insights” entry point to the modal.

- [ ] **Step 5: Run modal, Settings, and Explore next tests.**

  Run:

  ```bash
  pnpm test -- src/features/insights/explore-next.test.tsx src/components/modal/memory-insights/index.test.tsx src/components/modal/settings/stats.test.tsx
  ```

  Expected: prompt handoff, dismiss state, section ordering, no duplicate narrative carousel, and existing settings navigation all pass.

- [ ] **Step 6: Commit the composed UI.**

  ```bash
  git add src/features/insights/explore-next.tsx src/features/insights/explore-next.test.tsx src/components/modal/memory-insights/index.tsx src/components/modal/memory-insights/index.test.tsx src/components/modal/settings/stats.tsx src/components/modal/settings/stats.test.tsx
  git commit -m "Separate reflection prompts from remembered insights"
  ```

### Task 7: Full verification and PR readiness

**Files:**
- Modify: `docs/MEMENTO_ENRICHMENT_SCORE.md`
- Modify: `docs/INSIGHT_PANEL_REMAINING_TODOS.md`

- [ ] **Step 1: Update the product documentation.**

  Replace references to client-built narrative cards as the primary Insights UX with the two-section reservoir model, its observation API dependency, the member-facing voice requirement, and the distinction between reviewable observations and dismissed Explore next prompts.

- [ ] **Step 2: Run web quality gates.**

  Run from `memento-web`:

  ```bash
  pnpm test
  pnpm run lint
  pnpm run build
  ```

  Expected: all tests, ESLint, and Vite build pass.

- [ ] **Step 3: Run API quality gates from the clean API branch.**

  Run from `../api`:

  ```bash
  npm run compile
  npm run lint
  ```

  Expected: compile and GTS lint pass.

- [ ] **Step 4: Inspect the final diffs and commit documentation only.**

  ```bash
  git diff --check
  git status --short
  git add docs/MEMENTO_ENRICHMENT_SCORE.md docs/INSIGHT_PANEL_REMAINING_TODOS.md
  git commit -m "Document the insights reservoir"
  ```

- [ ] **Step 5: Prepare coordinated PRs.**

  Push the API dependency branch first, then push `memento-web` branch `insights`. In the web PR, state that the observation API must be deployed with or before the UI; the UI’s empty/error state remains safe until then.

## Plan self-review

- **Spec coverage:** Tasks 1–3 implement durable observation records, sources, categories, editing/removal, and generation-side voice. Tasks 4–6 implement second-person display protection, grouped reservoir presentation, source review, distinct Explore next prompts, chat handoff, dismissal, and empty states. Task 7 covers documentation and quality gates.
- **Placeholder scan:** no TBD/TODO markers; all files, endpoints, commands, expected outcomes, and payload shapes are specified.
- **Type consistency:** `InsightObservation`, `category`, `sources`, `editable`, and `/persona/observations` are used consistently from persistence through UI.
