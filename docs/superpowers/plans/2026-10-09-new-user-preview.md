# Local New-user Preview Implementation Plan

**Goal:** Replace global data hiding with a fresh, interactive post-onboarding preview on each activation.

**Architecture:** A DEV-only `PreviewSession` owns temporary domain records and resolves API requests. Axios adapters and a scoped fetch interceptor route supported requests to that session. The provider supplies an isolated cache, profile, storage, and route lifecycle.

**Tech stack:** React, TypeScript, SWR, Axios, Vitest, Testing Library, T3 collaborative preview.

### 1. Session and request transport

- [x] Add adjacent tests for fresh profile/collections, starter prompts, story writes, Chat creation/replies, unknown writes, pagination, and resetting through a new session.
- [x] Run `npm test -- src/dev/preview-session.test.ts src/dev/preview-transport.test.ts` and confirm missing behavior fails.
- [x] Implement `src/dev/preview-session.ts`, `preview-fixtures.ts`, and `preview-transport.ts`; register Axios adapters through DEV-only imports in `src/api/fetcher.ts` and `src/api/client.ts`.
- [x] Verify transport tests prove real requests are bypassed during preview and unchanged when inactive.

### 2. Provider and toolbar

- [x] Add provider tests using real SWR hooks: loaded starter data, temporary profile, existing Chat redirect, switching off restoration, and repeated fresh activation.
- [x] Replace middleware in `src/dev/admin-tools.tsx` with session lifecycle, isolated SWR cache, local storage interception, and a scoped store value provider from `src/hooks/use-store.tsx`.
- [x] Move the DEV provider in `src/main.tsx` above modal/Chat/subscription providers, inside the root SWR config, so dialogs share the preview boundary.
- [x] Use the existing toggle recipe in `src/dev/admin-tools.css` with switch semantics, focus treatment, and reduced-motion support.

### 3. Verification

- [x] Run adjacent session/transport/provider tests plus affected existing fetcher, store, host-chat entry, Overview, and Chat tests.
- [x] Run ESLint on changed files and a production build. Inspect build output for DEV-only strings/modules.
- [x] Use the T3 preview to toggle Overview, inspect starter cards, simulate a story, enter Chat and send a local message, disable and re-enable, and confirm a fresh Chat panel returns.
- [x] Report the implemented behavior and any verification limits. Leave unrelated changes intact; do not commit or push.

### Completed verification

- 168 tests passed across 27 focused test files, including session/transport/provider regressions, normal fetcher authentication, store behavior, Overview, Chat, Stories, and delayed upload/deletion callbacks after a preview remount.
- ESLint passed for all changed TypeScript files; `git diff --check` passed.
- Production build passed. Searching emitted JavaScript/CSS found no preview modules, toolbar labels, sample prompt IDs, or dev toggle keyframes.
- The shared T3 browser verified Overview starter cards, a local story save, and first-use Chat. When its host disconnected, an isolated headless Playwright check completed existing-thread entry, two local Chat replies, repeated fresh activation, normal draft/cache restoration, and local story lifecycle. It recorded zero API writes and zero browser errors.
- Full TypeScript checking still reports existing project errors (including unused directives and the missing AxiosProgressEvent import in the pre-existing fetcher code). No errors were reported for the new preview modules or new upload lifecycle tests.
- Text Chat uses sample replies. Live voice credentials are blocked for GET and POST. Unsupported account actions are explicitly blocked. FileReader callbacks retained by unmounted screens cannot start uploads into the restored normal account.
- No commits or pushes were made. Existing unrelated workspace changes were preserved.
