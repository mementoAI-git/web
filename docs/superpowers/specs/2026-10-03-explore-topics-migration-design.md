# Explore Topics Migration and Personalization Design

**Date:** 2026-10-03

**Status:** Approved
**Source documents:**

- `docs/memento-explore-topics-concept-and-implementation.md`
- `docs/memento-explore-topics-starter-questions.md`

## Goal

Replace the legacy Explore taxonomy with 11 user-facing categories, seed 110 curated starter questions, preserve all existing answers, and introduce category-level AI personalization gradually after a user answers five starter questions in that category.

Explore categories remain separate from the 10 internal enrichment Life Areas. Explore controls browsing and reflection-question selection; enrichment dimensions continue to describe internal context coverage.

## Current Architecture and Production State

The web application defines its legacy Explore categories in `src/utility/data/categories.ts`. The Explore index renders that static configuration, and each category page requests paginated prompts from `GET /prompts/categories/:slug`.

The API stores catalog questions in MongoDB `Prompt` documents. A saved answer is a `Memory` document whose `prompt` field contains the prompt document ID. Category filtering reads `Prompt.category`; answered filtering finds non-draft memories with matching prompt IDs. This relationship means prompt IDs must remain stable during migration.

The existing daily AI prompt system generates one general reflection prompt and caches it by user and date. It does not track Explore categories, starter progress, skips, or not-relevant feedback, so it cannot serve as the new category personalization system without category-specific extensions.

A read-only production audit on 2026-10-03 found:

- 308 prompt documents.
- Categories: 100 `career`, 78 `relationship`, 66 `purpose`, 21 `life-transition`, 21 `identity`, 11 `experience-culture`, and 11 `wellbeing`.
- 31 saved, non-draft answers linked to prompts.
- Answer distribution: 9 `career`, 7 `purpose`, 7 `relationship`, 4 `identity`, and 4 `life-transition`.
- Zero broken answer-to-prompt references.
- Zero saved AI daily-prompt answers at the time of the audit.

The legacy frontend also defines `family`, `region`, and `belief`, but no production prompt documents currently use those three category values. The `region` slug represents faith/religion in the old UI and is treated as a legacy naming defect.

No Explore-specific analytics events or semantic-embedding service were found. Prompt suggestion endpoints and feature flags depend on prompt records and categories, but the 10 enrichment Life Areas do not depend directly on the old Explore slugs.

## Canonical Explore Taxonomy

The API is the runtime source of truth for the new taxonomy because the web and API are deployed as separate projects. The API will expose the ordered category catalog through `GET /prompts/categories`. The web application will render category names, descriptions, slugs, and order from that response.

The canonical categories are:

| Category | Slug |
|---|---|
| Growing Up | `growing-up` |
| People I Love | `people-i-love` |
| The Life I Live | `the-life-i-live` |
| Things I Love | `things-i-love` |
| Who I Am | `who-i-am` |
| Work & Purpose | `work-purpose` |
| Beliefs & Faith | `beliefs-faith` |
| Where I Come From | `where-i-come-from` |
| Stories & Adventures | `stories-adventures` |
| What Life Taught Me | `what-life-taught-me` |
| What's Ahead | `whats-ahead` |

The frontend will retain only a presentation-only map from category slug to image import. Dedicated images are not yet available, so the first release will reuse the closest existing artwork. Replacing those assets later will not require API, database, route, or taxonomy changes.

## Prompt Model

The existing `Prompt` collection remains the question store. It will be extended with optional metadata that does not invalidate legacy documents:

- `stable_id`: deterministic external key for idempotent starter seeding.
- `source`: `starter`, `ai-generated`, or `legacy`.
- `category`: canonical Explore slug after migration.
- `legacy_category`: original old category value when a legacy prompt is migrated.
- `owner_user`: present only for user-specific AI-generated questions.
- `active`: whether the question may be selected for a new unanswered feed.
- `generation_context`: bounded audit metadata for AI-generated questions, containing referenced record IDs and generation version but no hidden reasoning.

Legacy prompt `_id` values will never be replaced. Existing answers therefore continue to reference the same documents.

Starter prompts use deterministic keys such as `starter:growing-up:01`. The seed process uses upserts by `stable_id`, making repeated deployments safe and allowing wording or metadata corrections without creating duplicates.

## Per-User Question State

Answered state continues to be inferred from saved, non-draft `Memory` documents. This avoids duplicating an existing concept.

A new per-user question-state collection records feedback that currently has no persistence location:

- `user`
- `prompt`
- `status`: `skipped` or `not-relevant`
- timestamps

A unique index on `(user, prompt)` makes updates idempotent. Answered state takes precedence if a previously skipped question is later answered.

`not-relevant` permanently excludes that question from future selection and becomes negative context for generation. `skipped` suppresses the question from the immediate feed but remains weak feedback. It does not establish that the underlying subject is irrelevant and may be eligible again only after a defined cooldown or an explicit future history surface; the initial category feed will not immediately resurface it.

## Starter Questions and Progress

All 110 curated questions from the approved starter-question document will be represented in one backend seed module. An integrity test will enforce:

- exactly 11 categories,
- exactly 10 starter questions per category,
- 110 unique `stable_id` values,
- 110 normalized-unique question strings,
- only canonical category slugs.

For a category, progress is calculated from saved memories joined to prompts whose `source` is `starter` and whose canonical category matches the requested category:

```ts
{
  categorySlug: "growing-up",
  starterAnswered: 6,
  starterTotal: 10,
  personalizedQuestionsEnabled: true
}
```

The eligibility threshold is five answered starter questions within the same category. Progress is internal API metadata and will not be presented as an unlock, checklist, or completion counter in the UI.

## Selection and Mixing

The category service owns question selection so every client receives the same behavior.

Before the threshold, the unanswered feed returns active starter questions only. After five starter answers, it mixes unanswered starters with available user-owned AI questions at an initial target of 60% starter and 40% personalized. At high context, the target may move to 30% starter and 70% personalized. For the initial implementation, high context means at least eight answered starters in the category plus at least five additional usable context records across saved memories, insights, or category answers.

Ratios are targets, not guarantees. If one pool lacks enough questions, the service fills from the other pool rather than returning an artificially short page. Unanswered starters remain eligible after personalization starts.

The active unanswered feed excludes:

- answered prompts,
- prompts marked not relevant,
- prompts currently suppressed by a skip,
- inactive legacy prompts,
- exact duplicate text,
- near-duplicate text above the configured similarity threshold.

The answered view includes answered starters, answered personalized prompts, and migrated legacy prompts so existing history remains accessible. Legacy prompts are marked inactive for new selection by default; they remain stored and queryable for history.

Near-duplicate filtering starts with normalized exact comparison and token-set similarity. The implementation will isolate this behind a small function so an embedding-backed comparison can replace it later without changing the feed contract.

## AI-Generated Questions

Personalized generation runs in a background queue rather than blocking the category request. When an eligible category's personalized pool drops below a small refill threshold, the request path enqueues an idempotent generation job and returns the currently available mix. A later fetch can include the newly generated question.

Generation context may include:

- saved answers from the requested Explore category,
- saved answers from other Explore categories,
- recent stories and memories,
- Quick Notes represented by existing memory records,
- available persona facts or Insights,
- safely exposed uploaded-content summaries,
- skipped questions as weak negative context,
- not-relevant questions as strong negative context,
- previously answered/generated question text for deduplication.

The model instruction will explicitly require evidence-based questions and prohibit unsupported assumptions about marriage, children, heartbreak, bereavement, trauma, religion, travel, career success, job loss, illness, or major life transitions. It will require one concise question in plain text and apply the principle: ask about the person before assuming the experience.

Generated questions are persisted as `Prompt` documents with `source: "ai-generated"`, the canonical category, `owner_user`, a stable generation identifier, and bounded audit metadata. They use the normal prompt-answer path, so no parallel answer model is introduced.

If AI generation fails or is unavailable, the category continues serving starters. Generation failure does not prevent browsing or answering.

## Legacy Migration and Compatibility

The primary reversible mapping is:

| Old slug | New slug |
|---|---|
| `career` | `work-purpose` |
| `family` | `people-i-love` |
| `relationship` | `people-i-love` |
| `region` | `beliefs-faith` |
| `belief` | `beliefs-faith` |
| `purpose` | `work-purpose` |
| `life-transition` | `what-life-taught-me` |
| `wellbeing` | `the-life-i-live` |
| `identity` | `who-i-am` |
| `experience-culture` | `stories-adventures` |

This is intentionally conservative. Several old categories could plausibly map to multiple new categories, but an automated content classifier would make the migration difficult to audit and reverse. The curated starters provide coverage for categories that have no clean legacy equivalent.

The migration script will:

1. Match only prompts whose category is a known old slug.
2. Copy the original value to `legacy_category` if it is not already present.
3. Set the canonical category from the mapping.
4. Set `source: "legacy"` and `active: false` unless already explicitly classified.
5. Leave `_id`, title, tags, timestamps, and all memory records unchanged.
6. Produce counts before and after the update.

A reverse mode will restore `category` from `legacy_category` for migrated legacy prompts. The migration will be idempotent in both directions.

Old category URLs and API requests will resolve through the same alias map and redirect or query the canonical category. Aliases are compatibility input only and will not appear in the new category catalog or be written to new records.

Unrelated legacy words will not be globally renamed. In particular, beneficiary relationships, free-form memory enrichment categories, tags such as `family`, and Life Area identifiers remain unchanged.

## API Contract

The category catalog endpoint returns the ordered canonical taxonomy and starter counts.

The existing category questions endpoint remains paginated and adds per-question `source` and effective user status plus internal progress metadata at the page level. The existing `answered=true|false` compatibility filter remains supported.

A new authenticated feedback endpoint validates canonical/legacy category context, prompt ownership/visibility, and the allowed status values before upserting user state. It cannot mutate another user's generated prompt state.

Controllers remain thin. Selection, eligibility, and feedback rules live in prompt-domain services. Route validation and DTOs remain aligned.

## Web Experience

The Explore index loads the category catalog from the API and combines each slug with the local temporary image map. Category routes accept canonical slugs; legacy routes redirect to canonical paths.

The category page continues to support all, answered, and unanswered browsing. Labels will be corrected so the default tab no longer says `Uploaded`. Question cards display starter and personalized questions uniformly; personalization eligibility and ratios are invisible.

Question actions add distinct `Skip` and `Not relevant to me` controls. Mutations update the feed cache after success. `Not relevant` removes the question from the active feed permanently. `Skip` removes it from the current active feed without treating its subject as disproven.

Existing reply links and answer flows remain intact because every served question, including personalized questions, has a persisted prompt ID.

## Enrichment Boundary

The 10 canonical enrichment categories and their scoring logic will not be renamed or replaced. Explore prompt answers continue through the existing memory enrichment pipeline. A future explicit Explore-to-enrichment relevance map may be added, but it is not required to launch this taxonomy because current saved answers are independently classified/enriched from their content.

## Testing and Verification

Implementation follows test-first development. Coverage will include:

- taxonomy order, uniqueness, and legacy alias resolution,
- 110-question seed integrity,
- reversible migration mapping without ID changes,
- starter-answer counting and the five-answer threshold,
- pre-threshold starter-only selection,
- post-threshold and high-context target mixing,
- answered, skipped, and not-relevant exclusion semantics,
- generated-question ownership isolation,
- exact and near-duplicate filtering,
- category catalog and feedback API validation,
- web category rendering and legacy redirects,
- skip/not-relevant interactions and cache updates,
- existing answer visibility after migration.

Final verification runs API compile and lint, then targeted and full web tests, lint, and production build. Database migration runs separately with dry-run counts before an explicit apply step.

## Rollout and Operational Safety

Deployment order is additive:

1. Deploy backward-compatible schema and API support.
2. Seed the 110 starter questions idempotently.
3. Dry-run and review the legacy prompt migration counts.
4. Apply the in-place legacy migration.
5. Deploy the updated web client.
6. Enable category personalization generation after starter/category behavior is verified.
7. Monitor generation failures, duplicate rejection, feedback rates, and legacy alias traffic.

The API continues to accept old slugs throughout rollout. No destructive prompt deletion is part of this design.

## Assumptions and Deferred Work

- Dedicated category images will be supplied later; existing images are temporary presentation assets.
- The current repository has no embedding-based similarity service, so initial near-duplicate detection is lexical and intentionally replaceable.
- The exact high-context heuristic and mix percentages are defaults that can be tuned without schema changes.
- Product analytics events are not introduced because no established Explore analytics pipeline exists in the audited code. Event instrumentation can be added once the desired analytics provider and event contract are specified.
- Existing extensive uncommitted API work belongs to the user and must be preserved. Explore changes will avoid overwriting or reverting it.
