> Historical preparation record, before shipping reconciliation. See HANDOFF.md for current PRs and upstream state. In the shipping branches, upstream admin removal is preserved and Web customer flags are already merged.

# Preserved work outside the prepared customer release

No original files were deleted or reset. Frozen working-file snapshots, patches and manifests are stored beside this document. These are local recovery artifacts, not deployment inputs; do not bulk-commit them.

## API

**Second-pass update:** API dev advanced from `6c5dedc` to `53e240c` through the separate staff-console merge. Its staff implementation and customer flag endpoint are now inherited unchanged from the base; they are not new changes in this package. The table below records first-pass dispositions against `6c5dedc`, not a request to undo code now merged upstream. The current customer flag branch is test-only.

58 snapshot files already match the fetched dev branch exactly, primarily People and memory-search implementation/tests. The integrated code is based on dev and deliberately preserves its newer embeddings, voice tooling, environment loader, operational routes and cache invalidation. See `api-inventory-review.json` for the complete file list.

| Remaining snapshot file | Disposition |
|---|---|
| `agents/memory-search-developer-review-plan.md` | Historical search planning notes retained in snapshot; superseded by current dev implementation. |
| `agents/memory-search-integration-plan.md` | Historical search planning notes retained in snapshot; superseded by current dev implementation. |
| `agents/staff-console.md` | Excluded staff/admin migration; keep existing dev behavior. |
| `ops/memory-search/Dockerfile` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `ops/memory-search/build-linux.sh` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `package.json` | Local staff command excluded; retain dev embedding dependencies and scripts. |
| `src/docs/staff.docs.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/middleware/admin.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/middleware/staff.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/beneficiary/service.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `src/module/api/index.ts` | Staff routing excluded; preserve dev operational metrics route. |
| `src/module/api/staff/controller.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/crypto.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/operations-controller.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/operations-service.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/provision.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/routes.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/service.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/api/staff/validator.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/database/model/staff-account.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/database/model/staff-audit.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/module/database/model/staff-session.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/scripts/staff-account.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `src/services/memory-search/config.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `src/services/memory-search/engine.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `src/utils/runtime-config.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `src/workers/index.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `test/config/runtime-config.test.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `test/contracts/openapi.contract.test.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/memory-search/engine.test.ts` | Older local version superseded by newer dev cache, environment, embeddings or search implementation; retain dev. |
| `test/security/admin-middleware.test.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/security/bull-board.test.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/setup.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/smoke/readiness.test.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/staff/access.test.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/staff/operations.test.ts` | Excluded staff/admin migration; keep existing dev behavior. |
| `test/staff/preview.ts` | Excluded staff/admin migration; keep existing dev behavior. |

Only customer additions were applied on top of current dev in mixed files: narration config/docs, recovery migration and memory/queue behavior. Upstream staff endpoint/model/config/migration code is preserved; no separate staff changes are added by this release stack.

## Web

Staff/admin feature-flag components, provider migration, admin routes/tests and AI-health pages are excluded. Existing Web dev administrative components/routes/providers remain in the prepared app. The separate admin repository and legacy admin compatibility are explicitly outside this review; see HANDOFF.md. `.DS_Store` and `.impeccable.md` are local artifacts/context and remain in the original checkout/snapshot.

The separate dirty `feature/memory-description-search` worktree remains untouched. Its unique legacy `src/components/modal/memory/create/index.v2.tsx` upload-readiness/retry changes are preserved in `web-legacy-composer.patch`. That file is not the active composer; this patch is for separate review, not automatic cherry-picking. Overlapping changes were taken from the newer primary checkout.

`src/dev/admin-tools.tsx` is the existing development-only preview tool, not the excluded staff dashboard. It is isolated in the optional Web local-preview branch. Verify production build exclusion when changing its DEV guards.

The existing `src/contexts/feature-flags.test.tsx` is retained from dev because its administrative helper remains supported. The newer snapshot test assumes the separate staff migration has shipped and is intentionally not used here.

## Other repositories

Mobile and any separate staff-console worktrees are outside scope and untouched. Ignored credentials/environment files and dependency directories are not copied into branches or backups. Account actions performed during prior manual testing are test-data changes, not new server features in this batch.
