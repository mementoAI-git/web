# Explore Topics Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Explore taxonomy with 11 canonical categories, seed 110 curated starter questions, preserve existing answers, persist skip/not-relevant feedback, and gradually mix evidence-based personalized questions after five starter answers per category.

**Architecture:** The API is the runtime taxonomy and question-selection source of truth. Existing prompt IDs and `Memory.prompt` references remain intact; a reversible migration annotates and remaps legacy prompts, while a new per-user state model stores feedback. Category-specific AI questions are generated asynchronously into the existing prompt collection, and the web app consumes the API catalog while retaining only a temporary slug-to-image presentation map.

**Tech Stack:** Node.js 24, TypeScript, Express, Mongoose, BullMQ, OpenRouter/Gemini, React 19, React Router, SWR, Vitest, Testing Library, Vite.

---

## File Map

### API repository (`../api` from `memento-web`)

- Create `src/module/api/prompt/explore-taxonomy.ts` — canonical categories, slug types, descriptions, and legacy aliases.
- Create `src/module/api/prompt/explore-starter-questions.ts` — 110 starter question records with deterministic stable IDs.
- Create `src/module/api/prompt/explore-selection.ts` — pure progress, ratio, deduplication, and interleaving rules.
- Create `src/module/api/prompt/explore-personalization.ts` — context construction and evidence-constrained generation.
- Create `src/module/database/model/explore-question-state.ts` — per-user skip/not-relevant state.
- Create `src/services/queues/explore-questions/index.ts` — idempotent personalization refill queue.
- Create `src/workers/explore-questions/index.ts` — background generation worker.
- Create `src/module/database/migrations/explore-topics-v2.ts` — dry-run/apply/reverse legacy prompt migration.
- Create `src/module/database/seed/explore-prompts.seed.ts` — idempotent starter upserts.
- Create `test/prompt/explore-taxonomy.test.ts`, `explore-starter-questions.test.ts`, `explore-selection.test.ts`, and `explore-migration.test.ts` — pure backend behavior coverage.
- Modify `src/module/database/model/prompt.ts` — additive Explore metadata and indexes.
- Modify `src/module/api/prompt/interface.ts`, `validator.ts`, `controller.ts`, `routes.ts`, and `service.ts` — catalog, feedback, category feed, compatibility, progress, and refill orchestration.
- Modify `src/services/queues/index.ts` and `src/workers/index.ts` — register the new queue and worker.
- Modify `src/docs/prompts.docs.ts` — document category catalog, feed metadata, aliases, and feedback.
- Modify `package.json` — test and Explore seed/migration commands without disturbing current user changes.

### Web repository (`memento-web`)

- Replace `src/utility/data/categories.ts` with presentation-only image resolution keyed by canonical slug.
- Create `src/features/explore/explore-types.ts` — category, prompt, progress, and feedback contracts.
- Create `src/features/explore/explore-api.ts` — catalog and feedback calls.
- Create `src/features/explore/explore-category-images.test.ts` — image-map completeness.
- Modify `src/api/endpoint.ts` and `src/utility/interface.ts` — new API endpoints and prompt metadata.
- Modify `src/pages/dashboard/explore/index.tsx` — render API categories.
- Modify `src/pages/dashboard/explore/category.tsx` — canonical/legacy route resolution.
- Modify `src/pages/dashboard/explore/category-details.tsx` — consume feed metadata, correct tab copy, mutate feedback, and refresh pages.
- Modify `src/pages/dashboard/explore/category-prompt-card.tsx` — source label plus Skip and Not relevant actions.
- Modify `src/pages/dashboard/overview/sections/browse-topics.tsx`, chat suggestions, and memory-search image fallback — canonical image lookup without treating free-form memory categories as Explore taxonomy.
- Add/update adjacent Vitest files for catalog rendering, redirects, cards, feedback actions, and overview category images.

## Task 1: Backend Test Harness and Canonical Taxonomy

**Files:**

- Modify: `../api/package.json`
- Create: `../api/src/module/api/prompt/explore-taxonomy.ts`
- Create: `../api/test/prompt/explore-taxonomy.test.ts`

- [ ] **Step 1: Add the failing taxonomy test**

Use Node's built-in test runner through the already-installed `ts-node` package. Add a `test` script using `node --test -r ts-node/register`, then assert that the exported catalog has the exact 11 approved slugs in order, unique values, and complete legacy aliases including `region -> beliefs-faith`.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXPLORE_CATEGORIES,
  LEGACY_EXPLORE_CATEGORY_ALIASES,
  resolveExploreCategorySlug,
} from '../../src/module/api/prompt/explore-taxonomy';

test('defines the approved Explore taxonomy in display order', () => {
  assert.deepEqual(
    EXPLORE_CATEGORIES.map(category => category.slug),
    [
      'growing-up',
      'people-i-love',
      'the-life-i-live',
      'things-i-love',
      'who-i-am',
      'work-purpose',
      'beliefs-faith',
      'where-i-come-from',
      'stories-adventures',
      'what-life-taught-me',
      'whats-ahead',
    ],
  );
  assert.equal(LEGACY_EXPLORE_CATEGORY_ALIASES.region, 'beliefs-faith');
  assert.equal(resolveExploreCategorySlug('identity'), 'who-i-am');
  assert.equal(resolveExploreCategorySlug('unknown'), null);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- test/prompt/explore-taxonomy.test.ts`

Expected: FAIL because `explore-taxonomy.ts` does not exist.

- [ ] **Step 3: Implement the canonical taxonomy**

Define `EXPLORE_CATEGORIES` with `slug`, `title`, `description`, and `order`; derive `ExploreCategorySlug`; export the exact legacy alias record from the approved design; and implement `isExploreCategorySlug` plus `resolveExploreCategorySlug`.

- [ ] **Step 4: Run the taxonomy test and verify GREEN**

Run: `npm test -- test/prompt/explore-taxonomy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the backend taxonomy unit**

```bash
git add package.json src/module/api/prompt/explore-taxonomy.ts test/prompt/explore-taxonomy.test.ts
git commit -m "feat: define canonical Explore taxonomy"
```

## Task 2: Curated Starter Question Source and Integrity

**Files:**

- Create: `../api/src/module/api/prompt/explore-starter-questions.ts`
- Create: `../api/test/prompt/explore-starter-questions.test.ts`

- [ ] **Step 1: Write the failing starter integrity test**

Assert 110 total records, exactly 10 per canonical category, unique stable IDs, and normalized-unique question text.

```ts
test('contains exactly ten unique starters for every Explore category', () => {
  assert.equal(EXPLORE_STARTER_QUESTIONS.length, 110);
  for (const category of EXPLORE_CATEGORIES) {
    assert.equal(
      EXPLORE_STARTER_QUESTIONS.filter(q => q.category === category.slug).length,
      10,
    );
  }
  assert.equal(new Set(EXPLORE_STARTER_QUESTIONS.map(q => q.stable_id)).size, 110);
  assert.equal(
    new Set(EXPLORE_STARTER_QUESTIONS.map(q => normalizeQuestion(q.title))).size,
    110,
  );
});
```

- [ ] **Step 2: Run the starter test and verify RED**

Run: `npm test -- test/prompt/explore-starter-questions.test.ts`

Expected: FAIL because the starter module does not exist.

- [ ] **Step 3: Transcribe the approved 110 questions**

Export typed records with deterministic IDs `starter:<slug>:01` through `starter:<slug>:10`, `type: 'question'`, `source: 'starter'`, `active: true`, and the exact approved wording from `memento-explore-topics-starter-questions.md`.

- [ ] **Step 4: Run the starter integrity test and verify GREEN**

Run: `npm test -- test/prompt/explore-starter-questions.test.ts`

Expected: PASS with all 110 records validated.

- [ ] **Step 5: Commit the starter source**

```bash
git add src/module/api/prompt/explore-starter-questions.ts test/prompt/explore-starter-questions.test.ts
git commit -m "feat: add curated Explore starter questions"
```

## Task 3: Additive Prompt Metadata and User Feedback State

**Files:**

- Modify: `../api/src/module/database/model/prompt.ts`
- Create: `../api/src/module/database/model/explore-question-state.ts`
- Modify: `../api/src/module/api/prompt/interface.ts`

- [ ] **Step 1: Add failing schema tests**

Test that `Prompt.schema` exposes the additive fields, that `source` accepts only `starter`, `ai-generated`, or `legacy`, and that the feedback model has a unique `(user, prompt)` index and only `skipped`/`not-relevant` statuses.

- [ ] **Step 2: Run the schema test and verify RED**

Run: `npm test -- test/prompt/explore-models.test.ts`

Expected: FAIL because the fields/model do not exist.

- [ ] **Step 3: Extend models without replacing existing definitions**

Preserve the current `mongoose.models` guards and user changes. Add optional prompt fields, sparse unique index on `stable_id`, owner/category indexes, and the question-state timestamps/index. Store `generation_context` as bounded structured metadata, not model reasoning.

- [ ] **Step 4: Run schema tests and compile**

Run: `npm test -- test/prompt/explore-models.test.ts && npm run compile`

Expected: PASS and exit 0.

- [ ] **Step 5: Commit the models**

```bash
git add src/module/database/model/prompt.ts src/module/database/model/explore-question-state.ts src/module/api/prompt/interface.ts test/prompt/explore-models.test.ts
git commit -m "feat: store Explore question metadata and feedback"
```

## Task 4: Reversible Legacy Migration and Idempotent Starter Seed

**Files:**

- Create: `../api/src/module/database/migrations/explore-topics-v2.ts`
- Create: `../api/src/module/database/seed/explore-prompts.seed.ts`
- Create: `../api/test/prompt/explore-migration.test.ts`
- Modify: `../api/package.json`

- [ ] **Step 1: Write failing pure migration-plan tests**

Test that every old slug maps to the approved canonical slug, migration updates preserve `_id`, unknown categories are untouched, and reverse updates restore `legacy_category`.

- [ ] **Step 2: Run migration tests and verify RED**

Run: `npm test -- test/prompt/explore-migration.test.ts`

Expected: FAIL because migration helpers do not exist.

- [ ] **Step 3: Implement dry-run/apply/reverse migration commands**

Export pure update builders for tests. The executable connects to MongoDB, reports matched counts by old slug, defaults to dry-run, requires `--apply` for forward writes, and requires `--reverse --apply` for reversal. Forward updates set `legacy_category`, canonical `category`, `source: 'legacy'`, and `active: false` without changing IDs or deleting records.

- [ ] **Step 4: Implement the starter upsert command**

Bulk upsert by `stable_id`, setting category/title/source/type/active/tags. Do not delete prompts and do not overwrite `_id` values after creation. Add `explore:seed`, `explore:migrate`, and `explore:migrate:reverse` scripts while retaining all existing package changes.

- [ ] **Step 5: Verify tests and dry-run behavior**

Run: `npm test -- test/prompt/explore-migration.test.ts && npm run compile`

Expected: PASS and exit 0. Do not apply production migration during ordinary verification.

- [ ] **Step 6: Commit migration tooling**

```bash
git add package.json src/module/database/migrations/explore-topics-v2.ts src/module/database/seed/explore-prompts.seed.ts test/prompt/explore-migration.test.ts
git commit -m "feat: add safe Explore prompt migration tooling"
```

## Task 5: Pure Progress, Mixing, and Duplicate Rules

**Files:**

- Create: `../api/src/module/api/prompt/explore-selection.ts`
- Create: `../api/test/prompt/explore-selection.test.ts`

- [ ] **Step 1: Write failing selection tests**

Cover these independent behaviors:

- 0–4 answered starters disables personalization.
- 5–7 answered starters targets 60/40.
- 8+ starters plus five usable context records targets 30/70.
- Available-pool shortages backfill from the other source.
- Exact normalized duplicates are removed.
- Token Jaccard near-duplicates above the configured threshold are removed.
- Answered and not-relevant IDs are excluded.
- Skipped IDs are suppressed without becoming not-relevant.

- [ ] **Step 2: Run selection tests and verify RED**

Run: `npm test -- test/prompt/explore-selection.test.ts`

Expected: FAIL because the selection module does not exist.

- [ ] **Step 3: Implement small pure functions**

Implement and export `computeExploreProgress`, `resolveExploreMix`, `normalizeQuestion`, `questionSimilarity`, `dedupeQuestions`, and `selectExploreQuestions`. Keep database access out of this module.

- [ ] **Step 4: Run selection tests and verify GREEN**

Run: `npm test -- test/prompt/explore-selection.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit selection logic**

```bash
git add src/module/api/prompt/explore-selection.ts test/prompt/explore-selection.test.ts
git commit -m "feat: select and mix Explore questions"
```

## Task 6: Category Catalog, Personalized Feed, and Feedback API

**Files:**

- Modify: `../api/src/module/api/prompt/service.ts`
- Modify: `../api/src/module/api/prompt/controller.ts`
- Modify: `../api/src/module/api/prompt/routes.ts`
- Modify: `../api/src/module/api/prompt/validator.ts`
- Modify: `../api/src/docs/prompts.docs.ts`

- [ ] **Step 1: Add failing service/contract tests around extracted query helpers**

Test canonical and legacy slug resolution, progress metadata shape, visibility filtering for user-owned AI prompts, and feedback payload validation. Keep database-dependent orchestration thin enough that pure query/filter builders can be tested without a live database.

- [ ] **Step 2: Run contract tests and verify RED**

Run: `npm test -- test/prompt/explore-service-contract.test.ts`

Expected: FAIL because the new contract functions/endpoints do not exist.

- [ ] **Step 3: Implement catalog and category feed services**

Add `getExploreCategories(userId)`, replace legacy category pagination internals with canonical selection, preserve `answered=true|false`, return page-level `progress`, and include `source` plus effective status per document. The answered view may include inactive migrated legacy prompts; the new unanswered feed may not.

- [ ] **Step 4: Implement authenticated feedback mutation**

Add `POST /prompts/:id/feedback` with `{status: 'skipped' | 'not-relevant'}`. Validate the prompt exists and is either global or owned by the authenticated user. Upsert only that user's state. Reject access to another user's generated prompt with a typed service error.

- [ ] **Step 5: Register route order and Swagger contracts**

Register `GET /prompts/categories` before `GET /prompts/categories/:id`, keep feature gates, add feedback validation, and document canonical slugs, alias behavior, progress, and status semantics.

- [ ] **Step 6: Run prompt tests and compile**

Run: `npm test -- test/prompt/*.test.ts && npm run compile`

Expected: all prompt tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit the API contract**

```bash
git add src/module/api/prompt src/docs/prompts.docs.ts test/prompt
git commit -m "feat: serve personalized Explore category feeds"
```

## Task 7: Asynchronous Evidence-Based Personalization

**Files:**

- Create: `../api/src/module/api/prompt/explore-personalization.ts`
- Create: `../api/src/services/queues/explore-questions/index.ts`
- Create: `../api/src/workers/explore-questions/index.ts`
- Modify: `../api/src/services/queues/index.ts`
- Modify: `../api/src/workers/index.ts`
- Modify: `../api/src/module/api/prompt/service.ts`
- Create: `../api/test/prompt/explore-personalization.test.ts`

- [ ] **Step 1: Write failing prompt-construction tests**

Assert that the system instruction contains every unsupported-experience safeguard, distinguishes skip from not-relevant, includes the requested canonical category, requests exactly one plain-text question, and includes known context only when records are present.

- [ ] **Step 2: Run personalization tests and verify RED**

Run: `npm test -- test/prompt/explore-personalization.test.ts`

Expected: FAIL because the personalization module does not exist.

- [ ] **Step 3: Build bounded personalization context**

Fetch limited recent same-category answers, other Explore answers, stories, persona facts/insights available through existing models, and feedback. Include IDs and short excerpts only. Never expose hidden reasoning. Reuse the existing OpenRouter-first/Gemini-fallback pattern and normalize output to one question.

- [ ] **Step 4: Add the idempotent refill queue and worker**

Queue data is `{user_id, category}`. Use a deterministic job ID per user/category while a refill is pending. The worker rechecks eligibility/pool size, generates one question, rejects duplicates against starters/legacy/generated/answered text, and persists a user-owned `Prompt` record.

- [ ] **Step 5: Trigger refill without blocking requests**

After the feed service determines a user is eligible and below the personalized pool floor, enqueue with `void queueExploreQuestionRefill(...)`. Starter results still return if Redis or the model is unavailable.

- [ ] **Step 6: Register Bull Board and worker shutdown**

Include the new queue only when available; start and close the Explore worker with the existing worker lifecycle.

- [ ] **Step 7: Verify personalization tests and compile**

Run: `npm test -- test/prompt/explore-personalization.test.ts && npm run compile`

Expected: PASS and exit 0.

- [ ] **Step 8: Commit personalization**

```bash
git add src/module/api/prompt src/services/queues src/workers test/prompt/explore-personalization.test.ts
git commit -m "feat: generate evidence-based Explore questions"
```

## Task 8: Web Contracts, Catalog, and Temporary Image Map

**Files:**

- Create: `src/features/explore/explore-types.ts`
- Create: `src/features/explore/explore-api.ts`
- Replace: `src/utility/data/categories.ts`
- Create: `src/features/explore/explore-category-images.test.ts`
- Modify: `src/api/endpoint.ts`
- Modify: `src/utility/interface.ts`
- Modify: `src/utility/index.ts`
- Modify: `src/utility/index.test.ts`

- [ ] **Step 1: Write failing web contract/image tests**

Assert the 11 canonical slugs resolve to an image, unknown/free-form memory categories use an explicit fallback, and legacy aliases resolve only through the Explore compatibility helper.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/explore/explore-category-images.test.ts src/utility/index.test.ts`

Expected: FAIL because canonical image/config helpers do not exist.

- [ ] **Step 3: Add typed API contracts and endpoints**

Define category, question source/status, page progress, and feedback request types. Add catalog and feedback endpoint helpers. Keep API taxonomy data out of frontend static configuration.

- [ ] **Step 4: Convert category data to presentation-only images**

Map all 11 canonical slugs to the closest existing assets. Export a separate generic fallback for free-form memory categories. Remove legacy category titles/descriptions from the frontend source of truth.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/features/explore/explore-category-images.test.ts src/utility/index.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit web contracts**

```bash
git add src/features/explore src/utility/data/categories.ts src/api/endpoint.ts src/utility/interface.ts src/utility/index.ts src/utility/index.test.ts
git commit -m "refactor: consume canonical Explore category contracts"
```

## Task 9: Web Explore Pages, Legacy Redirects, and Feedback Actions

**Files:**

- Modify: `src/pages/dashboard/explore/index.tsx`
- Modify: `src/pages/dashboard/explore/category.tsx`
- Modify: `src/pages/dashboard/explore/category-details.tsx`
- Modify: `src/pages/dashboard/explore/category-prompt-card.tsx`
- Create/update: adjacent `.test.tsx` files

- [ ] **Step 1: Write failing page and interaction tests**

Cover API-driven category rendering, loading/empty states, old `/explore/categories/identity` redirecting to `/explore/categories/who-i-am`, default tab copy reading `All`, starter/personalized source labels, Skip mutation, Not relevant mutation, and feed-cache refresh after success.

- [ ] **Step 2: Run page tests and verify RED**

Run: `npm test -- src/pages/dashboard/explore`

Expected: FAIL on the new catalog and feedback behaviors.

- [ ] **Step 3: Implement catalog rendering and redirects**

Fetch `GET /prompts/categories`, pair results with the local image resolver, and render in API order. Resolve legacy route slugs to canonical slugs with `<Navigate replace>` before loading details.

- [ ] **Step 4: Implement question feedback controls**

Make cards semantically valid without nested links. Keep one Reply action and separate buttons for Skip and Not relevant. Stop event propagation, disable actions while mutating, show accessible labels, and revalidate the active SWR Infinite feed after success.

- [ ] **Step 5: Keep progress invisible**

Use progress only as response metadata; do not render counts, thresholds, unlock language, or percentage mix.

- [ ] **Step 6: Run page tests and variable checks**

Run: `npm test -- src/pages/dashboard/explore && npm run lint -- src/pages/dashboard/explore src/features/explore`

Also follow `.cursor/commands/check-variables.md` for changed UI files.

Expected: tests pass, no ESLint errors, and `All variables applied correctly.`

- [ ] **Step 7: Commit the Explore UI**

```bash
git add src/pages/dashboard/explore src/features/explore
git commit -m "feat: migrate Explore pages to personalized topics"
```

## Task 10: Overview, Suggestions, and Non-Explore Category Boundaries

**Files:**

- Modify: `src/pages/dashboard/overview/sections/browse-topics.tsx`
- Modify: `src/pages/dashboard/overview/sections/browse-topics.test.tsx`
- Modify: `src/pages/dashboard/chat/main/suggested-conversations.tsx`
- Modify: `src/pages/dashboard/chat/main/suggested-conversations.test.tsx`
- Modify: `src/pages/dashboard/chat/suggested-conversation/index.tsx`
- Modify: `src/components/modal/memory/search/search-item.tsx`
- Update adjacent tests as needed.

- [ ] **Step 1: Write failing compatibility tests**

Test canonical prompt categories render the correct temporary image/label, legacy API records resolve through aliases, and arbitrary memory enrichment categories receive the generic memory fallback rather than being treated as Explore categories.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/pages/dashboard/overview/sections/browse-topics.test.tsx src/pages/dashboard/chat/main/suggested-conversations.test.tsx`

Expected: FAIL on canonical image/alias behavior.

- [ ] **Step 3: Update consumers and API overview filtering**

Use the canonical resolver for Explore prompt consumers. Update the API overview suggestion query to prefer active starters and user-owned personalized prompts, excluding inactive legacy questions from new suggestions while preserving answered history elsewhere.

- [ ] **Step 4: Remove deprecated active usage**

Search both repositories for the ten old slugs. Retain only migration aliases, legacy tests/fixtures, persisted-data compatibility, and unrelated domain uses. Remove old UI category definitions and active selection logic.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the focused tests from Step 2 plus API prompt tests.

Expected: PASS.

- [ ] **Step 6: Commit consumer cleanup**

```bash
git add src/pages/dashboard/overview src/pages/dashboard/chat src/components/modal/memory/search
git commit -m "refactor: align prompt suggestions with Explore taxonomy"
```

## Task 11: Full Verification and Migration Handoff

**Files:**

- Modify documentation only if verification reveals a contract correction.

- [ ] **Step 1: Run the API gate**

From `api`:

```bash
npm test
npm run lint
npm run build
```

Expected: all tests pass; lint and build exit 0. Fix only failures caused by this migration and preserve unrelated user changes.

- [ ] **Step 2: Run the web gate**

From `memento-web`:

```bash
npm test
npm run lint
npm run build
```

Expected: all tests pass; lint and build exit 0.

- [ ] **Step 3: Perform security and data-boundary review**

Confirm every new route is authenticated, generated prompts are owner-scoped, feedback cannot target another user's generated prompt, request bodies are validated, generation context is bounded, no secrets or user content are logged, and no public write path was added.

- [ ] **Step 4: Run a read-only production migration dry run**

Run: `npm run explore:migrate`

Expected: reports the same legacy-category population shape or explicitly reports any drift; performs zero writes.

- [ ] **Step 5: Review seed and apply commands without executing production writes**

Report the exact commands and counts that an authorized operator should use. Do not seed or apply the production migration without explicit deployment authorization.

- [ ] **Step 6: Audit deprecated slugs**

Run focused `rg` searches across both repositories. Classify every remaining match as migration compatibility, historical data fixture, unrelated domain terminology, or a defect to fix.

- [ ] **Step 7: Report final state**

List changed files, schema additions, migration scripts, compatibility aliases, 110 imported starters, personalization behavior, test/lint/build evidence, assumptions, unresolved deployment risks, and the explicit follow-up for dedicated category images.

## Plan Self-Review

- Every approved taxonomy, starter, migration, feedback, threshold, mixing, dedupe, enrichment-boundary, compatibility, and verification requirement has a task.
- Existing prompt IDs and memory references are never recreated or deleted.
- Production writes are separated from implementation and require explicit authorization.
- The API's existing uncommitted changes are preserved; planned modifications are additive and must be patched around current content.
- The frontend contains presentation assets only; category names/slugs/descriptions remain API-owned.
- No placeholder implementation steps remain.
