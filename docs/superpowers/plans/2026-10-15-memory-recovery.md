# Memory recovery implementation plan

**Goal:** Deleted memories have a server-owned 30-day recovery window, a ten-second Undo toast, accurate timestamps, and reliable restoration in every Stories view.

**Architecture:** Atomic database transitions own deletion, restoration, and the irreversible purge claim. A recurring system worker handles expiry and retryable cleanup. Web mutations refresh paginated and infinite lists together; the existing toast and menu primitives preserve keyboard and reduced-motion behavior.

**Stack:** Express, Mongoose, BullMQ, React, SWR, Sonner, Vitest.

- [x] Add lifecycle integration tests in `api/test/memory/lifecycle.test.ts`: ownership, unchanged creation time, deletion time, stable deadlines, restore, expiry, purge/restore exclusion, legacy backfill, shared attachment preservation.
- [x] Implement `api/src/services/memory-lifecycle.ts`, model metadata, migration, and controller service integration. Return updated documents; retain ownership checks and reject restoration after expiry.
- [x] Register a recurring system job that initializes legacy windows and purges expired memories with retryable cleanup. Preserve files referenced by other memories, messages, capsules, or shared items.
- [x] Add web lifecycle tests in `src/api/memory-lifecycle.test.ts` for DELETE body, failed envelopes, SWR list/infinite cache invalidation, and restore. Wire delete confirmation and ten-second Undo toast; guard duplicate requests.
- [x] Add deletion status to list/grid/mobile views with server timestamps and remaining recovery time. Add menu tests for restoration and irreversible deletion. Deleted memories must not open an unavailable active detail page.
- [x] Run focused API tests, TypeScript compilation, contract checks, web tests, scoped lint, production build, and a browser delete/Undo/restore flow using disposable fixtures.
- [x] Document worker/migration rollout and provide a user test table with the exact Stories tabs and actions.

Verification commands: `npm test -- test/memory/lifecycle.test.ts` and `npm run compile` in api; `npm test -- src/api/memory-lifecycle.test.ts src/pages/dashboard/stories/components/dropdown.test.tsx src/pages/dashboard/stories/components/deleted-memory-status.test.tsx src/components/modal/memory/delete.test.tsx` and `npm run build` in web.
