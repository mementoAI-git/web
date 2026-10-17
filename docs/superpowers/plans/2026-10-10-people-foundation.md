# People Foundation Implementation Plan

> Execute inline in the existing workspace to preserve the in-progress dashboard,
> story viewer and preview work this feature depends on. Do not stage unrelated
> changes. The supplied People specs and IMPLEMENTATION_STATUS.md define scope.

**Goal:** Ship the first reviewable web People milestone: connections, safe invites
and a live-permission shared story archive.

**Architecture:** Adapt existing directional beneficiary relationships into a
bidirectional People read model. Persist one canonical pair per SharedSpace; read
story references from existing sharing fields. Keep Talk inactive until a later
milestone implements activation and viewer-owned AI conversations.

**Tech Stack:** React, SWR, existing shadcn components, Express, Mongoose, Vitest.

## 1. Backend access foundation

- [x] Write `api/test/people/people.test.ts` using existing Mongo test helpers.
  Cover incoming/outgoing relationships, pair deduplication, pending isolation,
  direct/group/everyone story sharing, private/draft/deleted exclusion, revocation,
  group removal, legacy scope restrictions and unrelated-user isolation.
- [x] Run `npm test -- test/people/people.test.ts` in `api`; expect missing service.
- [x] Add `api/src/module/api/people/{service,controller,dto,routes}.ts` and
  `api/src/module/database/model/shared-space.ts`. Register `/people` in the
  explicit router list. DTO validates person ID, page and limit. Return only
  person display metadata and permitted source memories; never chat histories.
- [x] Add `shared_only` to beneficiary scope and explicit-story read policy.
  Existing defaults remain unchanged. Test that shared_only can read explicit
  shares but cannot read other memories or capsules.
- [x] Run People/access regression tests and `npm run compile`.

## 2. People web foundation

- [x] Replace placeholder page tests with API-driven integration tests for empty,
  error/retry, search, selection, pending and inactive Talk states.
- [x] Add `src/api/people.ts`, `people-sidebar.tsx`, `relationship-workspace.tsx`
  and `our-space.tsx` beside the People page. Use account-scoped SWR keys, explicit
  fetchers, pagination and fresh detail reads through existing ViewMemory modal.
- [x] Reuse sidebar navigation in compact mode only on `/people`. Add layout
  regression tests for entry/exit and keep mobile drawer behavior intact.
- [x] Adapt AddBeneficiary with `data.mode = "connection"`; test invitation payload
  includes `access_scope: "shared_only"` and legacy payload stays unchanged.
- [x] Use route-local motion styles with reduced-motion overrides for tabs and
  controls. Existing primitive keyboard/focus behavior remains authoritative.
- [x] Run `npm test` for People/layout/invite tests, targeted ESLint, token review,
  and `npm run build`. Inspect in the T3 preview at desktop and narrow web sizes.

## 3. Review and handoff

- [x] Record exact implemented behavior, checks and remaining milestones in
  IMPLEMENTATION_STATUS.md. No deployment, commits or changes to mobile UI.

Verification details and unresolved full-feature requirements are recorded in
`docs/People build docs/IMPLEMENTATION_STATUS.md`. npm ran the existing scripts
because pnpm is unavailable in this environment.
