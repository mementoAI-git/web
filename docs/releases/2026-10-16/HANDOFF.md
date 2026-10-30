# Memento shipping handoff — 16 October 2026

These are the current shipping PRs for customer Web and API work. They replace the earlier local `feat/*` preparation plan. All remain open for review; this task has not merged or deployed them. Admin-panel implementation is excluded. Original mixed working directories remain untouched on `feature/web-edge-cases`.

## PR inventory

| Repository | PR | Branch | Review base | Changes |
|---|---|---|---|---|
| API | [#87](https://github.com/mementoAI-git/api/pull/87) | `pr/api-about-limit-20261016` | `dev` | Allow 2,000-character About me and onboarding descriptions |
| API | [#88](https://github.com/mementoAI-git/api/pull/88) | `pr/api-customer-flag-tests-20261016` | `dev` | Test customer flag authentication and account isolation |
| API | [#89](https://github.com/mementoAI-git/api/pull/89) | `pr/api-spoken-replies-20261016` | `pr/api-about-limit-20261016` | Add authenticated narration of exact Chat replies |
| API | [#90](https://github.com/mementoAI-git/api/pull/90) | `pr/api-memory-recovery-20261016` | `pr/api-spoken-replies-20261016` | Add 30-day memory recovery and durable expired-memory cleanup |
| API | [#91](https://github.com/mementoAI-git/api/pull/91) | `docs/api-shipping-handoff-20261016` | `pr/api-memory-recovery-20261016` | Document customer API shipping order and rollout gates |
| Web | [#74](https://github.com/mementoAI-git/web/pull/74) | `pr/web-session-ui-20261016` | `dev` | Harden shared UI, authentication and onboarding recovery |
| Web | [#75](https://github.com/mementoAI-git/web/pull/75) | `pr/web-profile-billing-20261016` | `pr/web-session-ui-20261016` | Improve profile settings and billing recovery |
| Web | [#76](https://github.com/mementoAI-git/web/pull/76) | `pr/web-people-20261016` | `pr/web-profile-billing-20261016` | Integrate People, shared spaces and connection recovery |
| Web | [#77](https://github.com/mementoAI-git/web/pull/77) | `pr/web-chat-recovery-20261016` | `pr/web-people-20261016` | Harden continuous Chat, voice settings and playback recovery |
| Web | [#78](https://github.com/mementoAI-git/web/pull/78) | `pr/web-stories-recovery-20261016` | `pr/web-chat-recovery-20261016` | Improve Stories, capture, uploads and deleted-memory recovery |
| Web | [#79](https://github.com/mementoAI-git/web/pull/79) | `pr/web-dashboard-20261016` | `pr/web-stories-recovery-20261016` | Harden Overview, Explore, quick tools and public flows |
| Web | [#80](https://github.com/mementoAI-git/web/pull/80) | `pr/web-local-preview-20261016` | `pr/web-dashboard-20261016` | Add development-only state preview tooling |
| Web | [#81](https://github.com/mementoAI-git/web/pull/81) | `docs/web-shipping-handoff-20261016` | `pr/web-local-preview-20261016` | Document Web acceptance checks and staged shipping plan |

The API customer-flag tests are independent and target `dev`. The other API feature PRs form a stack: About → spoken replies → memory recovery → documentation. Web forms a stack in the order shown, followed by documentation. Each later branch contains earlier commits; review its incremental diff against its listed base.

## Latest upstream reconciliation

API was rebuilt on `origin/dev` `53e240c`; Web on `origin/dev` `7c75e134`. Origin was fetched before each push and local merge-tree checks passed. The customer flag provider is already upstream in Web PR #73, so no duplicate provider PR was created. Upstream removal of admin routes, exports, menu and provider is preserved. The spoken-reply test stabilization is retained alongside the new audio implementation. The foundation PR also corrects backdrop-sensitive test targeting and increases the hosted test-step budget to 20 minutes after the full passing suite exceeded the prior ten-minute limit. No staff/admin implementation is added by these customer diffs.

These Git refs do not establish the version currently deployed to production. Confirm deployed API, worker and Web SHAs before promotion.

## Merge and rollout order

1. Review the independent API flag tests and the first API/Web layers. Required local gates are documented in VALIDATION.md. Web #74 runs the hosted PR validation workflow; stacked feature-base PRs do not register that workflow. Check the latest result before merging; local results are not hosted CI approval.
2. Merge stacks from bottom to top. After each merge, fetch `dev`, retarget the next PR to `dev`, and inspect its diff. If using squash/rebase merges, transplant only the remaining commits onto updated dev; do not merge a stale stack tip wholesale. Re-run gates after any rebase/conflict resolution. Do not force-push collaborators' branches.
3. API About (#87) must be available before releasing expanded Web About/onboarding input. Confirm the existing People API is deployed before Web People (#76). API narration (#89) is required for Web spoken replies (#77). API recovery (#90), its migration and matching worker are required for Web deleted-memory recovery (#78).
4. A merge to dev can trigger existing development deployment automation. Coordinate API/worker versions and environment settings with the collaborator before merging. Do not equate an open, conflict-free PR with production approval.
5. Exercise real services in development/staging: upload/read stored files; narration success/failure/cancel with the configured provider; delete/Undo/restore/deadline behavior; People access and blocking; current mobile-client compatibility. Earlier browser evidence and mocked tests have different scopes; see the audit and VALIDATION.md.
6. Confirm the deployed baseline, database/storage backup and environment settings, then promote through the existing dev-to-production workflow. Monitor request failures, queues and cleanup retries. Ordinary code rollback cannot recover physically purged files.

## API configuration and irreversible cleanup

Narration uses `GEMINI_TTS_MODEL_VERSION` and configured Gemini credentials. Confirm model availability, entitlement and quota in the target environment; mocked provider tests do not verify them. Keep server secrets out of commits and do not replace hosted environment files with local ones.

Read API `agents/memory-recovery-rollout.md` before merging #90. Migration `202610150001_memory_recovery_window` grants legacy deleted memories a fresh 30-day window. Server timestamps govern new deletion and recovery deadlines. Restore is denied at expiry or after a purge claim. The scheduler registers automatically when the system queue is available and runs every minute; there is no separate rollout flag. API and system worker must ship together. Validate purge/retry/shared-file protection using disposable records and storage before production. Do not add a TTL index that removes records before object cleanup.

## Optional tooling and exclusions

The Web local-preview PR is development-only tooling, not the separate admin panel. It is optional in product scope, but the documentation branch above it includes its ancestry; to omit it, recreate the docs branch directly from the dashboard branch and verify again. The production build was checked for preview UI, installer and fixture markers.

People and description-search server implementations already exist in API dev; older local copies were not reapplied. Original dirty checkouts, prepared `feat/*` stacks, verified bundles and backups are retained for reference. The unique inactive legacy composer patch remains outside the active app. Mobile and the separate admin repository remain outside this shipping batch.

The earlier preparation documents in this folder are historical where explicitly marked. Their local branch names and no-push statements do not describe the current shipping PRs above.
