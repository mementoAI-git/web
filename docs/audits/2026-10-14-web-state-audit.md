# Memento Web: screen-by-screen state audit

Reviewed 14 October 2026. The initial audit was read-only. Subsequent implementation progress is tracked below.

## Next broad-review checkpoint

Start the next broad review at **Pass 22 — authentication/session, account/privacy and route recovery**. Passes 15–21 were rechecked before this checkpoint; do not restart there unless a new regression warrants it.

## Implementation progress

- **Pass 1 — upload readiness and recovery:** implemented in the registered shared Upload files dialog and the active Add story composer. Submission requires confirmed server file IDs; processing and failed uploads remain blocked. Failed Add story attachments remain visible with Retry/Remove. Failed attachment saving preserves the queue. Existing-story uploads no longer inherit unrelated draft attachments.
- Verified through regression tests, the production build, scoped lint, and a browser simulation of delayed upload, failure, retry, and confirmed success. The browser simulation sent no file to storage. Real storage integration remains a manual acceptance check.
- **Pass 2 — draft/attachment lifetimes:** the active Add story composer removes its discarded local draft before cleaning up newly uploaded, unreferenced files. Restored assets and files referenced by remaining drafts are preserved. Attachment removal updates only the active draft. Pending autosave cannot recreate a discarded draft; discard controls are guarded while cleanup runs. Autosave tracks one active draft on both desktop and mobile.
- Verified with draft cleanup/component tests, build, scoped lint, and local browser fixtures demonstrating attachment detachment, preserved second-draft references, and no draft resurrection. Browser fixtures were removed after verification; no stored user files were deleted.
- **Pass 3 — Stories filtering/pagination:** changing a filter resets the list to page 1. Empty or out-of-range later pages recover to an available page without showing a misleading whole-library empty state. Bookmarked and Deleted have distinct empty copy and View all stories actions in list/grid. Grid filter changes start a fresh pagination scope (`persistSize: false`). Existing tab motion/focus behavior is preserved.
- Verified with 33 Stories/header/grid tests, scoped lint, production build, and browser navigation from All page 2 to Bookmarked page 1, then back to All page 1. Deletion/page shrink is regression-tested without deleting stored user stories.
- **Status:** Final user-facing verification completed in Pass 26. Administration and the flag-provider integration are deferred by user request; the final manual/service checklist remains explicit below.

Scope: every distinct routed screen in `src/router.tsx`, plus the shared overlays used to capture, search, upload, inspect, invite, and manage memories. Redirect aliases are not separate screens. Legacy unrouted screens are excluded.

Evidence: route/component code review and local browser inspection at 1280 × 800. Browser visits included Overview, Explore, category, new/invalid chat, People, Stories, settings sections, Pricing, login, registration, password recovery, invalid public story/invite, capsule without a token, and 404. Some data-dependent screens were still loading during brief visits: these observations are not classified as permanent failures. Authentication, payment, invitation sending, uploads, deletion, and microphone recording were not submitted. No destructive requests or fault injection were performed. Mobile keyboard behavior, real recording interruptions, payment redirects, and screen-reader announcements need dedicated follow-up testing.

**C = confirmed in source or browser. O = opportunity or edge case to validate.** Priority: **P1** blocks work, risks losing work, or misleads users; **P2** improves clarity/recovery; **P3** polish. Priority belongs to the row's most consequential item, not every suggestion in it. “Keep” identifies an existing state worth preserving. All proposed technical-error feedback should follow the requested toast pattern, with recovery controls and retained content where appropriate.

## Dashboard screens

| Screen | Priority | Loading states | Empty states | Interactions | Animations |
|---|---|---|---|---|---|
| Overview: capture card | P2 | Keep separate starting, recording, transcribing, and saving states. O: long-running transcription needs an explicit recovery action; keep old text throughout. | Keep focused-empty and unfocused-placeholder states distinct. O: distinguish a recovered draft from a fresh capture. | Keep local draft persistence and toast errors. O: show that Save now stores a thought while enrichment continues; validate route changes during save and mic permissions after cancellation. | Keep resize/state continuity. O: a short saved-to-default transition should preserve focus and avoid a height jump. |
| Overview: Continue reflecting | P1 | C: prompt fetch has skeletons but does not consume its error; failed data can become “No reflections available today.” Shuffle error is handled separately. | Keep answered prompts and genuine no-prompts state; give the latter an Explore action. | C: missing prompt ID is silently caught, making a card appear unresponsive. O: toast and retain card; announce shuffled content, not only allowance. | Existing reveal replays when prompts change. O: avoid hiding usable cards during shuffle; replace only changed cards with a brief fade. |
| Overview: Explore more topics | P2 | Keep seven skeletons. C: no fetch-error branch. | C: an empty collection leaves a heading, disabled shuffle, and empty rail. Add explanatory copy and See all action. | Keep seven-topic limit and shuffle guard. O: preserve keyboard focus when shuffling/reordering; indicate horizontal overflow without relying on a hidden scrollbar. | O: short content replacement; keep swipe scrolling direct and immediate. |
| Explore categories | P2 | Keep bundled catalog fallback. O: make live-versus-bundled availability understandable without implying that all questions are ready. | O: validate a legitimately empty catalog separately from temporary catalog fallback. | Keep navigable category cards. O: broken artwork should keep the title/target available and use a stable fallback. | O: use one brief first-load reveal; no repeated animation on background refresh. |
| Explore category detail | P1 | C: category resolver returns null while loading, giving a blank content area. Prompt list uses a large spinner. Reserve the heading/list geometry instead. | C: prompt request errors are not consumed and can appear as “No prompts available.” Keep separate All/Answered empty copy. | Keep feedback busy state. O: failed infinite-scroll page should retain earlier prompts and offer Retry; fallback catalog page needs retry in place. | O: small fade for tab content and appended results; keep old rows still. |
| Chat entry `/chat` | P2 | Keep profile-resolution loader and Retry. O: add a slow-request state instead of an indefinite loader. | Keep automatic start-new behavior when no primary conversation exists. | C: Retry reloads the entire app. Prefer retrying the profile request while preserving intent/query state. | No extra navigation delay; resolution should feel immediate. |
| Chat: first Host Chat message | P1 | Keep thinking/streaming states. O: define “taking longer than usual,” interrupted stream, and partial-response states. | Keep suggested first-message actions. | C: `sendChatMessage` returns when text is empty before checking attachments, so the send path rejects attachment-only messages. O: validate composer intent, upload readiness, and draft preservation on failure. | Keep streaming text readable; do not animate every token or scroll users away from older messages. |
| Chat: existing conversation | P1 | Keep history load-more indicator. C: history-fetch failure only logs to console, so users cannot tell why history is absent or stopped. Memory/prompt fetch errors are not consumed by the screen. | C: unavailable conversation lacks an explicit screen-level recovery branch. O: distinguish a valid empty thread from a removed/inaccessible thread. | Keep failed-message retry. O: retry partial streams without duplicating user messages; retain scroll anchor and show a new-message affordance when reading above. | O: subtle insertion of new messages only; no entrance replay for the entire history. |
| Chat: prompt reply | P1 | Same missing fetch recovery as existing chat; preserve question shell while loading. | O: removed/answered/private prompt should have distinct recovery routes, rather than an unexplained blank history. | O: preserve reply draft if prompt access changes or the session expires. | O: question-to-composer continuity; keep reading content stationary. |
| Chat: voice route | P1 | Keep subscription preparation/paywall. O: distinguish permission request, connecting, listening, reconnecting, and closing. | O: if the session produces no transcript, return to text entry without fabricating a completed conversation. | O: test revoked permission, offline/tab sleep, route exit, and playback changes. Preserve transcript; reset active voice UI and toast interruptions. | Keep active-state feedback. O: reduced motion must retain a readable listening/muted status even when waveforms stop. |
| Stories: list and grid | P1 | Keep list skeletons/grid pagination. C: statistics and filter counts render 0 before data arrives; list/grid fetch errors are not handled at page level. | C: All, Bookmarked, and Deleted share “No stories yet” and Add memory. Use filter-specific copy/actions. | C: list page is not reset when filter changes; page 4 can yield an empty bookmark list even when bookmarks exist on page 1. O: clamp page after deletion; keep selected filter and mode. | Existing results reveal is 400 ms, shared text reveal is 500 ms. O: make frequent filter/page changes quicker and avoid a blank fade on background refresh. |
| Story detail | P1 | Keep detail skeleton. C: fetch error redirects to Stories without explaining why; absent memory otherwise keeps a skeleton. | O: distinguish removed, private, invalid, and textless/media-only stories. | C: Share and Bookmark use clickable divs, missing native keyboard button behavior. O: prevent repeated bookmark requests and show save state. | O: animate details panel both in and out while keeping focus/reading position. |
| People directory | P2 | Keep sidebar skeletons, welcome loading, and request retry. | Keep no-connections, no-search-match, and pending-invitation distinctions. O: add a clear-search action to no-match state. | O: if a selected connection disappears during the 15-second refresh, return to the directory with context instead of abruptly losing the workspace. | Existing control feedback is restrained. O: selected-person transition should preserve spatial continuity, especially mobile Back. |
| People: relationship workspace | P2 | O: preserve the person header while shared-space/chat content loads. | Keep guided empty shared-space actions. O: distinguish no contributions from hidden/revoked access. | O: test unsaved contribution when switching people, blocked/deactivated recipient, and failed attachment selection. Contribution dialog currently displays technical error text inline, contrary to the toast direction. | O: bridge shared-space/chat tab swaps; do not reanimate existing cards during refresh. |
| Settings: Personal info | P1 | C: About me does not consume persona loading/error; fallback blank copy can appear before saved bio arrives. O: disable editing until existing data is resolved so an empty draft cannot overwrite it. | Keep a friendly bio prompt and AI-summary empty state. | Keep save guard and summary retry. O: clarify discarding edits on Escape/Cancel; banner image failure needs a stable default and upload/convert/save stages. | O: saved profile values can update with a brief fade; keep avatar/banner position stable. |
| Settings: Security | P1 | Keep passkey loading indicator. C: passkey fetch error is not consumed and can become “No passkeys registered.” | Keep no-passkeys setup guidance; show unsupported-device availability separately. | C, browser confirmed: Change password overlay has no dialog semantics, leaves focus on its trigger, and Escape does not close it. O: confirm deletion of a passkey and handle cancellation of native passkey setup distinctly from failure. | C: password overlay has entry animation but conditional unmount gives no exit continuity. Fix primitive/focus behavior before polishing motion. |
| Settings: Beneficiaries & Groups | P2 | O: preserve counts/list during refresh; distinguish failed fetch from empty membership. | O: separate no beneficiaries, no groups, empty group, and filtered no matches with relevant actions. | O: test removing last group member, duplicate invitations, expired invites, and recipient deletion while dialog is open. | O: localized add/remove feedback; no full-list replay on each edit. |
| Settings: Privacy & Account | P2 | Keep destructive-action busy feedback. O: verify dismissal is prevented or safe during logout/delete requests. | Keep Coming soon labels for disabled export/sharing tools. | O: make unfinished controls explain availability when focused; handle deleting the current account without stranded dialogs or retained sensitive drafts. | Keep destructive confirmations restrained; success navigation must wait for confirmed completion. |
| Settings: Billing | P2 | Keep separate summary/account/invoice loading and failure branches. | Keep no-payment-method and no-invoice states. O: distinguish free account, external/comped Pro, expired plan, and missing customer record. | O: checkout cancelled/returned/pending must refresh status without premature success; duplicate promo redemption and retry need clear outcomes. Technical errors currently appear inline in some cards; align with toast policy. | O: quiet pending-to-confirmed update, never animate prices on every render. |
| Pricing | P2 | Keep disabled checkout while busy and feature availability checks. | O: explicitly label active, external-grant, scheduled cancellation, and unavailable pricing states. | O: dialog can close while checkout work is pending; define safe cancellation behavior. Test return URL, payment provider failure, and plan change with insufficient storage allowance. | Keep a standard dialog transition; make confirmation a readable state, not a celebration that obscures terms. |
| Admin: Feature flags | P1 | C: list request does not consume its error; failed list can look empty. | O: distinguish no search results from no configured flags. | O: row toggle needs a pending guard/rollback; destructive bulk scope should be reviewable. Non-admin denial exists; add a route back. | Immediate table response; only brief local pending-to-saved feedback. |
| Dev: AI health | P2 | Keep overview/time-series loading/error branches. Governance request has no dedicated loading/error display. | Keep no-provider/task data. O: distinguish no traffic from missing metrics and stale observations. | O: add scoped retry/refresh and visible last-updated time. | No animated chart drawing or moving metrics; data is for reading. |

## Authentication, onboarding, and public screens

| Screen | Priority | Loading states | Empty states | Interactions | Animations |
|---|---|---|---|---|---|
| Login | P2 | Keep password/passkey busy states. O: provider navigation or native passkey prompt cancellation should restore controls promptly. | Not a data-empty screen. O: expired-session visit should explain why sign-in is needed. | O: validate redirect preservation, password manager autofill, unavailable passkeys, cancelled Google flow, and repeated Enter. | Keep password visibility icon; do not delay submit or keyboard focus. |
| Register | P2 | Keep submit spinner and disabled button. | Not applicable; preserve partially typed form on network failure. | C: registration permits six-character passwords while reset requires eight; reconcile policy/help copy. O: already-registered email should offer login/recovery without losing context. | Keep restrained field feedback and clear transition to verification. |
| Forgot password | P2 | Keep Send code busy state. O: delayed response/rate limit should have retry guidance. | O: missing email route context should recover to an editable form. | O: preserve email, support Enter, and avoid exposing whether an account exists in delivery copy. | No decorative loading delay; transition only when delivery request succeeds. |
| Check mail / recovery code | P2 | Keep verification/resend busy guards and cooldown. | Missing email redirects correctly. O: offer Change email on a mistyped address. | Keep paste/autofill and digit navigation. O: handle expired code, later code invalidating earlier code, multi-tab resend, and provider rate limit consistently. | A brief success-to-reset handoff; preserve focus on retry rather than re-entering the whole form. |
| Verify email | P2 | Same shared code page; preserve resend cooldown. | Keep already-verified-address handling. | O: changed email, already-used code, and verifying in another tab should lead to a clear next action. | Same code-page behavior; avoid duplicate success animation/toasts. |
| Confirm email | P2 | Keep link-verification loader and resend busy state. | Missing token redirects to login; failure offers a new code. | C: success Continue always links to onboarding, even when the returned session is already onboarded. O: route to the appropriate destination; preserve identity when an old link is opened in an existing session. | O: loader-to-success handoff with heading focus; no duplicate confirmation. |
| Set password | P2 | Keep saving spinner. | Missing token redirects; expired/used token has no dedicated recovery UI in this screen. | O: toast token failure and offer Request a new code while retaining email context. Reconcile password rules with registration. | Keep password icon/field feedback; return to login with one success confirmation. |
| Two-factor login | P2 | Keep verification busy state. | Missing token redirects. O: expired challenge needs restart-login action distinct from invalid digit code. | C: no backup/recovery-code path is shown. O: align partial paste/autofill and input locking with shared email-code page; recover if authenticator is unavailable. | Keep code stable while submitting; no repeated shake/whole-screen reveal. |
| OAuth callback | P2 | Keep signing-in/redirecting loader and failed callback screen. | Missing provider/code redirects. | O: distinguish user-cancelled provider login from network failure; restart provider authorization rather than retrying an already-consumed code. | No extra transition during redirects; focus error heading when recovery is required. |
| Onboarding welcome | P2 | O: Skip should reflect completion persistence, not only a local profile update. | O: delayed profile should not flash a generic identity. | C: Skip only updates store before navigating; validate persistence across reload/new device and guard behavior. | Keep first-run motion brief; buttons remain usable during it. |
| Onboarding nickname | P2 | Keep saving disabled state. | Keep blank-name submit guard. | O: whitespace, very long nickname, emoji/non-Latin name, and failed save should retain input. Existing technical error is inline; align with toast policy. | O: forward/back transitions should indicate direction without moving focused input unexpectedly. |
| Onboarding questions | P2 | Keep revisit loading gate. O: failed saved-details request needs a recoverable path that cannot silently replace existing choices. | O: explain minimum/maximum selection constraints next to the action. | Keep session draft persistence and heading focus on step change. O: corrupted/unavailable storage and closed-tab resume need explicit expectations. | Keep directional continuity and reduced motion; do not replay stagger on every chip selection. |
| Onboarding summary | P2 | Keep save guard/spinner; failed submit retains draft. | O: direct link with an incomplete draft should route to missing step or clearly label skipped content. | Keep completion mutation before navigation. Technical save error is inline; move request failure feedback to toast. | O: one short completion handoff after success; no blocking celebration. |
| Onboarding beneficiaries | P2 | C: invite list reads data without loading/error handling; saved invites disappear while unresolved. | Keep optional skip, but distinguish no invites from failed invite loading. | O: duplicate invite, resend, cancellation, and exiting during send need defined feedback. | O: new invite row appears locally; keep existing rows still. |
| Onboarding chat | P2 | O: distinguish initializing interview, thinking, saving progress, and connection loss. | O: no speech/draft should keep a usable text composer and suggested start. | O: validate skip/resume, unsupported speech recognition, long draft, and failed completion. Do not repeat the introductory conversation after reconnect. | Keep conversational updates localized; no full-screen motion for each message. |
| Public story `/post/:id` | P1 | Keep story skeleton. C: all request errors use unavailable/expired-link copy, including transient failures. | Keep unavailable-story state; separate revoked/removed link from temporary failure. | C: Join Memento button has no handler or link. O: provide a functional signup route preserving public-story context. | O: skeleton-to-content fade, with media dimensions reserved to prevent jumps. |
| Accept invite | P2 | Keep loading invite screen. | Keep missing-invite fallback. O: distinguish expired, revoked, already accepted, and wrong-recipient invitation. | C: fetch failure screen offers no retry/recovery action. O: provide retry for network failure and login/change-account for identity mismatch. | O: loading-to-form handoff; focus heading and first relevant field. |
| Private capsule view | P2 | Keep Opening capsule skeleton. O: show exchange/open slow-request recovery. | Keep missing/expired/used link explanation. | C: all exchange/load failures become expired/used-link copy. Token is removed from URL and held only in memory, so refresh needs explicit behavior. O: explain attachment availability rather than only an attachment count. | C: pulse lacks a local reduced-motion guard; reserve geometry and fade into resolved state. |
| 404 | P2 | No async loading required. | Keep unknown-route explanation and Overview action. | O: direct entry has no useful Back history; fallback Back to Overview/Login. | No looping illustration or decorative motion required. |
| Route error boundary | P2 | Not an ordinary loading state. | Keep recovery screen. | C: labels every route exception “Error 505” and claims automatic notification without checking the error/reporting outcome. O: truthful generic copy, Retry, and safe destination based on session. | Keep static; do not add animation to a recovery-critical screen. |

## Shared overlays and component states

| Surface | Priority | Loading states | Empty states | Interactions | Animations |
|---|---|---|---|---|---|
| App authentication gate | P2 | C: hydration/token-refresh gate returns null. Show a stable app shell/loading status instead of a blank page. | O: cached profile unavailable should not masquerade as an unnamed new user. | O: retain return route and unsaved draft after session expiry; avoid treating transient refresh failure as a successful logout. | No stagger on shell hydration; stabilize content immediately. |
| Search command dialog | P1 | Keep debounce, spinner, and previous results. C: request error is not consumed; failure can become no results or stale selectable results. | Keep no-recent/no-match distinctions. O: no-match should suggest another query or Create story. | O: distinguish raw typed query from settled query so old results do not look current; retain query and retry after toast. Keep focus return. | Pointer-open morph already exists. O: keyboard-open should be immediate/reduced to minimal fade; never delay typing for animation. |
| Add story overlay | P1 | Keep publish disabled during upload/publish. O: distinguish byte upload, server processing, and publishing. | Keep content/title checks; media-only story should have clear requirements. | C: autosaved drafts reference uploaded attachments, while discard deletes uploaded files; revisit can restore stale references. O: reconcile retained drafts with discard cleanup; protect unsaved access/tag choices. | O: preserve dialog geometry through media additions; successful publish gets one brief handoff. |
| Quick capture overlay | P2 | Keep recording, upload, saving, and offline outbox states. | Keep no-content guard and draft picker empty state. | Keep beforeunload guard and local drafts. O: expose queued/syncing/failed/retry status so “Saved on this device” is never mistaken for server-saved. Toast recording errors consistently. | O: queued-to-saved feedback should affect only that item; no full-page refresh/reveal. |
| Shared Upload files overlay | P1 | C at audit time: item derives Ready from progress alone, independently of a confirmed server file result. The shared transport reserves progress 80 for uploaded bytes and 100 for its response; readiness still needs an explicit confirmed-ID invariant. | Keep No files added yet. O: show failed items rather than silently dropping them. | C at audit time: attach button only checks file count/adding, so pending files can be omitted from attached IDs when the dialog closes. Upload rejection has no local catch to resolve item state. Add retry/remove and block incomplete attachment submission. Addressed in Pass 1 above. | O: brief progress-to-ready change; removal should not destabilize neighboring rows. |
| File/media preview | P2 | Signed URL refresh exists. C: image preview has no explicit placeholder or terminal failed-media UI after refresh fails. | O: file removed while preview is open should offer Close/next item. | Keep pausing inactive audio/video. O: retry failed URL, download failure, keyboard previous/next, and unsupported format fallback. | O: quick directional media change; keep controls fixed and respect reduced motion. |
| Insights overlay | P2 | Keep summary loading/error states. O: enrichment, context, and beneficiary requests need independently resolved states rather than default blank/zero content. | O: distinguish insufficient memories, summary not generated yet, filtered no matches, and temporarily unavailable insight. | O: offer capture/reflect from first-use empty state; preserve selected category during refresh. | Keep insights readable; no number-counting or chart drawing just for decoration. |
| Quick tools/music | P2 | O: distinguish playback buffering, blocked autoplay, unavailable track, and loaded-but-paused state. | O: unavailable catalog should retain quick actions. | Keep themed slider/disc playing state. O: playback failure must restore controls and toast; volume needs keyboard and accessible value feedback. | Keep disc spinning only while playing and reduced-motion static disc. No extra controls animation needed. |
| Streak popup | P2 | C: request reads stats without loading/error status; missing stats can show a misleading zero/current-account fallback. | O: true zero-day streak should invite a first reflection without failure language. | Keep daily count/metrics. O: timezone/day rollover, stale cache, missed day, and unavailable restore action need clear expectations. | O: count changes may briefly crossfade; avoid rolling counters on every open. |
| Chat/voice settings | P1 | O: voice preview needs preparing/playing/stopped/failed states and cancellation on close. | O: no available voices/music should not leave unexplained disabled controls. | C: custom desktop dialog has no focus containment/restoration implementation; Escape exists. Hard-coded white fills remain on desktop and mobile. Reuse accessible themed primitives. | C: outer conditional unmount can cut off mobile sheet exit; desktop panel has no explicit entrance/exit motion. Keep same spatial exit as entry. |
| Invite friends / feedback | P2 | Keep invite fetch/copy pending/retry and feedback upload/send controls. | Keep empty invite/error guidance and required feedback guard. | O: validate permission-denied clipboard/share, failed screenshot upload, duplicate submit, and discard while upload finishes. Feedback already has a discard confirmation worth reusing. | O: short attachment insertion/removal and confirmation; do not animate clipboard operations. |
| Banner picker / adjustment / profile edits | P2 | Keep saving disabled state. O: distinguish local WebP conversion, uploading, and profile persistence; show image decode failure. | O: missing custom banner should fall back to preset without losing saved position. | O: drag/range keyboard control, Cancel restores original crop, unchanged Save disabled, and closing during upload must have defined behavior. | O: live crop tracks input directly; dialog entry/exit uses shared recipe, not a delayed crop animation. |

## Highest-priority confirmed findings and evidence

1. **Incomplete upload can be attached and discarded from view.** `src/components/modal/upload-file/index.tsx:68` collects only existing server IDs; `:183` does not disable attach for pending files. `src/components/modal/upload-file/upload-item.tsx:24` treats progress 100 as Ready. Fix the state model before animation.
2. **Stories filter retains the old list page.** `src/pages/dashboard/stories/index.tsx:64` owns page; `:262` passes `setFilter` directly without resetting page. Same generic empty component is used by each filter (`:44`, `:270`).
3. **Password dialog lacks keyboard/modal behavior.** `src/components/modal/settings/security.tsx:45` uses a custom portal instead of the shared dialog primitive. Browser confirmed three password inputs remain after Escape, no role=dialog, and focus remains on the trigger.
4. **Failures masquerade as absence.** Prompts `src/pages/dashboard/overview/sections/daily-prompt-section.tsx:97`; topic rail `browse-topics.tsx:17`; category list `src/pages/dashboard/explore/category-details.tsx:57`; Stories `index.tsx:101`; search `src/components/modal/memory/search/search-modal-v2.tsx:45`; passkeys `src/components/modal/settings/security.tsx:138`. Give request failure its own recoverable state and toast once, while preserving existing content.
5. **Story drafts can retain deleted attachment references.** The original evidence mistakenly cited the unused `create/index.v2.tsx`. Pass 2 fixes and tests draft/attachment lifetime in the active `src/components/modal/memory/create/index.tsx`; its desktop and mobile variants share that implementation.
6. **Chat history failure is silent.** `src/pages/dashboard/chat/conversation/history.tsx:125` only logs; `conversation/index.tsx:193` rejects empty text before attachments. Preserve history/draft and add deliberate recovery.
7. **Public signup CTA is inert.** `src/pages/post/index.tsx:28` renders a button without action. Story-detail share/bookmark use clickable divs in `src/pages/dashboard/stories/details.tsx:92`.

## Motion recommendations: deliberately limited

Use the existing smooth easing `cubic-bezier(0.22, 1, 0.36, 1)` and shared motion recipes; these are proposals, not implemented changes.

| Opportunity | Purpose | Suggested behavior |
|---|---|---|
| Uploading → Processing → Ready | Honest state feedback | Text/icon opacity crossfade 150 ms; progress remains accurate. Reduced motion uses immediate text replacement. |
| Capture saved → default | Continuity after completion | Content opacity 150–200 ms; retain focus and existing card resize behavior. Do not clear until save is confirmed. |
| Modal/panel close | Spatial continuity | 200–250 ms entrance, 150–200 ms exit, opacity/transform; retain DOM through exit and restore focus. Reduced motion immediate. |
| Newly added/removed item | Identify the changed object | Local opacity 150–200 ms, optional translateY 4 px; avoid replaying the list. Reduced motion immediate. |
| Empty → first content | Orient first-time user | Single opacity reveal 200 ms once data resolves; preserve container geometry. No bounce or blocking stagger. |
| Shuffle/tab result replacement | Make content replacement legible | Changed-content fade 150 ms; preserve focus and scroll. Never hide the whole usable surface for background revalidation. |

Do **not** add decorative streaming-token animation, whole-history entrances, animated analytics drawing, repeated metric counters, or slow keyboard-command opening. Existing reveal durations (500 ms shared text, 400 ms Stories surface) deserve tuning for frequent actions rather than adding more effects.

## Recommended implementation order

1. Upload readiness/submission and draft/file lifetime; Stories filter/page correctness.
2. Explicit request failure versus true-empty states; recover chat/history and public links.
3. Accessible shared dialogs and native keyboard controls; hydration/loading shells.
4. First-use and filter-specific empties; queued/processing/stale data clarity.
5. Six focused motion seams above, with reduced-motion and focus checks.

Preserve the strong existing patterns: quick-capture offline outbox/drafts, capture local text persistence, message retry, answered/reflection shuffle states, People loading/search/pending invitation distinctions, summary retry, publish/upload guards in the newer story composer, and shared reduced-motion guards in Overview/People/Stories.

## Pass 4 — deleted-memory recovery (2026-10-15)

Implemented a server-owned 30-day recovery window with deletion timestamps, stable legacy backfill, a ten-second Undo toast, Restore, and a distinct irreversible Delete permanently action. Restoration returns updated data and refreshes active/Deleted counts, paginated lists and the infinite grid. Deleted rows/cards show the deletion date and remaining recovery time. A recurring API system job handles expiry, shared-media checks and durable cleanup retries. Existing user memories were not modified during browser verification.

Test in Stories, in both list and grid: Delete → toast Undo; Delete → Deleted → Restore; check movement back to All and removal from Deleted; check creation date remains original and Deleted shows actual deletion date; verify toast expires after ten seconds while recovery stays available for 30 days; verify permanent-delete confirmation using only a disposable memory.

Rollout: API and web work are on `feature/web-edge-cases`. The current local web points to the hosted development API, so hosted testing requires releasing the API and worker. See `api/agents/memory-recovery-rollout.md` for migration, scheduling and storage retry details.


## Pass 5 — Stories request recovery (2026-10-15)

- List and grid first-load failures show a neutral Retry loading stories control; errors appear only in a toast with Retry. Failed requests never claim the library is empty.
- Cached stories stay visible on refresh failures. One toast is shown per failure episode/request scope; recovery, scope changes, and unmount dismiss it.
- Grid load-more failures stop the spinner and automatic pagination, preserve loaded cards, and show Retry rather than End of items. Rejected pagination/retry promises are handled.
- Existing theme tokens, shared buttons, toast motion and results transitions are reused.
- Verification: 36 focused tests cover Stories rendering, grid behavior, failure deduplication, retained content, and real SWR/MSW failure-to-success retry in list/grid. Scoped ESLint and production build pass. Browser verification remains incomplete: the attached preview renders an empty root and snapshot automation fails after reopening/navigation.

| Where | What to test |
| --- | --- |
| /stories, list and grid | Block the stories GET request in browser Network tools, then reload. Expect Retry loading stories and one error toast, with no No stories yet message. Unblock and Retry; expect stories or a confirmed empty state. |
| /stories, already loaded | Block the stories GET request, switch away and back to trigger revalidation. Existing cached stories should remain visible; Retry in the toast should recover after unblocking. |
| /stories, grid with more pages | Block the next stories page request and scroll down. Existing cards stay, spinner stops, and Retry replaces the end-of-list label. Unblock and Retry to continue. |


## Pass 6 — active Chat entry and history request recovery (2026-10-15)

Route audit correction: `/chat` renders `main/host-chat-entry.tsx`, through `main/index.tsx`, and resolves the primary conversation from the profile. `/chat/conversations` and `/chat/conversations/suggested` redirect to `/chat`; they do not render a conversation list. Previous list-specific implementation and testing claims were incorrect.

- The active Chat entry reports profile failures through a toast with Retry, with a neutral retry control on the page. Retry refetches the profile without reloading the app, preserves query/location state (including voice intent), and prevents a failed initial request from opening a new conversation.
- Conversation/topic detail failures use toast recovery and a neutral retry control instead of an empty composer. Cached content remains available.
- Message-history failures offer Retry and a toast, pause automatic fetching, and retain messages. Confirmed empty history is fetched once. Successful retries deduplicate message IDs and preserve scroll position; reduced-motion users avoid smooth scrolling.
- Each conversation has its own message state. Pending history results and scroll timers are ignored/cleared after leaving that conversation.
- Removed only this effort's edits to the unused `create/index.v2.tsx`, `chat/main/recent-conversation.tsx`, and `chat/recent-conversation/index.tsx`. Removed the new tests that mounted those legacy lists under misleading URLs. Existing legacy source remains unrouted.
- Retained shared Upload files safeguards: the dialog remains registered, although its caller is the dormant Prompt input dialog, with no normal UI trigger found. These safeguards are not evidence of a reachable Add story upload path; the active Add story composer has its own tests.
- Route tests now consume the production router's Chat route definitions and real Chat entry export, isolating unrelated pages. They cover both legacy redirects, profile failure/retry, primary/new conversation resolution, and query/state preservation.

| Where | What to test |
| --- | --- |
| `/chat` | Block `/users/profile` before opening a fresh page. Expect a toast and Retry loading conversation, without inline error copy or a new conversation. Unblock and Retry; the existing conversation should open without a reload. |
| `/chat/conversations` and `/chat/conversations/suggested` | Both should open the same primary conversation as Chat, never an old list. |
| `/chat/:id` and `/chat/reply/:id` | Fail the detail GET. Expect Retry rather than an empty composer. Unblock and retry. |
| An existing chat | Fail messages GET on first load or while loading older history. Retry should preserve current messages and recover without duplicates. |
| Two different chats | Switch while history is loading. Old messages must not appear in the new chat. |

Correction verification: 110 tests passed across nine focused suites (100 existing regression tests plus ten active Chat route/recovery tests, rerun after correcting the route-test harness). Scoped ESLint, whitespace checks, and production build passed. The existing Chat rendered in the shared browser; fresh navigation to the legacy URL returned an empty app root, so browser redirect/failure recovery remains a manual acceptance check. Automated MSW tests cover failed profile requests and recovery.


## Pass 7 — Explore and search request recovery (2026-10-15)

- Verified live routes: Explore uses `explore/index.tsx`, category routes use `category.tsx` → `category-details.tsx`, and the registered search overlay uses `search-modal-v2.tsx`. Shared reflections/topics also serve Overview.
- Catalog, category questions, reflection cards, suggested topics, and shuffle allowance report request errors through scoped Retry toasts. Neutral retry controls remain in the affected section; confirmed empty results retain their separate copy.
- Bundled category artwork remains available during catalog failure, without incorrectly claiming that a server update is underway. Category loading has a status instead of a blank screen.
- Failed category pagination retains earlier questions, stops automatic loading, and handles rejected requests. SWR resets pagination on filter-key changes. Unresolved topic counts no longer show a misleading zero.
- Search errors appear only in toasts, with a neutral Retry search control. Retry preserves the query. Same-query cached results remain usable; changing the query hides old results and dismisses its error toast. Existing focus, command navigation, and shared motion are preserved.
- Verification: 78 tests passed across eight focused suites, including MSW failure/recovery, next-page failure, search query preservation, and shuffle allowance. Scoped ESLint and production build passed. Browser sidebar navigation confirmed Explore renders. Search browser interaction failed at the automation layer; search recovery is verified by component/integration tests, with manual acceptance still recommended.

| Where | What to test |
| --- | --- |
| Explore and Overview | Block the prompts or suggested-topics GET request. Expect one error toast and Retry instead of empty-result copy. Unblock and retry. |
| Explore → any category | Fail the next questions page. Earlier cards stay visible and loading stops. Unblock and retry; older cards must not duplicate. Switch All topics/Answered and confirm each starts at page one. |
| Header search | Fail search (including its keyword fallback), type a query, then unblock and Retry search. The query stays intact and results recover. No error message should appear inside the dialog. |
| Search with results | Change the query while loading: previous-query results must disappear. Escape should close the dialog and return focus to its opener. |


## Pass 8 — public-link recovery (2026-10-15)

- Live `/post/:id`, `/accept-invite/:id`, and `/capsule/view` routes distinguish rejected links from temporary network/server/rate-limit failures. Temporary failures use scoped toast Retry actions and neutral retry controls, without server error text on the page. Confirmed unavailable links retain readable guidance.
- Public story Join Memento now links to `/register`. Unavailable invitations offer sign-in and guidance to request another invitation. Cached content survives temporary refresh failures; an explicit rejected-link response hides stale story/invitation content.
- Capsule retries reuse an issued grant in memory instead of exchanging the consumed token again. In-flight work is shared across Strict Mode effect setup, and late results after unmount are ignored. Opening another capsule resets the content and grant.
- Capsule credentials remain out of storage and the visible URL. Requests retain no-referrer/no-store and omit cookies. Missing-token pages explain reopening the original link or asking the sender for a new link; loading respects reduced motion and uses theme tokens.
- Verification: 27 focused tests passed, scoped ESLint and production build passed. Browser inspection confirmed the missing-token capsule state. Successful private-link and failure/retry flows were simulated with MSW; no real one-time token was consumed.
- Existing protocol limit: if the server consumes an exchange token but its response never reaches the browser, no grant is available to reuse. A newly delivered link is needed; this pass does not change the one-time-token API contract.

| Where | What to test |
| --- | --- |
| Public story `/post/:id` | Confirm a valid story loads and Join Memento opens registration. Fail its public GET, then unblock and Retry; a temporary failure must not say the story was removed. |
| `/accept-invite/:id` | Fail its GET, unblock and Retry; the invitation form should recover. Expired/accepted links should offer sender guidance and Sign in. Do not accept a real invitation just to test loading. |
| `/capsule/view` without a token | Confirm the page explains how to reopen the original invitation or request another link. |
| Capsule with a disposable test link | Fail the content GET after exchange succeeds. Retry must load with the same grant, without another token exchange. Keep the page open during this test. |


## Pass 9 — Change password dialog accessibility (2026-10-15)

- Verified `/settings/security` uses the Security component in `components/modal/settings/security.tsx`.
- Replaced the custom password portal with the shared Dialog and trigger, with an accessible title/description, focus containment, Escape dismissal, and trigger focus restoration. The dialog stays 448px wide on desktop, fits smaller viewports, and scrolls within its viewport height limit.
- Reused shared theme tokens and dialog transitions, with reduced-motion overrides. Old password receives initial focus; new/confirmation fields use new-password autocomplete.
- Password form state is scoped to the open dialog, so reopening starts empty. Saving blocks dismissal and duplicate submission; failure preserves entered values, while success closes and restores focus. Request errors continue through the existing toast handler.
- Verification: 12 tests passed across Security and Passwordinput, scoped lint/whitespace checks and production build passed. Live browser confirmed 448px width and initial focus; Escape and focus restoration were checked without submitting a real password change.

| Where | What to test |
| --- | --- |
| Settings → Security → Change password | Old password should receive focus; Tab/Shift+Tab should remain inside the dialog. |
| Same dialog | Escape or Close should dismiss and return focus to Change password. Reopen and confirm fields are blank. |
| Same dialog, disposable test account | During a slow save, dismissal and duplicate submission are blocked. A failed request keeps values for retry; success closes the dialog. |
| Same dialog, narrow screen/reduced motion | All fields/actions remain reachable; no opening/closing animation when reduced motion is enabled. |


## Pass 10 — passkey recovery and removal confirmation (2026-10-15)

- The live Security passkey manager consumes loading failures through the shared scoped Retry toast and an explicit Retry loading passkeys control. It no longer reports an empty list when the request fails; cached entries remain visible.
- Remove opens the shared 448px desktop confirmation dialog, identifies the device, explains the sign-in impact, and initially focuses Cancel. Cancel returns focus to its removal trigger.
- Confirmation is required before the DELETE request. Pending removal blocks repeated requests, dismissal, and other passkey mutations. Failure stays open for retry and uses the existing mutation error toast without duplicating it.
- Confirmed removal updates the bound SWR cache immediately and returns focus to Add a passkey. Registration refresh also uses the bound cache, with refresh rejection handled independently of successful registration.
- Verification: 15 focused tests, scoped lint, whitespace checks, and production build passed. Tests cover initial-load recovery, confirmation/cancellation, pending Escape protection, failed removal/retry, cache update, and focus. The shared preview did not expose the passkey section in its current state; no real credential was changed, and manual browser acceptance remains recommended.

| Where | What to test |
| --- | --- |
| Settings → Security → Passkeys | Fail the list request. Expect Retry and a toast rather than No passkeys registered. Unblock and Retry. |
| Existing passkey → Remove | Confirm the device name and Cancel focus. Cancel or Escape should return focus without removing anything. |
| Disposable passkey → confirm removal | During a slow request, Cancel/Escape and repeat removal are blocked. Failure keeps the confirmation open; retry success removes the row and focuses Add a passkey. |


## Pass 11 — live chat settings drawer accessibility (2026-10-15)

- Traced the live header action through conversation chrome to `SidebarDetails` in the active conversation route. The older `modal/chat-settings/index.tsx` popup is not the header drawer; this pass leaves that component unchanged.
- Added accessible dialog behavior to the live overlay: named dialog, initial Close focus, Tab containment, Escape/backdrop/Close dismissal, and return to the external header trigger.
- Mounts one preferences tree for the current breakpoint and unmounts it when closed. Preserves the desktop responsive 485px maximum width, gradient, and mobile sheet gestures; the mobile surface is capped at 80dvh with a scrollable content area. Uses theme surfaces and reduced-motion handling.
- Voice preview cleanup aborts active samples on unmount and prevents a sample from starting if preferences close during its asynchronous setup. Saving the voice preference remains independent of preview cancellation.
- Verification: 21 focused component tests, scoped ESLint, and production build passed. Live browser confirmed desktop dialog width, single preferences tree, initial focus, Escape/focus return; at 390×844, confirmed a 675px sheet, scrollable settings, focus containment, and focus return. No voice preference or recording was submitted in the browser. Touch swipe remains a manual device check.

| Where | What to test |
| --- | --- |
| Chat → top-right Chat settings | Close receives focus; Tab and Shift+Tab stay inside. Escape, Close, or clicking the backdrop closes and restores focus to Chat settings. |
| Same drawer on mobile | Scroll to all music/voice settings; close with the button, backdrop, or a downward sheet swipe. Reopen and verify only one set of controls. |
| Same drawer in light/dark themes | Gradient remains above the theme surface; controls remain legible. With reduced motion enabled, opening/closing should avoid animated travel. |
| Same drawer → voice sample | Close during a sample or its loading phase. Audio should stop and no late sample should begin. |


## Pass 12 — About me and AI summary recovery (2026-10-15)

- Confirmed the live `/settings/general` About me tab uses `SettingsAbout` through General. Edit remains disabled until the persona request has returned successfully. Unresolved data shows loading guidance rather than the empty-bio prompt; a successfully empty persona permits editing.
- Introduction and AI summary failures use the shared scoped Retry toast plus neutral retry controls. Retry catches rejections, and cached text stays visible during a failed background refresh. Summary errors no longer render as inline alerts.
- The save handler guards readiness, unchanged values, and duplicate submissions. Pending saves block dismissal; failed saves retain the draft. Cancel discards it, and reopening takes the saved bio. Shared dialog motion respects reduced motion.
- Verification: 18 tests across About me, General, and request recovery passed; scoped lint and production build passed. Live browser confirmed the 448px dialog, prefilled text/initial focus, Escape dismissal and focus return. Network failures and saves were simulated in tests; no real profile changes were submitted.

| Where | What to test |
| --- | --- |
| Settings → Personal info → About me, with a slow persona request | Loading guidance appears and Edit stays disabled until saved text arrives. Then Edit opens with that text. |
| Same page, failed persona or summary request | Expect a toast and Retry control. Unblock the request and retry. Cached text should stay visible if a refresh fails. |
| Edit About me | Change text, Cancel, reopen: the saved text returns. Escape returns focus to Edit. |
| Edit About me on a test account, slow/failed save | Pending save blocks repeat submission/dismissal. Failure keeps your draft; retry succeeds and closes the dialog. |


## Pass 13 — voice catalog recovery and ambience edge cases (2026-10-15)

- Confirmed the live chat drawer composes Voices and BackgroundMusic through ChatPreferencesPanel. Voice catalogs are fetched separately; music choices are bundled static assets, so no fictitious music-catalog loading/retry request was added.
- Voice loading, successful empty results, and failed requests now have distinct states. Failures use scoped Retry toasts and a neutral Retry control. A failed provider does not hide the working provider or cached choices; retry refreshes only failed catalogs and handles rejection.
- Voice and music preference saves reject overlapping clicks. Voice buttons disable during saves, and a superseded sample cannot clear the newer sample’s busy state. Removed the redundant awaited profile refresh before preview, and background profile refresh rejections are caught.
- Empty ambience lists explain the absence of tracks while keeping Off available; compact playback/navigation stays disabled without tracks. Local interaction motion respects reduced motion.
- Verification: 23 focused tests, scoped lint/whitespace checks, and production build passed. Tests cover delayed/empty catalogs, partial provider failure/retry, cached choices, and duplicate preference submissions. Live browser confirmed one drawer with voice and ambience choices; no real preference mutation or audio sample was triggered. Existing slider test act warnings and build chunk-size warnings remain.

| Where | What to test |
| --- | --- |
| Chat → Chat settings → AI Voice | With a delayed catalog request, expect Loading voices rather than an empty/error message. |
| Same drawer, block one `/ai/voices?provider=…` request | Other provider choices remain available; expect a toast and Retry loading voices. Unblock and retry without reloading the page. |
| Same drawer after choices loaded, fail a refresh | Existing voice choices stay visible. Successfully empty catalogs instead show the no-voices message. |
| Test account → voice or ambience selection | Click rapidly during a slow preference save; only one save should run. After failure, the controls should be usable again. |
| Quick tools music player and Chat ambience | Existing playback controls still work; a missing catalog disables compact playback with explanatory copy. |


## Pass 14 — People and beneficiary/group list recovery (2026-10-16)

- Traced `/people` to PeoplePage and `/settings/beneficiary` to BeneficiaryAndGroup. Added scoped Retry toasts and neutral retry controls to root People, beneficiary, and group lists. Failed initial loads no longer masquerade as empty lists; pending tab counts use an em dash instead of an invented zero.
- Fixed the frontend groups list fetcher swallowing request failures into empty pagination; malformed pagination also rejects. No backend endpoints or access rules changed.
- Cached beneficiary/group rows and connection names remain available during refresh errors. People continues withholding the selected shared workspace after a failed connection check, preserving its existing access behavior; query/selection state remains intact for retry.
- Empty later group pages recover to a valid previous page instead of showing the whole-library empty state. Existing loading motion is retained; no extra animation was added to retry.
- Verification: 14 focused tests, scoped ESLint, whitespace checks, and production build passed. Tests cover initial failure/retry, cached group preservation, valid empty states, and empty later-page recovery. Restarted the stopped local dev server; browser checked People and Settings beneficiary/group rendering. No invitations or memberships were changed. Failure scenarios were exercised with mocked requests.

| Where | What to test |
| --- | --- |
| People `/people` | Block its list request, expect a toast and Retry loading people. Unblock and retry without losing the search/selection state. |
| Settings → Beneficiary & Group → Beneficiaries | Fail loading: expect Retry instead of No beneficiaries yet. A successful empty response should still show the genuine empty state. |
| Same page → Groups | Fail loading, unblock, and retry. Existing rows should remain visible if only a background refresh fails. |
| Groups, last page with disposable test data | Remove the last item on a later page; the list should recover to a previous page rather than claiming all groups are gone. |


## Pass 15 — verified People detail wiring and recovery (2026-10-16)

- Verified live wiring: `router.tsx` `/people` → exported PeoplePage → `pages/dashboard/people/index.tsx`. Selecting a connection mounts RelationshipWorkspace → OurSpace; its settings button mounts ConnectionSettingsDialog. PeoplePage’s sidebar Blocked people action mounts BlockedPeopleDialog. No legacy component was substituted.
- All three failed reads use scoped Retry toasts and neutral retry controls. Shared-space filters/page remain scoped through retry; failed reads continue hiding shared content and connection mutation controls. Successful empty later shared-space pages recover backward.
- Connection labels initialize from fetched settings rather than the possibly older list label. Draft edits survive failed saves. Pending mutation guards prevent repeat submission and dismissal.
- Unblock success removes the cached row immediately; follow-up read failure is a loading/retry issue rather than a false unblock failure. Relationship/disconnect refresh failures similarly do not convert completed writes into failed writes. Mutation failures now use toasts.
- Verification: 15 focused tests, scoped ESLint/whitespace, and production build passed. Added integration tests navigating from the actual PeoplePage to each target component and retrying its request. Browser checks reached Our Space, Connection settings, and Blocked people through their live buttons. No real write was performed.

| Where | What to test |
| --- | --- |
| People → a connection → Our Space | Fail the shared-space GET, choose/retry a filter, then restore network access. Retry keeps the selected filter and does not show a false empty state. |
| Same connection → Connection settings | Fail its GET, retry, and confirm the fetched relationship appears. A failed save keeps your draft and shows a toast. |
| People sidebar → Blocked people | Fail its GET; expect Retry instead of an empty list. Unblock the request and retry. |
| Disposable test blocked person → Unblock | Slow requests block duplicate clicks/Escape; failure retains the person. Success removes the row even if the subsequent refresh fails. |


## Pass 16 — People shared memories and contribution recovery (2026-10-16)

- Confirmed live OurSpace imports SharedItemDialog and ContributionDialog; RelationshipWorkspace also uses the contribution dialog. Reused shared dialog focus/motion and scoped request-recovery toasts.
- Shared detail failures now offer Retry without claiming the memory was deleted. Failed reads hide cached details; removal confirmation requires current removal permission. Pending removal blocks other actions and dismissal; failures retain confirmation and toast.
- Contribution failures preserve drafts and use toasts. A synchronous mutation guard prevents repeated submissions; fields and dismissal are guarded during saves. Source-library retry retains the query and separates no matches from a genuinely empty library.
- Failed attachments remain visible with Retry/Remove; incomplete uploads cannot be submitted. Upload retry receives the original file payload; attachment deletion failures are caught and toasted. Pending uploads prevent dismissal.
- Verification: 20 focused tests passed, including live PeoplePage integration tests, permission denial, request retry, pending save/removal, draft preservation, and failed-upload retry. Scoped lint and production build passed. Browser reached the selected connection; a live People refresh failed during the dialog check, so full browser acceptance is still pending. No real memories were created or removed.

| Where | What to test |
| --- | --- |
| People → a connection → Our Space → Add memory → Write a note | Save on a test account. With a failed request, expect a toast and your draft intact. During a slow save, repeated clicks and Escape must not submit twice or close. |
| Add memory → Choose a memory | Search, fail the library request, unblock and Retry. Search stays intact; a successful empty search says no matches. |
| Add memory → Upload media | Fail an upload. File remains with Retry/Remove and Add stays disabled. Retry successfully, then add a disposable memory. |
| Our Space → open a shared memory | Fail loading, unblock, Retry. A network failure must not claim deletion. Only eligible memories offer removal; failure retains confirmation, success removes the shared entry. |

## Remaining work packages after Pass 16

Estimate: **10 passes**, including final verification. These group unresolved audit checks; they are not ten known defects. Verify each against current live wiring and skip already-satisfied behavior.

1. Profile avatar/banner conversion, upload, cropping, cancel and fallback behavior.
2. Beneficiary/group mutation and invitation edge cases; remaining People selection/draft transitions.
3. Capture/quick-note draft, slow transcription, offline save and route-exit checks.
4. Chat attachment-only send, interrupted streams and voice-session lifecycle.
5. Billing/pricing checkout, pending/cancelled return, promotion and error feedback.
6. Authentication, session expiry, account/privacy actions and route recovery.
7. Onboarding saved-state recovery, verification and resume/skip behavior.
8. Shared utility overlays: insights, streak, playback, invite/feedback and remaining media recovery checks.
9. Admin feature flags and AI-health loading/retry/permission states.
10. Final cross-screen acceptance: mobile, themes, keyboard/focus, reduced motion and outstanding audit opportunities (including Explore artwork).


## Pass 17 — profile avatar/banner recovery (2026-10-16)

- Verified live Settings → General → SettingsProfileHeader → ProfileBanner / useProfileAvatarUpload. Shared dialogs and existing reduced-motion conventions are retained.
- Avatar selection validates image type/size, clears the input for same-file retries, and guards both preview preparation and upload. Failed reads/uploads restore the previous avatar; successful uploads remain successful if a background profile refresh fails. Feedback stays in toasts. The upload input disables while pending.
- Banner saves block dismissal and repeated selections. Missing uploaded imagery falls back to the default preset without writing over the custom URL or saved position; adjustment disables while showing the fallback. WebP conversion remains server-owned; no API code changed.
- Crop saves disable unchanged submissions, guard repeated actions, retain the draft on failure, and restore the last saved position after cancellation/reopen. Native range controls retain keyboard support; pointer movement is ignored while saving.
- Verification: focused component/hook tests cover rollback, duplicate guards, failed refresh, pending dismissal, crop cancellation, missing-image fallback and existing themes. Scoped lint and production build pass. Browser status shows the session at Login, so authenticated visual acceptance remains pending. No real profile was modified.

| Where | What to test |
| --- | --- |
| Settings → Personal info → profile photo | Upload on a test account. Fail the request: the old avatar returns and the same file can be selected again. Rapid selection must not start overlapping uploads. |
| Same page → Change banner | During a slow save, Escape/outside clicks must not close the picker. Failure leaves the existing banner and a toast; retry succeeds. |
| Same page → Adjust banner | Save starts disabled. Move a slider with arrow keys, then Cancel and reopen: saved position returns. Failed save keeps the draft; a pending save locks controls. |
| Custom banner with unavailable image | Default blue clouds appears without changing stored position. Change banner stays usable; adjustment is disabled for the unavailable image. |

Remaining estimate after this pass: **9**, using packages 2–10 in the preceding checklist. Next: beneficiary/group mutations and invitation recovery.


## Pass 18 — beneficiary/group action recovery (2026-10-16)

- Traced Settings beneficiary cards and group rows to the registered add/update/delete/resend/member dialogs. No legacy dialog substitution or API access-rule change.
- Added a scoped request guard across those mutation dialogs: synchronous duplicate protection, shell close guards during writes, pending controls, caught failures, and retained drafts. Existing request-layer toast reporting and subscription recovery remain in place without duplicate error toasts.
- Confirmed writes now complete independently of background list refresh. Resend/removal success uses the success flag rather than requiring a non-null response body. Refresh errors cannot turn successful writes into failed submissions.
- Group-member picker now separates loading, retry, and empty results and offers pagination, retaining selected IDs across pages. Membership removal guards concurrent clicks and updates the detail cache immediately, including the last-member empty state. Group-detail failures offer scoped toast/retry rather than falsely claiming the group is missing.
- Verification: 19 focused tests passed across guards, mutation dialogs, member recovery/pagination, invitation scope and existing settings lists. Scoped lint and production build passed. Browser remains at Login, so authenticated visual acceptance is pending. No invitations were sent and no real memberships were changed during verification.

| Where | What to test |
| --- | --- |
| Settings → Beneficiary & Group → invite/edit/resend/remove | On a test account, fail a request: expect a toast and retained form. Slow requests block repeated actions and dismissal. Retry should work. |
| Groups → Create/Edit/Delete | Use a disposable group. Confirm pending controls, draft retention on failure, and successful completion even if subsequent list refresh fails. |
| Groups → members → Add members | Delay/fail the beneficiary list: loading/retry must replace empty copy. Select people on multiple pages and confirm the submitted selection is retained. |
| Disposable group → remove its final member | One request should remove the row and show the empty state. A failed follow-up read should offer Retry, not restore the removed row. |

Remaining estimate: **8 passes**, packages 3–10 in the Pass 16 checklist. Next: capture and quick-note recovery.


## Pass 19 — capture and quick-note recovery (2026-10-16)

- Kept the active OverviewCaptureCard/useOverviewDictation and registered QuickCapture implementations. Existing motion is retained; failures now use toast feedback instead of inline save/recorder errors.
- Fixed QuickCapture cleanup recreating a draft after confirmed save or offline enqueue. Pending-save close guards and synchronous submission guards prevent repeat writes. Failed saves retain the draft; background list refresh failures are caught. Overview similarly guards repeated saves and only clears the text that was submitted.
- Stalled Overview transcription aborts after 30 seconds and retains the recording for Retry. Late results cannot append text after timeout; unmount/cancel aborts the pending request. This improves recovery, not provider latency.
- New offline queues are scoped by account, have per-entry IDs, serialize sync attempts and retain entries added during an in-flight sync. A changed/unmounted account stops subsequent sends. Unowned legacy queues are left untouched rather than submitted under an assumed account. Copy accurately explains that reopening Quick capture online triggers sync; an open capture also retries when connectivity returns.
- Quick recorder prevents overlapping permission prompts, releases a permission result arriving after unmount, and keeps its finalization callback stable across rerenders. Unsupported microphone access reports a recoverable toast.
- Verification: 47 focused tests passed across Overview capture/dictation, transcription transport, QuickCapture themes/recovery, and microphone lifecycle. Scoped lint and production build passed. Authenticated browser acceptance is deferred by user instruction while the hosted development sign-in is unavailable. No real note was saved.

| Where | What to test after sign-in works |
| --- | --- |
| Overview → type → Save now | Rapid clicks send one save. Failure preserves text; success clears only the submitted text and explains background processing. |
| Overview → microphone → stop | Delay transcription beyond 30 seconds: toast offers Retry and the original text stays. Retry should append once; cancel/leave must ignore late results. |
| Quick tools → Quick note | Save then reopen: the saved draft must not return. Failed save retains text and shows a toast, with no inline error. |
| Quick note offline | Save, close, reconnect and reopen Quick capture. It syncs the current account’s queued notes; failures keep notes locally for retry. |
| Quick note → record → leave before granting permission | A late permission grant must release the microphone rather than start a hidden recording. |

Remaining estimate: **7 passes**, packages 4–10 in the Pass 16 checklist. Next: Chat send/stream/voice lifecycle checks.


## Pass 20 — live Chat sending and interrupted responses (2026-10-16)

- Verified ConversationSession uses the shared ConversationChatinput and existing voice-session provider. No obsolete chat-home/list component was substituted.
- Attachment-only messages now reach both established Host Chat and first-message requests. Composer Send and keyboard shortcuts require confirmed server IDs for every attachment rather than accepting a mixture of uploaded and pending files.
- Synchronous send guards block overlapping requests. Repeated failures retain Retry on the original local user-message row; retry does not append another local copy. The server's handling of uncertain-delivery retries is unchanged and is not an exactly-once guarantee.
- Stream HTTP failures now reject to the caller instead of resolving as success. Error JSON is read before acquiring its body reader. Streams release their readers on completion/failure; partial assistant text survives interruption, and incomplete replies are not read aloud.
- Leaving the conversation aborts the stream and ignores late callbacks/navigation. Existing persistent voice behavior was retained after running interruption/session lifecycle, route and spoken-reply tests.
- Verification: 58 focused tests passed across send recovery, stream transport, upload readiness, composer behavior, voice routes/sessions, spoken replies and request recovery. Scoped lint/whitespace and production build passed. Existing test-environment canvas and unmatched voice-history mock warnings remain. Authenticated browser acceptance remains deferred as agreed; no real chat was sent.

| Where | What to test after sign-in works |
| --- | --- |
| Chat → attach a file without typing | Send after upload: the file reaches the conversation. With one attachment still pending, both Send and Ctrl/Cmd+Enter must stay blocked. |
| Chat → fail a send, then Retry twice while offline | Retry remains available and the original local user message remains a single row. Reconnect and retry. |
| Chat → interrupt an incoming response | Received text remains visible; a toast reports failure and Retry stays available. The incomplete response should not play aloud. |
| Chat → send → navigate to Overview → return to Chat | The outgoing stream aborts on leaving. Returning resolves the same Host Chat and reloads server-saved messages once; late callbacks from the old screen must not appear. This does not promise persistence of unsaved partial text. |
| Voice conversation | Interrupt connectivity: verify one toast, usable text controls, retained transcript, and no orphaned microphone after ending. |

Remaining estimate: **6 passes**, packages 5–10 in the Pass 16 checklist. Next: billing/pricing recovery.


## Pass 21 — Billing/pricing recovery

Verified live wiring: Settings route → settings/index.tsx → modal/settings/billing.tsx; /pricing → pages/pricing → PricingOverlay. Manage plan uses the same overlay and CancelPlanContent.

- Subscription/account/invoice request failures use retry toasts and neutral Retry controls instead of inline technical errors. Account failure disables portal actions despite stale customer data.
- Promo and portal submissions have synchronous duplicate guards. Promo input stays locked while pending, survives rejection, and clears only after success. Transport failures are not toasted twice by promo handling.
- Checkout and resume requests guard duplicates; pending checkout/resume/cancellation prevents dialog dismissal. Downgrade and interval controls cannot interrupt checkout. Existing dialog motion/focus handling is retained.
- New checkout cancellation URLs return to Billing with a cancellation toast. Success return refreshes billing and reports pending confirmation, never inferring payment success from the query parameter. Return parameters are consumed with replace navigation; toast provides manual Refresh. No webhook polling or payment confirmation simulation was added.
- Subscription/account background refresh rejections are caught. No backend edits, purchases or real subscription mutations.

Validation: 42 focused tests across Billing, pricing overlay/page, checkout and cancellation passed; scoped ESLint and production build passed. Existing build size/PDF chunk warnings remain. Authenticated browser verification deferred at the user's request while the dev login service is being changed.

| Where | Manual acceptance check |
| --- | --- |
| Settings → Billing | Fail account/invoice requests: toast plus Retry, no fabricated empty details; restore connection and retry. |
| Billing → Promo code | Submit invalid code: retained text and toast; slow request: input locked, repeated submission sends once. |
| Pricing / Billing → Manage plan | Slow checkout: Escape/close cannot dismiss during request; failure unlocks controls. Use sandbox billing only. |
| /settings/billing?checkout=cancelled | Cancellation toast, ordinary Billing view, query consumed. |
| /settings/billing?checkout=success | Neutral confirmation-pending toast and refresh; URL alone must not upgrade the plan or claim success. |
| Manage plan → Cancel plan | Sandbox only: pending cancellation blocks dismissal, failure retains feedback for retry. |

Five estimated passes remain, including final verification. Next: authentication/session, account/privacy and route recovery.

## Recheck of Passes 15–21 — current application wiring (2026-10-16)

Scope: shared space, connection settings and blocked people through billing/pricing. This is a review of completed passes, not another remaining work package.

| Area | Current wiring checked | Verification and corrections |
| --- | --- | --- |
| Shared space / connection settings / blocked people | `/people` → PeoplePage → RelationshipWorkspace / OurSpace / connection-settings dialogs | Existing page-level request-recovery tests retained. Added real PeoplePage action tests opening contribution from Our Space and unblocking via the sidebar. Unblocking does not recreate a connection. Clarified that “unblock the request” in old instructions meant restore network access. |
| Shared details / contributions | OurSpace → SharedItemDialog / ContributionDialog | Reran permission, retry, upload readiness, draft and pending-dismissal tests; the new page-level contribution test exercises the actual selected person and HTTP endpoint. |
| Avatar / banner | Settings General → SettingsProfileHeader → ProfileBanner / useProfileAvatarUpload | Reran upload rollback, same-file retry, pending guards, fallback and positioning tests. Token-class assertions do not constitute visual theme verification. |
| Beneficiaries / groups | Settings beneficiary route → lists → registered shared Modal entries | Old tests isolated `close` and guard registration. Added live Settings → Groups → Add group test through the actual modal registry/provider/shell and real HTTP transport: pending Escape/Cancel is blocked, failure retains input, Escape works after failure. Only unrelated PDF rendering is stubbed for the Node environment. |
| Capture / Quick notes | WelcomeSection → OverviewCaptureCard; modal registry → QuickCapture | Existing save tests mocked postFetcher and hid duplicate transport/error toasts. Added real HTTP failure tests for both save entry points. They now report one toast and retain text. Reran dictation, upload and account-scoped offline queue tests. |
| Host Chat | `/chat` → HostChatEntry → primary ID → ChatPage → Conversation → real composer/history | Removed the invented switch-conversation harness and corrected the acceptance row. New routed test sends, navigates to Overview, returns via `/chat`, ignores old callbacks and reloads server-saved messages once. A first-message mock omitted memory_id; corrected it and added a malformed-response test preventing `/chat/undefined`. Unsaved partial text persistence and server exactly-once delivery are not asserted. |
| Billing / pricing | `/settings/:tab` → Billing → PricingOverlay → CancelPlanContent; `/pricing` → same overlay | Added real Settings-route cancellation test through actual subscription hooks and HTTP mutation: pending Escape is blocked, rejected feedback remains, one error toast. This exposed duplicate toasts hidden by mocked action tests. Checkout, portal and resume use the same fix; local validation errors still toast. |

The shared postFetcher transport reports normalized mutation failures itself. A narrowly scoped reportFetcherError helper now avoids reporting those failures twice in reviewed billing, capture and first-chat paths while preserving local error feedback. No API contract or subscription behavior changed; no real purchases, notes, invitations or connection mutations were performed.

Validation: the expanded suite passed 432 tests across 89 files; the additional malformed-first-chat regression passed with the affected chat tests afterward (433 distinct tests overall). Scoped lint, whitespace and production build checked. Existing Node canvas and build size/PDF warnings remain. Browser status confirmed localhost is at Login; authenticated checks remain deferred per the user's instruction. Server-persisted chat history in the routed test is supplied by MSW, not proof of backend persistence.

Future manual checks use the corrected pass tables above. Five original work packages still remain; the next is authentication/session, account/privacy and route recovery.


## Pass 22 — authentication/session, account/privacy and route recovery (2026-10-16)

**Next broad-review start: this pass.** The preceding Passes 15–21 recheck remains the baseline; future broad review begins here unless new evidence calls for revisiting it.

- Verified AuthCheck in the dashboard layout, Settings privacy route → Privacy → DeleteAccount/LogoutAccount, the live LoginPage, and the catch-all 404 route.
- AuthCheck preserves the complete protected destination for signed-out users, waits for session validation, and offers toast/Retry for transient refresh failures without discarding a still-recoverable session. First profile load now has a loading state and Retry before protected content renders. Late refresh completions cannot restore a cleared/replaced session.
- Login return paths are decoded once by URLSearchParams, constrained to local destinations and protected against login loops. Password and passkey paths use the same return helper. Directly opening a missing page gives a useful Overview fallback when there is no app history to return to.
- Account deletion checks the mutation success flag, blocks duplicate requests and dismissal while pending, retains the confirmation on failure, and clears local auth only after confirmed deletion. It does not send another authenticated logout after deletion has revoked access.
- API source confirmed that normal logout revokes the current session only. The explicitly labeled all-device action now calls existing /auth/logout/other before /auth/logout, verifies both responses, and only then clears local auth/reports success. Failure preserves local access for retry; if the second step fails, other devices may already be signed out. No API edits were needed.
- Account confirmations now use the shared 448px Dialog with existing motion, focus trapping/restoration and keyboard dismissal. Pending operations guard dismissal. Error reporting uses toasts.
- No real account deletion or session revocation was executed. Disabled future privacy features and existing privacy-policy content were not expanded in this pass.

Verification: 66 tests across 12 files passed, including live Settings-route HTTP-mocked account actions, actual login-form navigation, AuthCheck + Store routing, session refresh races, request-auth regressions and dashboard layout. Scoped lint/whitespace and production build passed. Existing test act warnings and build chunk warnings remain. Authenticated browser acceptance is still deferred as agreed while development sign-in is being changed.

| Where | What to test |
| --- | --- |
| Signed out → /stories?view=deleted#memory | Login keeps the full return destination; signing in returns to the intended local route. |
| Expired access token + recoverable refresh session | Fail refresh with 503: toast + Retry session, no forced logout. Restore connectivity and retry. |
| First dashboard profile load | Fail /users/profile: loading changes to Retry profile; recovery opens the page. |
| Settings → Privacy & Account → Delete account | Test account/sandbox only: pending Escape/Cancel cannot dismiss; failure retains confirmation; only confirmed success clears access. |
| Settings → Privacy & Account → Log out | Test sessions only: other sessions are revoked before this one; failed revocation shows a toast and allows retry without claiming completion. |
| Open an unknown URL directly | Go back falls back to Overview instead of doing nothing. |

Four estimated packages remain. Next: onboarding saved-state, verification and resume recovery.

## Pass 23 — onboarding, verification and resume recovery (2026-10-16)

Broad-review checkpoint remains Pass 22.

- Traced the active `/onboarding` welcome/nickname/misc/summary routes, `/onboard/chat` export, shared `/verify-email` and `/check-mail` code form, and login → `/two-factor`. Legacy question components were not substituted into the routed flow.
- Both onboarding Skip controls now call the existing server endpoint before updating local status/navigation. Failure preserves the draft and reports one toast; completed accounts are not downgraded to skipped. Duplicate requests are guarded. API source was inspected; no API edits needed.
- Nickname editing can clear an existing value. Save checks success and advances without waiting for profile revalidation. Completion checks success, retains answers on failure and clears the draft only after success. Errors use toasts.
- Revisiting questions shows saved-answer loading, disables editing during load/failure, and provides Retry after a toast. Background profile updates no longer overwrite answers after successful initialization.
- Verification/recovery code requests have synchronous submission guards, explicit success checks, toast failures, and preserved digits on failed resend. Leaving/changing email discards late form completion. Two-factor verification preserves digits on temporary server errors, guards pending inputs/submissions and aborts on unmount. Login retains a safe return destination through the two-factor handoff.
- Onboarding-chat persistence now uses account-scoped keys in the live screen and remounts on account change. Unowned legacy drafts are not adopted into an account. Existing account-scoped question-draft handling remains intact.
- Existing motion/layout conventions retained. No real verification email, account onboarding change, or authenticated browser mutation was executed.

Validation: 108 tests across 22 files passed, followed by the expanded five-test onboarding recovery suite (109 distinct tests overall). Coverage includes real routed forms with HTTP-mocked mutations, saved-answer Retry, actual login → two-factor → requested destination, draft persistence and existing chat behavior. Scoped lint has no errors; two pre-existing hook-dependency warnings remain in the onboarding-chat hook. Production build and scoped whitespace checks passed; existing build chunk warnings remain. Authenticated browser/service acceptance remains deferred per user instruction.

| Where | What to test |
| --- | --- |
| Onboarding welcome or header → Skip | Fail the skip request: one toast, remain on onboarding with answers retained. Restore connection and retry: navigate to Overview; reload confirms persisted status. |
| Onboarding → nickname / summary | Clear and replace a nickname. Fail saving: retain typed answers and retry. Successful completion reaches Overview and survives reload. |
| `/onboarding/misc?mode=revisit` (direct route; no current Settings entry point) | Fail saved-answer loading: toast and Retry; Continue/editing stay disabled. Retry restores saved answers. Navigate Back/Continue and reload to check draft resume. |
| Verify email / password recovery → code form | Failed verification/resend preserves digits and reports a toast; successful resend resets digits and starts cooldown. Use a test account. |
| Login with 2FA from a protected URL | Enter a code; temporary server failure retains it for retry. Successful verification returns to the original local destination. |
| `/onboard/chat` | Resume an account's draft after reload. A second test account must not see the first account's draft. This is onboarding chat, not a conversation switcher in Host Chat. |

Three estimated packages remain: shared utilities, administration, and final verification. Next: shared utility interactions and recovery.

## Pass 24 — shared utility recovery (2026-10-16)

Broad-review checkpoint remains Pass 22. Branch: `feature/web-edge-cases`.

- Confirmed the active DashboardHeader → QuickTools / StreakTracker and modal registry → InviteFriends, Feedback and MemoryInsights. QuickTools and Chat settings share BackgroundMusic and the application BackgroundMusicProvider.
- Streak now distinguishes initial loading and failed stats from genuine zero counts, provides toast + Retry and retains cached stats during failed refresh. Calendar checks compare complete dates against last_seen and the daily streak count, rather than reusing a weekday from an earlier week. Open cards refresh periodically for rollover. This remains based on the API's streak/profile fields, not a newly invented daily activity ledger.
- Background music distinguishes requested/buffering from actual playing, pauses the disc while buffering, and keeps Stop available. Media errors and rejected play promises reset playback with one toast per attempt; retry reloads errored media. Stop/unmount invalidate late rejected promises, cleanup removes listeners, and switching accounts stops playback without autoplay. Volume is clamped to its supported range. Existing reduced-motion disc behavior and slider keyboard controls remain.
- Track preference changes check server success before updating the profile or playing a new track. Transport failures report once and keep quick actions available. Existing popover/sheet focus and motion are preserved.
- Invite-detail failures now use toast + Retry rather than an inline error. Clipboard permission recovery remains intact. Feedback blocks duplicate sends and close while pending, rejects unsuccessful responses, retains input on failure and avoids duplicate transport-error toasts; screenshot discard guards remain.
- Insights summary, progress and beneficiary requests have independent toast/Retry controls. Failed progress no longer presents a fabricated zero score; unresolved beneficiaries no longer imply an empty list. Existing search, media preview and Chat settings recovery were regression-tested without replacing their active components.

Verification: 127 tests passed across 18 files; scoped ESLint and whitespace checks passed; production build passed with existing chunk-size warnings. Tests include QuickTools → actual music component/provider with HTTP-mocked preference mutations, the Streak popup with HTTP-mocked stats, actual Insights requests, feedback through the shared modal shell, media events and playback promises, keyboard volume, search/media preview and voice settings regressions. Audio decoding/autoplay and authenticated browser acceptance are still manual checks, deferred as agreed. No real invitations, feedback submissions or profile mutations were sent.

| Where | What to test |
| --- | --- |
| Header → Streak | Slow stats: loading, no fabricated zero. Failed stats: one toast + Retry. Restore connection and retry. A real zero has first-step encouragement; old last_seen dates must not highlight this week. |
| Header → Quick tools → Music | Play, buffer, Stop, retry a failed track, and switch tracks. Disc runs only while audio actually plays. Failed preference save preserves selection; Quick note/Add people remain usable. |
| Quick tools / Chat settings → Volume | Arrow keys, Home and End adjust the slider with a readable percentage. Test actual sound and reduced-motion preference. |
| Invite friends | Fail invite request, retry, then deny clipboard permission: toast and selectable link, no inline technical error. |
| Feedback | Slow send: Escape/close cannot dismiss and repeated Send does not duplicate. Reject save: message remains for retry. Screenshot discard still asks for confirmation. Use a test account. |
| Memory insights | Independently fail summary, stats or beneficiaries: appropriate Retry, no fabricated empty list or zero score. Restore each endpoint and retry without changing tabs. |

Two estimated packages remain: administration and final verification. Next: administration loading, authorization and mutation recovery.

## Pass 25 — administration recovery (2026-10-16)

Broad-review checkpoint remains Pass 22. Branch: `feature/web-edge-cases`.

- Traced `/admin/feature-flags` → AdminFeatureFlagsPage, the application FeatureFlagsAdminProvider, FlagsTable, FlagDetailPanel and BulkActions. Traced the development-only `/ai-health` and `/dashboard/ai-health` aliases to AiHealthPage.
- Non-admin UI does not mount the list hook and offers Back to Overview. The provider also disables its list request for non-admins. Inspected API routes: flag reads/writes retain authentication + adminGuard; AI metrics/governance retain authentication + devOnly. Client allowlists are presentation gates, not a replacement for server authorization. No API changes.
- List failures use a toast and Retry rather than “no flags”; search no-match and successful empty configuration are distinct. Refresh revalidates the mounted SWR cache without reloading the document or dropping the search/selection.
- Row switches stay controlled and disable during their request, with synchronous duplicate guards. Mutation adapters check success before reporting completion, encode path segments and refresh the correct SWR cache. Refresh failure after a committed change is reported separately from write failure. Removed nested interactive buttons from table rows; Open is a named keyboard action.
- Detail loading and retry replace unhandled request rejection and false empty audit. Old requests are ignored on selection change; the keyed panel resets the previous flag's form. Scope type is constrained, scope ID required and rollout checked between 0–100. Pending save/delete blocks duplicate actions, errors toast once and retain fields. Deletion explicitly confirms the scope and inherited-value consequence.
- Bulk changes use a shared 448px review dialog, naming the prefix, target value and global scope, including matches outside the visible search/page. Pending state prevents dismissal and repeated submission. Rejected changes retain the reason and review for retry. API bulk implementation was checked: it applies global overrides to every prefix match. It is not transactional; a failed bulk operation can have partial server effects, so refresh/review before retrying a real operation.
- AI Health independently retries overview, trends and governance with toasts. Unavailable metrics do not fabricate zero-traffic empty states; unresolved governance is not labeled “Needs attention.” Existing data remains during refresh failure. No extra chart/count animations were added; shared dialog/control motion and reduced-motion behavior remain.

Validation: 17 tests passed across four suites, including routed actual flag pages/provider with MSW at the HTTP boundary, non-admin no-request behavior, list retry/search, rejected mutations, scoped cache refresh, pending row/bulk guards, confirmation, stale detail responses, detail retry/deletion, AI Health recovery, and existing feature-flag/dev-tool regressions. Scoped lint and whitespace checks passed; production build passed with existing chunk-size warnings. No real flag changes were executed. Authenticated browser and live admin-service acceptance remain deferred as agreed.

| Where | What to test |
| --- | --- |
| `/admin/feature-flags`, ordinary account | Permission message and Back to Overview; no flag-list request. Server must still reject direct unauthorized API access. |
| `/admin/feature-flags`, test admin | Fail list request: toast + Retry, not an empty configuration. Retry, search a nonexistent key, and Refresh without losing the query. |
| Test flag → Toggle | Slow request disables the switch; repeat clicks send once. Rejection leaves the old value and one toast. Success refreshes the row. Use sandbox flags only. |
| Test flag → Open | Rapidly select another flag: no late details from the old flag. Failed detail/audit request offers Retry. Invalid rollout prevents saving; rejected saves retain reason/scope. |
| Test flag → Delete override | Review the scope/inherited-value consequence, then confirm only for a disposable sandbox override. Pending actions cannot be repeated. |
| Bulk by key prefix | Review action, prefix and global scope before Apply. Cancel sends nothing. Pending Escape cannot dismiss; rejected save preserves review/reason. Use an isolated test prefix only. |
| `/ai-health` in development | Independently fail overview, trends and governance; retry each. No false zero traffic or false unhealthy governance while unavailable. |

One package remains: final verification, starting at Pass 22 as requested. Authenticated/live-service checks remain a separate acceptance step until sign-in testing resumes.

## Pending acceptance recheck — Passes 22–25 (2026-10-16)

Branch: `feature/web-edge-cases`. This is the requested pre-final check, not a declaration that live acceptance is complete.

Live shared-browser checks used the signed-in test account at localhost:5173. Confirmed `getPreviewSession()` was null, so these were not the dev preview fixtures. Overview loaded after navigation/reload, the Streak popup showed 1 day and 0 reflections/stories, and the ordinary-account feature-flags route showed its permission message. The subsequent reconnected check below corrects the earlier network conclusion: the shared provider still requests the admin list. Quick tools accepted Play/Stop and keyboard volume changed 50 → 51 → 50. The account deletion dialog opened at 448px with Cancel initially focused and dismissed via Escape; no account deletion or logout was submitted. Physical audio output was not independently verified.

Found a playback-error regression: Stop clears the audio source, which can emit a native media error; idle preference loading can also emit errors before a playback request. Playback errors are now reported only while playback was requested. A regression test failed before the fix and passed afterward; real requested failures still report once. The music/QuickTools regression group passed 22 tests. Browser recheck of the fix remains pending.

The first full unit run had 12 failures (1700 passed, 10 already skipped). Rerunning the seven failing suites with two workers left only three reproducible assertions: two badge tests were checking the ThemeProvider backdrop instead of the badge, and the auth-layout test was also inspecting the wrapper's first child. The badge tests now render the pure component directly; the auth-layout test targets the actual panel. Other first-run failures passed at lower concurrency without product changes.

The shared browser disconnected during subsequent privacy/settings checks. Both evaluate and preview_open explicitly reported no connected T3 automation host. No fresh browser was substituted for the signed-in session, and no unobserved result is counted as passed.

| Remaining live check | Where / limits |
| --- | --- |
| Playback regression, disc state, focus return, mobile and reduced motion | Quick tools; confirm Stop produces no failure toast and playback failures still do. |
| Session/profile recovery and privacy dialog focus restoration | Protected route / Settings → Privacy; HTTP-mocked tests cover failures, races and pending guards. Live destructive operations were not executed. |
| Saved onboarding answers and resume | Direct onboarding revisit route (no current Settings entry point); no server onboarding mutation executed in this recheck. |
| Verification and 2FA delivery/return path | Needs test email/authenticator access; automated HTTP-mocked coverage is separate from real delivery. |
| Invite link, feedback cancellation/failure, Insights recovery | Shared utility dialogs; no invitations or feedback sent. |
| Administrative live-service acceptance | Requires an authorized sandbox admin and disposable flags; ordinary-account denial verified, mutation behavior covered by HTTP mocks. |

Final automated result for this recheck: `npm test -- --maxWorkers=2` passed all 324 suites, with 1713 tests passed and 10 existing skips (in the Add story composer suite). Production build passed with existing large-chunk and stale browser-mapping warnings. ESLint passed for all four changed source/test files; scoped whitespace checks passed. The browser disconnection and live limits above remain unresolved; do not mark final acceptance complete from these automated results alone.

### Reconnected browser follow-up (2026-10-16)

The same signed-in T3 preview reconnected. Verified in the actual app:

- Quick tools: disc animation is running during playback, paused after Stop, and Stop no longer produces a failure toast. At 390×844 the sheet is 390px wide at x=0 and the document has no horizontal overflow. Restored desktop 1280×800 afterward.
- Privacy: logout confirmation initially focuses Cancel and dismisses with Escape. Found that both privacy dialogs lost focus on dismissal. Added explicit return-to-opener handling following the existing InviteFriends pattern. Two regression tests failed before the fix and passed after; browser confirmed Log out receives focus after Escape. No logout/delete request was submitted.
- Invite friends: real referral details loaded with zero signups. Temporarily rejected only the local Axios referral request with a simulated 503; dialog exposed Try again. Removed the interceptor, clicked Try again, and real details returned with Copy enabled. This tests browser recovery with a simulated failure and real successful retry, not an actual server outage. The injected interceptor was removed.
- Feedback: opened the registered dialog, entered a temporary message, and cancelled. No feedback sent.
- Insights: the registered overlay loaded summary, 5% enrichment, 0 memories, 1-day streak and the empty beneficiary/activity states. No synthetic metrics were injected.
- Onboarding: the direct `/onboarding/misc?mode=revisit` route loaded its question form for the current account. Source inspection found no current Settings revisit control; corrected the earlier test instructions. Saving, skip persistence and cross-account resume remain HTTP-mocked coverage rather than live acceptance.
- Unknown route rendered the actual 404 with Go back and Overview actions.
- AI Health: live backend denied metrics/trends/governance with 403, and each section offered Retry. Found SLO percentage targets falsely rendered 0.0% without data. Changed missing percentage formatting to `--`, with a failing-then-passing regression that also verifies real zero targets still render 0.0%. Browser confirmed unavailable targets now display `--`.

**Unresolved integration finding:** `FeatureFlagsProvider` (the ordinary application provider, separate from `FeatureFlagsAdminProvider`) requests `GET /feature-flags?page=1&limit=200` for every authenticated user. Live network evidence shows 403 on reloads. API route inspection confirms list is admin-only; `/feature-flags/evaluate/:key` is the authenticated per-user endpoint. The admin-page denial test was valid for that page/provider but did not establish absence of global list requests. Correct this runtime integration and add application-provider coverage before final sign-off; do not weaken the API admin guard.

Targeted validation: 28 tests passed across privacy recovery, AI Health, invites, feedback, flags allowlist and admin-page suites. The expanded AI Health zero-target regression subsequently passed again. Scoped ESLint and whitespace checks passed. The earlier 324-suite full run remains the broad baseline; it predates these two small fixes. Real email/2FA, destructive account operations, cross-account login and privileged admin mutations were not performed. Reduced-motion behavior and physical audio output were not independently verified in this live pass.
Production build after both follow-up fixes passed (existing chunk-size warnings). Left the shared browser signed in on Overview at 1280×800 with no temporary request interceptor installed.

## Pass 26 — final verification, user-facing scope (2026-10-16)

User explicitly deferred the admin panel and related feature-flags integration to a separate task. No administrative implementation or API changes were made in this final pass. The known ordinary-user flag-list 403 remains recorded above and is excluded from this scoped sign-off, not considered fixed.

Verified additional browser recovery on the real onboarding revisit route: a temporary client-side rejection of `/users/onboarding-details` produced exactly one observed saved-answer error toast, exposed Retry and disabled Continue. Removed the interceptor, retried against the live API, and verified Retry disappeared and answer controls became available. No onboarding completion/skip request was sent. Temporary interception and toast-observer state were removed.

Quick tools keyboard volume reached 0 with Home and 100 with End. Reloaded Overview afterward to reset the session-local volume; no music preference was saved. The existing CSS explicitly disables disc animation for prefers-reduced-motion, but OS-level reduced-motion behavior remains a manual check. No new motion implementation was needed.

### Acceptance boundaries and final manual checklist

| Area | Verified evidence | Remaining real-world check |
| --- | --- | --- |
| Session and profile recovery | Routed HTTP-mocked tests cover failures, stale refresh races and safe return paths; live session survives navigation/reload. | Expiry/refresh outage in a disposable session and real 2FA return flow. |
| Privacy confirmations | Browser cancellation and focus restoration; HTTP-mocked pending/failure/success tests. | Actual account deletion and all-device logout only on disposable accounts. |
| Onboarding | Browser simulated failure → live Retry; routed saved-state, skip and completion tests. | Real saved-answer changes/skip persistence and a second account for draft isolation. Use `/onboarding/misc?mode=revisit`; there is no current Settings entry point. |
| Shared utilities | Browser music Stop/disc, keyboard volume, mobile sheet sizing, invite Retry, feedback cancellation and real Insights data; HTTP-mocked failure tests. | Listen to output and test OS reduced motion. Real feedback delivery was not submitted. |
| Verification delivery | Automated code-form/2FA state and redirect coverage. | Real email inbox/authenticator access required. |
| Administration | Deferred by the user. | Admin panel, flag-provider 403 integration and privileged service acceptance belong to a separate task. |

No release, merge, deployment or external message was performed. This closes the final verification work within the agreed user-facing scope; it does not claim completion of the explicitly listed manual/service checks.

Final verification result: `npm test -- --maxWorkers=2` passed all 324 suites: **1717 passed, 10 existing skips** (1727 total). The skips are existing Add story assistant cases, not counted as passing. Production build passed with existing chunk-size/browser-mapping warnings. Scoped lint passed for the reviewed user-facing session, onboarding, verification, privacy and shared-utility files; audit whitespace checks passed.

## User-assisted manual acceptance (2026-10-16)

- User confirmed Moonlight was audible through their output device. Stopped playback afterward. The OS reduced-motion check is explicitly deferred: user cannot change the setting right now; browser media query remains false.
- Live onboarding nickname save: changed Groot to a temporary QA nickname through the real form; verified the server value and reloaded form, then restored Groot through the form and verified the server value. No mocked transport.
- Live Skip on this already-completed account returned to Overview; server onboarding status remained completed. This verifies revisiting a completed account, not a fresh account's incomplete → skipped transition.
- Same-account draft resume: backed up the account's existing onboarding session draft, typed a temporary marker in step 2, reloaded the route and verified both step and text restored. Navigated away, restored the original draft byte-for-byte and removed the test backup. No summary submission occurred.
- Called the application's actual refreshAccessToken service against the live backend, without printing tokens; refresh succeeded. Reloading the protected Security route retained the signed-in session. Automatic expiry-trigger and outage timing remain separate mocked coverage.
- Security showed no configured authenticator. Opened the real setup dialog for user-assisted pairing; setup completion and protected-page login return are pending the user's code entry. No setup key was copied to the transcript.
- User confirmed access to the test inbox and a second test account. Cross-account draft isolation and email delivery are next, after 2FA setup.

2FA follow-up: user completed authenticator setup in Brave. Refreshed the shared T3 Security route and independently confirmed the live profile has `two_factor.enabled === true`, the page reports the authenticator is set up, and Turn off 2FA is available. Setup completion is now verified across browsers. Preparing user-assisted login return-path validation; no authenticator secret or code was read or logged.

### Second-account and 2FA follow-up

- User confirmed password + authenticator login works. The shared preview returned to the requested `/settings/security?qa=return#security-check`, preserving path, query and fragment.
- Cross-account onboarding draft isolation passed using two real authenticated accounts. Backed up both account-scoped session drafts, entered a temporary marker in the first account, logged out through the real profile menu, and signed in through the real login form as the second account. Its About field was empty and did not contain the first account marker. The original marker remained under the first account's key. Navigated away and restored both original draft values byte-for-byte, removing absent-original keys. No onboarding summary was submitted. This establishes cross-account separation and retained storage, not an additional first-account re-login/resume check.
- Submitted the second account's recovery-email request through the real Forgot password form. Subsequent browser inspection showed the Enter a new password screen. Inbox receipt/code entry confirmation is pending the user; no password reset was submitted. No recovery token or credential is included in this audit.
- Shared browser currently uses the second test account. OS reduced motion remains deferred; admin work remains excluded.

Recovery delivery confirmation: user confirmed the second account received the email and its code was accepted. Together with the observed Enter a new password screen, real recovery-email delivery and code verification are now verified. Stopped before resetting the password; reset submission itself remains automated coverage.

### Live all-device logout check

Re-ran the four routed privacy regression tests: all passed. User confirmed a second session for the same test account in Brave. Submitted Log out of all devices through Settings → Privacy & Account in the shared preview; it returned to `/login`. Cross-browser revocation is pending the user's reload/check in Brave. Permanent account deletion has not been submitted and awaits explicit disposable-account confirmation.

All-device logout confirmed: user refreshed the same account's Brave session and reported that it redirected to sign-in. Both the initiating shared preview and independent Brave session lost authenticated access. Live cross-browser logout is now verified. Account deletion remains unexecuted pending confirmation that the test account may be permanently deleted.

### Live permanent account deletion

User explicitly authorized permanent deletion of the disposable second test account. Signed back in through the real login form, verified the active profile matched the authorized account, opened Settings → Privacy & Account → Delete account, and submitted I understand, delete. The app returned to `/login`. A new login attempt using the credentials that had just succeeded was rejected with User not found. Direct navigation to protected `/settings/privacy` returned to sign-in with the login form visible. Left the shared preview signed out with the test password cleared by navigation.

This verifies live deletion submission, immediate loss of access, rejection of fresh login, and protected-route guarding. It does not independently verify completion of asynchronous storage cleanup or retention/anonymization of delivered capsules. No original-account deletion, admin changes, or password reset was performed. The four routed privacy regression tests passed before the live checks.

### Test account recreation and fresh onboarding skip

At the user's request, recreated the deleted test account through the registration UI with the same email/password and display name Kea Learn. Registration succeeded; user completed email verification in the shared app. Clicked the real welcome-page Skip action. Browser reached `/overview`, and a fresh profile request confirmed `onboarding_status: skipped` for the recreated account. This adds live fresh-account skip persistence evidence beyond the earlier already-completed-account revisit check. Shared preview remains signed in to the recreated test account.
