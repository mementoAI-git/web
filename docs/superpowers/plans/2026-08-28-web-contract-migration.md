# Web Canonical Contract Migration Plan

**Goal:** Migrate the web app to the additive canonical API/session/media
contracts while retaining dual parsing for supported legacy API deployments.

**Architecture:** Normalize transport data at the API boundary. Screens keep
their current domain-facing shapes while one adapter preserves structured
errors and extracts an atomic session from canonical or legacy auth responses.
All HTTP paths send bounded web client metadata. Signed attachment refresh is
centralized and retries once.

## Task 1: Contract adapter, pinned types, and client identity

**Files:**
- Create `src/api/contract-adapter.ts`
- Create `src/api/contract-adapter.test.ts`
- Create `src/api/client-metadata.ts`
- Create `src/api/client-metadata.test.ts`
- Create `src/api/generated/memento-api.ts`
- Modify `src/api/interface.ts`, `src/utility/interface.ts`
- Modify `src/api/client.ts`, `src/api/fetcher.ts`

- [x] Red-test canonical/legacy success, atomic session extraction, and error preservation.
- [x] Add `X-Memento-Client`, version, and build to both Axios clients.
- [x] Prefer `data.session`; retain legacy parsing and existing domain envelopes.
- [x] Preserve `code`, `details`, `request_id`, validation arrays, gate data, and HTTP status.
- [x] Run focused tests, lint, typecheck/build, then checkpoint.

## Task 2: Atomic authentication migration

**Files:**
- Modify `src/utility/auth-service.ts` and tests
- Modify login, 2FA, passkey, OAuth callback, and verification pages/tests
- Modify raw authenticated helpers and store hydration

- [x] Make refresh single-flight and canonical/legacy aware.
- [x] Store complete sessions atomically without overwriting refresh/user fields.
- [x] Apply client headers to raw fetch auth paths.
- [x] Preserve verification-only registration and 2FA intermediate responses.
- [x] Verify login, refresh, logout, 2FA, passkey, OAuth, and verification tests.

## Task 3: Signed attachment access

**Files:**
- Create `src/api/media-access.ts` and tests
- Modify shared image/audio/video/file preview components

- [x] Model durable attachment identity and access metadata.
- [x] Refresh expired/failed signed URLs through `access.refresh_endpoint` once.
- [x] Never retry unrelated provider/image failures indefinitely.
- [x] Preserve legacy attachments without access metadata.

## Task 4: Public memory and capsule routes

**Files:**
- Modify `src/pages/post/index.tsx`, router, endpoint constants, and tests
- Create external capsule token-exchange/view route and tests

- [x] Consume the safe public-memory DTO instead of private memory assumptions.
- [ ] Exchange capsule grants without persisting bearer tokens in route URLs.
- [ ] Keep existing internal capsule routes operational.

## Task 5: Domain normalization and Polar-only billing

**Files:**
- Modify pagination/context/prompt/capsule adapters and tests
- Modify `src/features/pricing/**`, billing settings, endpoint comments/types

- [x] Normalize paginated and non-paginated response variants at query boundaries.
- [x] Preserve structured subscription/quota errors.
- [x] Remove Paystack from client-facing billing types and documentation assumptions.
- [x] Normalize Polar subscription, usage, invoices, cancel, and resume results.

## Task 6: Release verification

- [x] Run `pnpm test`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm exec tsc --noEmit`.
- [x] Run `pnpm build`.
- [x] Run `git diff --check`.
- [ ] Record staging acceptance for supported API/web combinations without tokens.
