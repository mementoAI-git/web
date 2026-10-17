# Agent Prompt — Build Memento People (Web Only)

You are working inside the existing Memento codebase.

Implement the new **People** experience on **web only** using the existing Memento design system, components, patterns, data structures, and backend services wherever possible.

Do not redesign mobile.

Before changing code, inspect the existing implementation for:
- People / beneficiaries
- invites
- groups
- story visibility / sharing
- memories
- AI chat
- navigation
- existing responsive behavior
- current design tokens and components

Reuse existing behavior instead of rebuilding it.

---

## Product Model

People is Memento’s private relationship layer.

Every person is a normal Memento user.

Each accepted connection gets one private **Shared Space**.

The core model is:

**My Memento + Your Memento + Our Space**

A Shared Space exists whether either person has activated their Memento for connection-facing AI conversation.

People must not feel like Messenger, WhatsApp, Slack, or a social network.

---

## Core Principles

- Private
- Invitation-based
- Memory-first
- Share this, not me
- Shared context is explicit
- Conversations with another person’s Memento are private from the Memento owner

---

## Existing Systems — Reuse, Do Not Rebuild

### Invites
Use the existing invite flow for:
- inviting new users
- connecting existing Memento users
- pending invitations

Do not create a second invite system.

### Groups
Use the existing group system for sharing with multiple people.

Do not create a new group model.

### Story Sharing
Keep the existing visibility options:
- Individuals
- Groups
- Everyone
- No one / Private

Extend the existing sharing behavior so it populates the relevant Shared Spaces.

Examples:

**Shared with Tunde**\
→ appears in Wisdom + Tunde — Our Space

**Shared with Family**\
→ appears in the Shared Space for each eligible Family member

**Shared with Everyone**\
→ appears in all eligible Shared Spaces according to the existing rule

**Private / No one**\
→ appears in no Shared Space

If sharing permissions change, update Shared Space visibility and future AI context.

Do not duplicate memory objects. Shared Spaces should reference the existing source item.

---

## Web Layout

When People is open:

### Column 1 — Global Nav Rail
Collapse the existing Memento sidebar to icon-only navigation.

Do not change global navigation behavior outside the People section.

### Column 2 — People Sidebar
Show:
- People
- Search
- Connections
- Pending invites where relevant
- Invite someone

Each connection row may show:
- avatar
- name
- relationship label or simple metadata

Do not show:
- unread badges
- last-message previews
- chat timestamps
- online status
- typing indicators

### Column 3 — Relationship Workspace
Show:
- selected person
- Memento activation state
- Talk
- Our Space

If no person is selected, show a quiet default state.

---

## Default States

### No Connection Selected

**Your people**

“Choose someone to open your shared space.”

Secondary CTA:
`Invite someone`

### No Connections

**No connections yet**

“Invite someone you trust to start a shared space.”

CTA:
`Invite someone`

Use the existing invite flow.

---

## Connection Header

When a connection is selected, show:
- avatar
- name
- relationship label if available
- Memento activation state
- overflow menu

Tabs:
- Talk
- Our Space

Default tab:
- active Memento → Talk
- inactive Memento → Our Space

---

# Talk

## Active Memento

Allow:
- text conversation
- voice input
- voice call
- attachment control where already supported

The conversation may use only:
1. connection-facing context approved by the Memento owner
2. this relationship’s Shared Space

Do not use unrelated private context.

When the AI uses a specific Shared Space item, surface an inline reference:

**From Our Space**\
`View memory`

Opening it should show the referenced shared item.

Empty state:

**Start a private conversation with Tunde’s Memento.**

“Responses are grounded in what Tunde has made available and the memories in your shared space.”

### Privacy Rule

If Wisdom talks to Tunde’s Memento:
- Tunde cannot see the conversation.

If Tunde talks to Wisdom’s Memento:
- Wisdom cannot see the conversation.

Do not expose owner-facing transcripts or conversation activity.

---

## Inactive Memento

Show:

**Tunde’s Memento isn’t available yet.**

“You can still keep memories together in Our Space.”

Actions:
- `Leave something for Tunde`
- `Explore Our Space`

Do not show:
- composer
- voice call
- simulated AI

Shared Space remains fully usable.

---

# Our Space

Our Space is a simple chronological relationship archive.

Do not turn it into a dashboard.

### Header

**Our Space**

“Things you and Tunde have chosen to keep together.”

CTA:
`Add something`

### Filters
- All
- Stories
- Photos
- Voice
- Videos
- Notes

### Timeline
Use one chronological stream.

Default:
- newest first

Each item should show:
- contributor
- item type
- date
- content preview
- source where relevant
- overflow menu

Items may enter Our Space through:
- direct contribution
- existing story sharing
- group sharing
- sharing from personal Memento

Do not add:
- dashboard cards
- engagement metrics
- mandatory chapters
- separate Recent section
- social reactions

---

# Add Something

Actions:
- Record something
- Write something
- Add photos or video
- Share from my Memento

For **Share from my Memento**:
- use the existing memory picker or sharing flow
- reference the original memory
- do not create duplicates
- preserve original author, source, and date where relevant

For group sharing:
- reuse existing group logic
- do not require manually adding the same item to multiple Shared Spaces

---

# Shared Item Detail

Show:
- full content
- contributor
- original date
- shared date if different
- source
- related media
- overflow actions

Possible actions:
- View original memory where permitted
- Remove from Our Space where allowed
- Open related Talk context

Always preserve provenance.

---

# External Contributions

If one person adds a memory about the other, preserve perspective.

Example:

**Wisdom remembers Tunde as adventurous.**

Do not silently convert that into:

**Tunde is adventurous.**

External contributions are valid Shared Space context.

They must not automatically become authoritative facts in the recipient’s private Memento.

If the product later supports accepting external contributions into the personal Memento, that must be an explicit action by the recipient.

---

# Memento Activation

Having a Memento account does not make the user’s Memento available to connections.

Activation must be explicit and opt-in.

States:

### Private
Memento unavailable to connections.

### Ready to Activate
Enough approved context exists for a useful connection-facing experience.

### Active
Approved connections can converse with the user’s Memento.

Activation UI should explain:
- activation is optional
- private conversations remain private
- activation can be reversed
- Shared Spaces continue working regardless

Deactivation:
- disables Talk
- keeps Shared Spaces
- keeps shared items

---

# Connection Settings

Keep this lightweight.

Include:
- relationship label
- Memento availability state
- contribution summary
- Shared Space privacy/help
- remove connection
- block connection if already supported

Contribution summary should only expose the current user’s contribution.

Example:

**Your contributions**
- 8 stories
- 3 voice memories
- 24 photos

Optional:

**Context you’ve added**
- University years
- Lagos
- Friendship

Do not expose the other person’s private Memento understanding.

---

# Pending Connections

Reuse the existing pending invite logic.

Sidebar:
- name or email
- Pending

Main area:
**Invitation pending**

Actions:
- Resend invite
- Cancel invite

Do not create a Shared Space until the invitation is accepted.

---

# Required Permission Behavior

### Individual
Story shared with one person:
- expose it in that relationship’s Shared Space

### Group
Story shared with a group:
- expose it in each eligible member’s Shared Space

### Everyone
Expose it to all eligible connections according to the current product rule.

### Private
Expose it to no Shared Space.

### Permission Change
If a story becomes unavailable:
- remove it from affected Shared Spaces
- remove it from future connection-facing AI context

Do not keep stale derived access.

---

# Edge Cases

Handle:

### Connection Removed
- Shared Space becomes inaccessible
- follow existing retention rules
- do not merge shared items into either private Memento

### Memento Deactivated
- Talk becomes unavailable
- Our Space remains intact

### Story Made Private
- remove it from affected Shared Spaces
- remove it from future connection-facing AI context

### Group Membership Changed
- recalculate access using existing group rules

### Source Memory Deleted
- follow existing deletion behavior
- remove stale references from Shared Space and AI context

### Blocked User
- remove interaction access
- follow existing block behavior

---

# Design Requirements

Use the existing Memento web design system.

The People experience should feel:
- quiet
- minimal
- private
- spacious
- editorial
- focused

Do not introduce a new visual language.

Avoid messenger conventions.

Use the existing component library, typography, spacing, radii, tokens, navigation patterns, modals, menus, inputs, and responsive primitives wherever possible.

Do not make unrelated visual changes.

---

# Non-Goals

Do not build:
- direct user-to-user messaging
- public profiles
- public people discovery
- followers/following
- social feeds
- online presence
- read receipts
- typing indicators
- engagement metrics
- group Shared Spaces
- a new invite flow
- a new group system
- a new story-sharing system
- mobile People redesign

---

# Implementation Approach

1. Inspect the existing code and identify reusable models, routes, components, APIs, and sharing logic.
2. Document the minimum data-model changes required before implementation.
3. Extend existing sharing logic rather than duplicating it.
4. Implement the web People layout and states.
5. Wire Shared Spaces to existing story visibility and group rules.
6. Implement active/inactive Memento states.
7. Wire Talk to the allowed relationship context only.
8. Preserve all existing mobile behavior.
9. Test permission changes, deletions, group membership changes, and connection removal.
10. Avoid unrelated refactors.

If an existing implementation conflicts with this specification, preserve the existing behavior until you can clearly identify the conflict and the minimum migration required.

Do not invent new product behavior where this specification is silent. Flag the gap instead.

---

# Acceptance Criteria

The implementation is complete when:

- People uses the three-column web architecture.
- Global navigation collapses to an icon rail inside People.
- Existing invite flow is reused.
- Existing groups are reused.
- Existing story sharing populates Shared Spaces correctly.
- Every accepted connection has one Shared Space.
- Our Space shows a simple chronological timeline with filters.
- Shared items retain provenance.
- Active Mementos expose Talk.
- Inactive Mementos do not expose chat or voice call.
- Conversations are private from the Memento owner.
- Talk only uses allowed connection-facing context plus Our Space.
- Story permission changes update Shared Space and AI access.
- Private stories never appear in Shared Spaces.
- No messenger-style social mechanics are introduced.
- Existing mobile behavior is unchanged.
