# Shipping validation — 16 October 2026

Checks ran in isolated worktrees. No deployment, live migration, hosted-storage deletion, payment or new browser acceptance run is claimed by this shipping pass. Original mixed Web/API checkouts remain untouched.

## API

| Layer | Fresh pre-push checks |
|---|---|
| About (#87) | Formatter, lint, TypeScript build, contracts and 18 focused tests passed |
| Customer flag tests (#88) | Formatter, lint, build and 2 authentication/isolation tests passed |
| Narration (#89) | Formatter, lint, build, contracts and 9 focused tests passed |
| Memory recovery (#90) | Formatter, lint, build, contracts, 12 lifecycle/list tests and 35 voice-action/Undo regressions passed |

API application source on shipping recovery tip `f67b036` is byte-identical to the previously fully tested second-pass application source `1e2fa9f`. That complete run passed **143 suites, 763 tests**, with 3 suites/4 tests skipped. It is prior combined evidence, not a new full run for every shipping PR. The independent flag-test PR is intentionally outside the feature stack. API lint reports existing warnings (143), with no errors.

## Web

All layers passed fresh `npm run lint` followed by `npm run build`, then their changed-file focused suites:

| Layer | Focused tests |
|---|---|
| Shared UI/session (#74) | 33 suites; 161 passed |
| Profile/billing (#75) | 10 suites; 85 passed |
| People (#76) | 14 suites; 48 passed |
| Continuous Chat (#77) | 18 suites; 90 passed |
| Stories/capture/search (#78) | 35 suites; 306 passed, 10 skipped |
| Dashboard/utilities (#79) | 16 suites; 103 passed |
| Local preview | 4 suites; 27 passed |

Fresh full combined run on Web shipping application tip `7a883e60`, rebuilt on dev `7c75e134`: **323 passed (323) suites; 1708 passed | 10 skipped (1718) tests** (`npm test -- --maxWorkers=1`). The 10 skipped cases are not counted as passed.

Production bundle inspection checked 17 JavaScript files: no preview UI, installer or fixture markers (`New user preview`, `Dev Admin Tools`, `preview-prompt-`, `installPreviewAxios`). DEV import guards remain in the application entry point and both API transports. Source differences from the earlier prepared application are limited to upstream admin removal and the preserved spoken-reply test stabilization.

Web lint has existing warnings and no errors. The Vite build has existing chunk-size/browser-baseline/PDF import warnings; it is not a standalone TypeScript or performance certification.

## Review boundaries

Each branch was checked for whitespace errors, clean working tree and merge conflicts against fetched dev before pushing. PR bases isolate each incremental layer. GitHub mergeability is a point-in-time observation and must be rechecked after changes to dev. Web #74 runs hosted PR validation. Its first run caught seven stale backdrop-sensitive assertions in two files that had been assigned to later layers. These were reproduced locally, corrected on the foundation branch (17 affected tests passed), and merged forward without rewriting published history. Each updated branch reran lint/build and affected tests. Stacked feature-base PRs and API PRs showed no registered checks at inspection; local validation does not substitute for reviewer approval.

Docs-only layers run their repository's formatter/lint/build/contract gates as applicable before push; runtime suites are not duplicated for Markdown-only edits.

Real provider/storage readiness, matching API/worker deployment, purge activation, existing mobile compatibility and production SHAs still require staging/release review. The earlier audit records separate historical browser and user-assisted checks. OS reduced-motion acceptance was deferred by the user. Admin panel work remains out of scope.
