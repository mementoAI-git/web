# People implementation — October 11, 2026

The five unique supplied specifications are the product design. The two build
checklist files are identical. User approved adapting the existing beneficiary
invitation flow into a connection invitation.

## Implementation decisions

- Web `/people` now uses the existing dashboard sidebar, Button, Avatar, Tabs,
  Empty, Input and story viewer.
- Beneficiary invitations create directional accepted relationships. Preserve
  legacy records and access settings; expose accepted relationships in both
  directions and deduplicate by user pair. New People invites use `shared_only`
  access through the same invite/accept/resend endpoints.
- Referral invites create signups only; they do not establish a connection.
- Groups contain beneficiary IDs. Stories already reference beneficiaries and
  groups and have explicit `everyone` visibility. Private is represented by no
  recipients/groups and no everyone flag, rather than the visibility field alone.
- Resolve Our Space from live story permissions, restricted to the two owners.
  Never derive access from legacy vault scope alone. Read current group membership
  on every request; exclude drafts, deleted sources and AI conversations.
- Add one small SharedSpace record with a unique canonical user pair. Existing
  accepted relationships resolve their space lazily; new `shared_only` invitations
  create it at acceptance. No bulk migration required.
- Existing personal AI routes do not implement the required owner/viewer privacy
  boundary. Do not connect People Talk to those routes or infer activation from
  account existence. Talk now uses separate viewer-owned storage and explicitly
  approved connection-facing context.

## Implemented first build milestone

1. Add People read APIs for accepted connections, outgoing pending invites and
   paginated shared stories; authorize every workspace read against live accepted
   relationships. Preserve author, source ID/date and sharing route.
2. Adapt the existing invite modal with an explicit connection mode. Leave its
   legacy mode intact. Default connection mode to shared items only.
3. Build the route-specific global icon rail, searchable People sidebar, default,
   pending, loading/error and selected relationship states.
4. Build Our Space's chronological stream, content filters and original-memory
   links. Reuse existing story creation/sharing entry points.
5. Verify access revocation, source deletion, group membership, symmetric space
   identity, pending isolation, invite payloads and keyboard navigation.

## Verification

- 34 targeted web tests pass: People (7), connection/legacy invite (2), acceptance
  copy (2), dashboard layout (10), sidebar behavior (13).
- 21 backend tests pass: People/invitations (10), beneficiary scope (3), existing
  memory authorization regressions (8). Mail transport is mocked in tests.
- Backend TypeScript compile and web production build pass. Targeted frontend
  lint has no errors; backend lint has no errors and eight existing warnings.
- The separate full web TypeScript check still reports 161 existing repository
  errors outside the new People modules; production build uses Vite.
- T3 browser checks at 1280×800 and 390×844 confirm accepted connections, real
  shared stories, working tabs, invitation copy, narrow-layout navigation and no
  horizontal overflow. Backend-restart failures recover through Try again.
- Source bodies are sanitized for preview. Opening a source rechecks permissions
  through the existing viewer. Media filters apply before pagination.
- New route contract: `API_CONTRACT.md` in this folder (also mirrored in the
  backend’s local, ignored `docs/frontend/people.md`).

## Completion build

- Added reciprocal sharing, the four-action Add something menu, direct notes and
  uploaded/recorded media. Existing memories are shared by reference.
- Added shared detail, provenance, media previews, known shared timestamps,
  timeline overflow actions and author-only removal that preserves originals.
- Added private relationship labels, privacy help, counts, symmetric connection
  removal, persistent blocking and blocker-only unblock. Invitation create,
  acceptance and resend respect blocks; reconnection requires fresh acceptance.
- Added explicit owner-only activation controls with private/ready/active states,
  approved base context and deactivation without removing shared memories.
- Added private text Talk, validated source citations, selected-memory context,
  request deduplication and current permission/context checks before and after AI
  generation. Conversations remain separate from personal memories and messages.
- Added browser dictation and spoken turn-based calls with explicit microphone
  start, stop/unmount/deactivation cleanup and unsupported-browser text fallback.
- Added isolated local People preview handling and optional development fixtures.
  New-user preview remains empty; simulated Talk replies are labeled as preview.

## Completion verification and remaining QA

- 67 targeted frontend tests pass, covering People, activation, settings,
  contributions, Talk, speech cleanup, invitation/acceptance, layout/sidebar,
  preview isolation and dialog focus restoration. 41 backend tests pass across
  nine files, including authenticated HTTP checks with disposable MongoDB data.
- Backend TypeScript compile and frontend production build pass. Changed People,
  preview, recorder and new HTTP test files have no lint errors or warnings;
  the broader backend check retains four pre-existing warnings in legacy files.
- Full frontend app TypeScript check still has 161 pre-existing errors outside
  the People/preview changes. Vite build is separate and succeeds.
- Collaborative browser checks passed at 1280×800 and 390×844 using isolated
  fixtures: active/inactive Talk, selected-memory handoff, note contribution,
  activation/deactivation, settings, dismissal and keyboard focus restoration.
  No horizontal overflow was found. Theme variables and active-tab contrast were
  checked in Light, Dark, Light sky and Deep sky. Screenshot capture remains
  intermittent, so a final pixel-level visual review is still outstanding.
- Fixed separately mounted dialog focus restoration and normalized the reused
  recorder's remaining palette classes to semantic theme tokens.
- The matching backend is deployed to development (`dev.mymemento.io`) at
  commit `69c2747abc8fc3c955f3414e37939e0e5b0aacce` through
  [PR #60](https://github.com/mementoAI-git/api/pull/60) and the successful
  [development workflow](https://github.com/mementoAI-git/api/actions/runs/38176384445).
  Full local and CI backend checks passed: formatting, lint (existing warnings),
  build, API contracts and 546 tests (one skipped). Authenticated People, activation
  and blocked-list reads return 200; unauthenticated People returns 401. Readiness
  reports MongoDB, Redis, storage and worker healthy. The local web preview loaded
  the account's real connection list without the previous route error.
- A live AI smoke test using synthetic approved/shared context returned valid
  JSON and the correct citation. Email delivery, media processing, actual browser
  microphone and playback still need service-connected QA. Voice currently uses browser speech services,
  not a realtime Gemini Live call. Retrieval is bounded to newest 30 sources plus
  an explicitly selected shared source; broad semantic archive retrieval is not added.
- Mobile source/navigation are untouched. Shared backend legacy shapes and scope
  tests pass; device-level mobile regression remains a separate check.

The supplied acceptance checklist remains the product definition of done. This
build implements the requested feature set; external-service, visual and device
QA above are still required before calling the complete feature release-ready.

## UI second pass

- Added a welcome composition with sharing guidance and an explicit privacy note.
- Framed the selected workspace with semantic neutral surfaces, an inset shell,
  a clearer relationship header, and a compact privacy badge.
- Grouped the chronological archive into one surface with separated story rows;
  refined filters, selected connection rows, source spacing and empty/error panels.
- Fixed the active line-tab foreground in dark appearances and supplied the missing
  local underline geometry. Existing focus and reduced-motion behavior is retained.
- Browser reviewed Light, Dark, Light sky and Deep sky at desktop size; selected
  workspace and Back to people also checked at 390×844 without horizontal overflow.
- 30 People/layout/sidebar regression tests pass. Targeted ESLint and production
  build pass. All variables applied correctly.
- This pass is presentation-only; connection permissions and API behavior are unchanged.


## UI simplification and component alignment

- Fixed the legacy invite surface to use semantic theme colors. Connection
  invitations omit the optional group picker; beneficiary mode retains it.
- Reused shared Button/Input primitives with the existing 44px form-control
  height and 8px corners. Floating dialog/modal shells use a shared 16px radius,
  matching command search, including existing custom floating shells.
- Reduced repeated copy in welcome, settings, contribution actions and Talk.
- Memento availability prepares an owner-only introduction from existing About me
  or profile data, with a name-only fallback. It opens in review mode; editing is
  optional. Enable is explicit and no draft is saved on load. Previously approved
  context is preserved. Private chats, inferred persona notes and private memories
  are never used for this draft. Supporting privacy details are expandable.
- Verification: 49 targeted tests passed across 14 files, targeted ESLint passed,
  Vite build passed. Full app typecheck retains 161 unrelated existing errors;
  no errors in changed files. Browser DOM/style checks verified 16px modal corners,
  44px controls, themed surfaces and a 390px layout without horizontal overflow.
  Screenshot capture still fails in the collaborative preview, so pixel-level
  review is outstanding. No live invitation or activation was submitted during QA.
