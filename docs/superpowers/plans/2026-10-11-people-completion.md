# People completion implementation plan

> Execute inline, sequentially, using executing-plans. The supplied People specs
> and the user's approved remaining-feature audit define design and scope.
> Preserve unrelated workspace changes and the mobile repository.

**Goal:** Complete People contributions, management, activation and private Talk.
**Architecture:** Keep existing memory/file sources and live sharing permissions.
Resolve safe reciprocal recipients only after accepted-relationship authorization.
Reference sources with provenance metadata; never use that metadata as an access
cache. Add relationship management to canonical SharedSpace. Isolate Talk storage
and retrieval by viewer so owner chats and identity extraction never ingest it.
**Stack:** Existing Express/Mongoose, React/SWR, shadcn primitives and Gemini.

## 1. Contributions and reciprocal sharing
- [x] Add backend tests in `api/test/people/contributions.test.ts`: incoming
  participant can share an owned memory, concurrent recipient creation deduplicates,
  foreign/draft sources and pending relationships fail, legacy scope stays intact,
  source revocation removes access and duplicate sharing creates no memory copies.
- [x] Add `api/src/module/api/people/connection.ts` and `contributions.ts`, source
  reference model and validated create/share/detail/remove routes. Reuse
  `memory.createMemory` and file ownership checks; keep existing feature gates.
- [x] Extend `people/service.ts` response with source type and known shared date.
  Media filters remain server-side; notes identify explicit note contributions.
- [x] Add the four-action dialog, direct composer using existing uploader/recorder,
  owned-memory picker, shared detail, media previews and permitted remove actions.
  Wire both Add something and Leave something to the selected person.
- [x] Run backend People/access tests and web People interaction tests, lint,
  compile/build.
- [x] Check desktop/narrow interaction flows and theme variables with isolated
  fixtures in the collaborative browser.
- [ ] Finish screenshot-based visual review; capture remains intermittent.

## 2. Connection management
- [x] Test participant-only label updates, symmetric removal, block persistence,
  disabled interactions, revoked original-memory access and reinvitation prevention.
- [x] Add settings/help, viewer-specific labels, contribution counts and explicit
  remove/block controls. Preserve underlying sources and disable accepted grants.
- [x] Verify invitation/group and legacy scope contracts through backend tests.
- [ ] Run mobile device-level regression; mobile source/navigation untouched.

## 3. Activation
- [x] Add owner-only opt-in approved-base-context controls, ready/active/private
  state and deactivation. Test default private, no implicit activation and preserved
  Shared Spaces. Show truthful connection availability in People.

## 4. Talk
- [x] Add viewer-owned transcript storage, active/accepted/block checks and bounded
  current approved context retrieval. Test private-source exclusion, revoked/deleted
  exclusion, cross-viewer denial, owner-transcript denial and citation validation.
- [x] Wire text and supported voice interfaces to dedicated connection routes;
  never reuse owner personal context/session state. Inline citations open the
  current permitted shared source. Deactivation hides composer immediately.

## 5. Integration
- [x] Add People preview fixtures/transport support, contract docs and mail tests.
  Run meaningful access, contribution, settings, activation and Talk regression
  checks. Document any external-service QA that cannot be performed locally.

## Final verification — October 11

- Backend: 39 tests across eight files pass; TypeScript compile passes. Targeted
  GTS check has no errors and four existing warnings in beneficiary/user files.
- Web: 65 targeted tests pass, plus the added embedded-recorder regression (three
  contribution tests pass). Vite production build passes; targeted People/preview
  lint has no errors or warnings. Full app typecheck retains 161 unrelated existing
  errors; none in People/preview modules.
- Source changes, visibility revocation, deactivation, blocking, request retries
  and reconnection are checked with isolated database tests. No live email or AI
  calls were made. Native microphone/playback and production media processing
  remain service-connected QA; browser speech is turn-based, not Gemini Live.
- Contract and staged status updated in `docs/People build docs`. The original
  supplied acceptance specifications remain unchanged. No commits, deployment,
  hosted fixes or mobile edits performed.

## Integration continuation

- Added two authenticated HTTP tests against disposable MongoDB, exercising the
  real People router, guard, DTO validation, ownership, private Talk and blocking.
- Browser review at 1280×800 and 390×844 confirmed active/inactive Talk, source
  handoff, note contribution, activation/deactivation, settings and no overflow.
  Theme contrast checked in Light, Dark, Light sky and Deep sky.
- Reproduced dialog focus loss with a failing test, then added scoped focus
  restoration for every People dialog. Browser Escape dismissal restores focus.
- Latest verification: 67 frontend tests, 41 backend tests; backend compile and
  frontend build pass. New/changed targeted lint checks have no errors/warnings.
  Full web app typecheck retains 161 unrelated errors.
- One live provider test with synthetic data returned valid scoped JSON and a
  matching citation. Actual email, microphone/playback, processed media, mobile
  device QA remain external checks. Hosted development backend deployment is now
  verified below. Screenshot
  capture is still intermittent. Review fixtures were cleared after checks.


### Development deployment

- [x] Deploy the matching People backend to `dev.mymemento.io` through PR #60.
- [x] Verify full local and CI gates: formatting, lint, build, contracts and
  546 backend tests passed (one skipped).
- [x] Verify release `69c2747abc8fc3c955f3414e37939e0e5b0aacce` via
  https://github.com/mementoAI-git/api/actions/runs/38176384445.
- [x] Check authenticated live People, activation, blocked list, shared space,
  settings and Talk history reads. Confirm unauthenticated People returns 401
  and readiness reports MongoDB, Redis, storage and worker healthy.
- [x] Confirm the local web preview loads real connections without the prior
  route error. Live account checks were read-only; service-connected writes and
  device QA remain outstanding.
