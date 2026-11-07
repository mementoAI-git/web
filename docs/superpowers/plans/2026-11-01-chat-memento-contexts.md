# Fuse People into Chat

Goal: implement the supplied web IA specification without changing mobile routes or personal Chat storage.

Architecture: retain the current /chat/:id personal route and identify a connection with the `person` query parameter. Switching clears voice/starter parameters and preserves the personal route. The existing viewer + owner People conversation remains the source of connection history. Reuse the Chat composer, live audio runtime, dialogs, contribution flow and Our Space.

- [x] Replace Chat workspace tabs with a relationship-first Memento switcher, including invites, activation, blocked people and pending invite management.
- [x] Render the connection conversation within Chat, with a persistent split-target identity pill, details and Our Space dialogs, history-first loading and inactive states.
- [x] Add viewer-specific saved names to SharedSpace, keeping relationship labels and all previous API fields compatible.
- [x] Extend the shared composer for context-specific placeholder and voice targeting. Support viewer-owned attachments in private connection turns.
- [x] Scope existing live voice tokens and persistence to approved connection context; disable host tools and host transcript persistence for connection sessions.
- [x] Redirect legacy People web routes into Chat. Preserve personal and mobile behavior.
- [x] Test context switching, history/loading, inactive state, source access, saved-name isolation, and connection voice privacy; run relevant regressions, type checks/build and inspect the running app.

Verification: routed web preview checked for active/inactive contexts, identity body versus chevron, detail/Our Space overlays and returning to My Memento. HTTP-mocked frontend and database-backed API tests cover history, isolation and revocation. Live AI/microphone calls were not exercised. Full web typecheck retains existing unrelated errors. Mobile source was not modified.

Figma refinement: inspected nodes 19521:1064682, 19521:1064830 and 19521:1065028 from PB2juKDkMjHm23TYWKiA6Q. Reused the existing exact book, person and grid assets through shared starter cards; composed existing Chat bubbles for history; matched the compact pill, empty-state type and relationship-first switcher. Kept live avatars dynamic and excluded the design’s unread count to preserve the supplied product rules.

## Accepted page-feedback changes — 2026-11-01

These supersede the original inactive-state and new-message privacy requirements for web:

- Header switcher shows the selected Memento avatar and saved name; personal context uses the current user’s avatar/name.
- Connection empty state retains the centered split identity pill, first-name heading, two grid starter cards, and the plus/microphone/send composer treatment from the supplied image.
- Chat is the relationship space. Existing shared memories and AI replies appear in one chronological stream, with existing filters, source references and sharing actions. Opening Our Space focuses the inline stream instead of opening a workspace overlay.
- User confirmed: everything newly added in connection Chat is shared with that person. New text, attachments and voice input become existing Shared Space memory objects. AI replies and historical private transcripts remain viewer-private; no retrospective sharing.
- User confirmed: Private Mementos can chat using shared memories only. Unactivated approved profile context is never included. The web explicitly opts into this mode; existing mobile requests retain activation gating.
- A failed AI reply can be retried without creating another copy of an already-successful shared contribution.

Validation includes header context switching, private-profile empty Chat with a composer, inline shared history, shared input/reply retry, shared-only AI context exclusion, voice contribution visibility, and legacy activation behavior.

Page-feedback verification: all 47 People/ephemeral-token API tests passed; API compilation passed. Focused web suites passed (63 tests in the broader run, 22 relationship regression tests, and 11 final Chat flow tests, with overlap). Production web build and scoped ESLint passed. Browser verification used isolated local fixtures at 1440×819, covering the empty state, shared-only composer, chronological feed, identity switching and inline Our Space. Full web typecheck remains blocked by existing errors (458 diagnostic lines; no new diagnostics in the changed Chat/Shared Space UI). Live AI and microphone calls were not exercised. Web and API changes must ship together.

## Second page-feedback pass — 2026-11-01

- Removed topic-mode composer overrides. Connection Chat uses the existing personal ConversationChatinput mode, including its call button, attachment picker and microphone.
- Both contexts share 810px content/composer layout constants, padding and sticky footer. Browser comparison measured identical composer positions and 778×146px surfaces at a 1440px viewport.
- Removed the floating identity and footer caption. A filled 40px navbar pill displays relationship/count subtext; body opens details, chevron opens My people.
- A one-time introductory modal explains private/ready profile limits. “I understand” persists per viewer/connection in this browser and returns focus to the composer. Text/calls remain available even with a legacy available=false history response.
- Text and voice prompts support listening and asking questions without offering unapproved personal facts; private-context exclusion remains enforced.
- Verified 28 web tests and 23 API tests (the database setup timeout passed on retry), web build, API compilation and scoped UI lint. Browser verified modal acknowledgement, call control, header interactions, duplicate/footer removal and matching geometry. Live AI/microphone calls were not tested. Localhost targets the hosted development API, which still needs the coordinated API deployment.
