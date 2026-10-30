# Memento — People Feature Build Checklist

_Last updated: October 10, 2026_

## Phase 1 — Audit Existing Systems

- [ ] Review current People / beneficiary implementation
- [ ] Review invite flow
- [ ] Review group creation and membership logic
- [ ] Review story visibility rules
- [ ] Review memory object structure
- [ ] Review AI chat architecture
- [ ] Review web navigation behavior
- [ ] Confirm existing mobile behavior that must remain unchanged
- [ ] Identify reusable components, routes, APIs, and data models
- [ ] Document only the minimum schema changes required

**Exit criteria:** existing systems are mapped to the new People model without duplicating functionality.

---

## Phase 2 — Data Model + Shared Space Foundation

- [ ] Confirm or create Connection model
- [ ] Confirm one accepted connection maps to one Shared Space
- [ ] Add Shared Space model if missing
- [ ] Add Shared Item Reference model if missing
- [ ] Preserve source memory references instead of duplicating content
- [ ] Preserve contributor and source provenance
- [ ] Add Memento activation state
- [ ] Add or extend private connection conversation model
- [ ] Ensure schema changes do not break mobile

**Exit criteria:** accepted connections can reliably resolve to one Shared Space and shared items can reference existing memories.

---

## Phase 3 — Connect Existing Sharing Logic

- [ ] Reuse existing individual story sharing
- [ ] Reuse existing group sharing
- [ ] Reuse existing Everyone visibility
- [ ] Reuse existing Private / No one visibility
- [ ] Populate relevant Shared Spaces from existing sharing decisions
- [ ] Avoid duplicate memory records
- [ ] Update Shared Space access when story permissions change
- [ ] Recalculate access when group membership changes
- [ ] Remove Shared Space access when a story becomes private
- [ ] Remove stale AI context when access is revoked

**Exit criteria:** story visibility is the single source of truth for Shared Space availability.

---

## Phase 4 — People Web Layout

- [ ] Collapse global Memento sidebar to icon-only rail inside People
- [ ] Add People-specific second sidebar
- [ ] Add People search
- [ ] Show accepted connections
- [ ] Show pending invites where relevant
- [ ] Reuse existing Invite flow
- [ ] Add default state when no connection is selected
- [ ] Add empty state when the user has no connections
- [ ] Add selected relationship workspace
- [ ] Add Talk / Our Space tabs
- [ ] Keep mobile layout untouched

**Exit criteria:** web People uses the three-column structure and does not resemble a messenger inbox.

---

## Phase 5 — Our Space

- [ ] Add Our Space header
- [ ] Add `Add something`
- [ ] Add filters:
  - [ ] All
  - [ ] Stories
  - [ ] Photos
  - [ ] Voice
  - [ ] Videos
  - [ ] Notes
- [ ] Build single chronological timeline
- [ ] Default timeline to newest first
- [ ] Show contributor
- [ ] Show item type
- [ ] Show date
- [ ] Show content preview
- [ ] Show source where relevant
- [ ] Add overflow actions
- [ ] Add empty Shared Space state
- [ ] Support direct contribution
- [ ] Support sharing from personal Memento
- [ ] Reuse existing media/memory creation flows where possible
- [ ] Preserve provenance on every item

**Exit criteria:** Our Space works as a simple shared chronological memory stream.

---

## Phase 6 — Shared Item Detail

- [ ] Show full shared content
- [ ] Show contributor
- [ ] Show original date
- [ ] Show shared date if different
- [ ] Show source
- [ ] Show related media
- [ ] Support `View original memory` where permitted
- [ ] Support removal from Our Space where permitted
- [ ] Support opening related Talk context
- [ ] Preserve provenance

**Exit criteria:** every shared item can be traced back to its source and contributor.

---

## Phase 7 — Memento Activation

- [ ] Add activation states:
  - [ ] Private
  - [ ] Ready to Activate
  - [ ] Active
- [ ] Make activation explicit and opt-in
- [ ] Add activation CTA
- [ ] Explain that activation is optional
- [ ] Explain that private chats remain private
- [ ] Allow deactivation
- [ ] Keep Shared Spaces intact after deactivation
- [ ] Keep shared memories intact after deactivation

**Exit criteria:** account ownership and connection-facing Memento availability are clearly separate.

---

## Phase 8 — Talk / Active Memento

- [ ] Build private conversation view
- [ ] Add text input
- [ ] Add voice input
- [ ] Add voice call entry point
- [ ] Reuse attachment behavior where supported
- [ ] Scope AI context to:
  - [ ] approved connection-facing base context
  - [ ] current relationship’s Shared Space
- [ ] Exclude unrelated private memories
- [ ] Exclude revoked content
- [ ] Exclude deleted content
- [ ] Add inline `From Our Space` references
- [ ] Make memory references open the correct shared item
- [ ] Add empty conversation state
- [ ] Ensure owner cannot access the conversation transcript

**Exit criteria:** Talk works only from approved context and remains private from the Memento owner.

---

## Phase 9 — Talk / Inactive Memento

- [ ] Show inactive state
- [ ] Show `Leave something for Tunde`
- [ ] Show `Explore Our Space`
- [ ] Hide text composer
- [ ] Hide voice call
- [ ] Do not simulate AI responses
- [ ] Keep Our Space fully usable

**Exit criteria:** inactive Memento state is honest and still useful.

---

## Phase 10 — External Contributions

- [ ] Preserve contributor perspective
- [ ] Do not treat another person’s memory as an authoritative personal fact
- [ ] Store external contributions as Shared Space context
- [ ] Keep provenance visible
- [ ] Do not block current build on personal-Memento acceptance
- [ ] If acceptance exists, make it explicit and recipient-controlled

**Exit criteria:** external memories enrich relationship context without silently rewriting identity.

---

## Phase 11 — Connection Settings

- [ ] Add relationship label
- [ ] Show Memento availability state
- [ ] Show contribution summary
- [ ] Add Shared Space privacy/help
- [ ] Reuse existing remove connection behavior
- [ ] Reuse existing block behavior where supported
- [ ] Do not expose the other person’s private Memento understanding

**Exit criteria:** relationship management stays lightweight.

---

## Phase 12 — Edge Cases + Permission Integrity

- [ ] Connection removed
- [ ] User blocked
- [ ] Memento deactivated
- [ ] Story made private
- [ ] Story sharing expanded
- [ ] Story sharing reduced
- [ ] Group membership added
- [ ] Group membership removed
- [ ] Source memory deleted
- [ ] Pending invitation cancelled
- [ ] Pending invitation accepted
- [ ] Stale AI context invalidated
- [ ] Shared item source unavailable
- [ ] Permission changes reflected without duplication

**Exit criteria:** Shared Space visibility and AI context always match current permissions.

---

## Phase 13 — Mobile Regression Check

- [ ] Verify no mobile People UI changes
- [ ] Verify no mobile navigation changes
- [ ] Verify older mobile clients ignore new fields safely
- [ ] Verify shared backend changes do not break existing mobile flows
- [ ] Verify story sharing still works on mobile

**Exit criteria:** mobile behavior remains unchanged.

---

## Phase 14 — Final QA

- [ ] People layout matches Memento design system
- [ ] No new visual language introduced
- [ ] No messenger-style interaction patterns
- [ ] No unread badges
- [ ] No online status
- [ ] No typing indicators
- [ ] No read receipts
- [ ] No public discovery
- [ ] No direct messaging
- [ ] No duplicate memories
- [ ] Shared items retain provenance
- [ ] Private stories never appear in Shared Spaces
- [ ] Talk only appears for active Mementos
- [ ] Private conversations are inaccessible to Memento owners
- [ ] Inline memory references resolve correctly
- [ ] Permission changes propagate correctly
- [ ] Empty/loading/error states are covered

**Exit criteria:** feature is ready for product review.

---

## Suggested Review Milestones

### Milestone 1
Phases 1–3 complete\
**Review:** architecture, data model, permission mapping

### Milestone 2
Phases 4–6 complete\
**Review:** People layout + Our Space

### Milestone 3
Phases 7–9 complete\
**Review:** activation + Talk experience

### Milestone 4
Phases 10–12 complete\
**Review:** external contributions + edge cases

### Milestone 5
Phases 13–14 complete\
**Review:** regression + final QA

---

## Definition of Done

The People feature is complete when:

- accepted connections have one Shared Space,
- existing invite, group, and story-sharing systems are reused,
- Shared Spaces are populated from existing sharing decisions,
- Our Space works as a simple chronological shared memory stream,
- active Mementos expose private Talk,
- inactive Mementos do not expose chat,
- connection-facing AI uses only allowed context,
- private conversations remain invisible to the Memento owner,
- permission changes update Shared Space and AI access,
- no messenger or social-network mechanics are introduced,
- mobile behavior remains unchanged.
