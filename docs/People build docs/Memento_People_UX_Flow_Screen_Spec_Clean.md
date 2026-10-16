# Memento — People UX Flow & Screen Specification

_Last updated: October 10, 2026_

## 1. Scope

This document defines the **web-only** UX for the People feature.

It covers:
- People navigation
- Connection states
- Talk
- Our Space
- Memento activation
- Connection settings
- Shared Space population from existing story-sharing rules

Reuse Memento’s existing design system and interaction patterns.

Do **not** redesign:
- Invite flow
- Group creation/management
- Story sharing controls
- Mobile People

---

## 2. Existing Systems to Reuse

### Invite
Use the existing invite flow for:
- inviting a new person,
- connecting with an existing Memento user,
- pending invitations.

Do not create a new invite flow inside People.

### Groups
Use the existing group system for:
- Family
- Friends
- custom groups

Groups remain the existing mechanism for sharing one item with multiple people.

### Story Sharing
Keep the current story visibility options:
- Individuals
- Groups
- Everyone
- No one / Private

These rules should populate Shared Spaces.

Examples:

**Shared with Tunde**\
→ appears in **Wisdom + Tunde — Our Space**

**Shared with Family**\
→ appears in the Shared Space for each eligible Family member

Do not create a second story-permission system inside People.

---

## 3. Information Architecture

### Column 1 — Global Navigation
When People is open, collapse the main Memento sidebar to icons only.

Keep the existing global destinations.

### Column 2 — People Sidebar
Contains:
- People
- Search
- Connections
- Pending invites where relevant
- Invite someone

Do not show:
- unread badges,
- last-message previews,
- online status,
- chat timestamps.

### Column 3 — Relationship Workspace
Contains:
- selected person,
- Memento state,
- `Talk`,
- `Our Space`.

---

## 4. People Default State

### Purpose
Give the user a simple entry point into their connections.

### Main Area
If no person is selected:

**Your people**

“Choose someone to open your shared space.”

Secondary action:
`Invite someone`

### Empty State
If there are no connections:

**No connections yet**

“Invite someone you trust to start a shared space.”

CTA:
`Invite someone`

### Rules
- Reuse the existing invite flow.
- Do not make this feel like an inbox.

---

## 5. Connection Selected

### Purpose
Provide the workspace for one relationship.

### Header
- Avatar
- Name
- Relationship label, if available
- Memento state
- Overflow menu

### Tabs
- Talk
- Our Space

### Default Tab
If the connection’s Memento is active:
- open **Talk**

If inactive:
- open **Our Space**

---

## 6. Talk — Active Memento

### Purpose
Allow a private conversation with the selected person’s Memento.

### Components
- Conversation area
- Text input
- Voice input
- Voice call action
- Attachment control where supported
- Inline memory references

### AI Context
The conversation may use:
1. connection-facing context approved by the Memento owner,
2. items in this relationship’s Shared Space.

It must not use unrelated private context.

### Memory Reference
When an answer uses a shared item, show:

**From Our Space**\
`View memory`

Selecting it opens that item.

### Empty State
**Start a private conversation with Tunde’s Memento.**

“Responses are grounded in what Tunde has made available and the memories in your shared space.”

### Privacy
The Memento owner cannot view this conversation.

---

## 7. Talk — Inactive Memento

### Purpose
Make it clear that the selected person has not activated connection-facing AI.

### State
**Tunde’s Memento isn’t available yet.**

“You can still keep memories together in Our Space.”

### Actions
Primary:
`Leave something for Tunde`

Secondary:
`Explore Our Space`

### Rules
- No composer.
- No voice call.
- No simulated AI.
- Shared Space remains fully usable.

---

## 8. Our Space

### Purpose
Show what both people have intentionally chosen to keep in the relationship.

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
- newest first.

Each item shows:
- contributor,
- type,
- date,
- preview,
- source where relevant,
- overflow menu.

### Sources
Items can enter Our Space through:
- direct contribution,
- existing story sharing,
- group sharing,
- sharing from personal Memento.

### Rules
- No dashboard modules.
- No separate Recent section.
- No mandatory chapters.
- No engagement metrics.

---

## 9. Add Something

### Purpose
Let the user intentionally add relationship context.

### Actions
- Record something
- Write something
- Add photos or video
- Share from my Memento

### Share from My Memento
Use the existing memory picker or sharing flow.

Do not duplicate the original memory.

Our Space should reference the original item.

### Group Sharing
If a story is shared with a group, use the existing group-sharing logic.

Do not require manual sharing into each Shared Space.

---

## 10. Shared Item Detail

### Purpose
Show one shared item in full.

### Components
- Full content
- Contributor
- Original date
- Shared date, if different
- Source
- Related media
- Overflow actions

### Possible Actions
- View original memory, where permitted
- Remove from Our Space, where allowed
- Open related Talk context

### Rule
Always preserve provenance.

---

## 11. Memento Activation

### Purpose
Let users explicitly decide whether connections can converse with their Memento.

### States

#### Private
Memento is not available to connections.

#### Ready to Activate
Enough approved context exists for a useful connection-facing experience.

#### Active
Approved connections can talk to the user’s Memento.

### CTA
`Activate my Memento`

### Explain
- activation is optional,
- private chats remain private,
- activation can be reversed,
- Shared Spaces continue to work whether active or not.

### Deactivation
Turning off connection-facing AI:
- disables Talk,
- does not remove Shared Spaces,
- does not delete shared memories.

---

## 12. Connection Settings

### Purpose
Manage the relationship without creating a complex permissions dashboard.

### Controls
- Relationship label
- Memento availability status
- Contribution summary
- Shared Space privacy/help
- Remove connection
- Block connection, where supported

### Contribution Summary
Show only the current user’s contributions.

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

## 13. Pending Connection

### Purpose
Handle invited users who have not accepted.

### Sidebar
Show:
- name or email,
- `Pending`.

### Main Area
**Invitation pending**

Actions:
- Resend invite
- Cancel invite

Reuse the existing invitation logic.

Do not create a Shared Space until the connection is accepted.

---

## 14. Story Sharing → Shared Space

### Individual
If a story is shared with one person:
- make it available in that relationship’s Shared Space.

### Group
If shared with a group:
- make it available in each eligible member’s Shared Space.

### Everyone
If shared with Everyone:
- make it available to all eligible connections under the existing product rule.

### No One / Private
Do not add it to any Shared Space.

### Permission Changes
If sharing changes:
- update Shared Space availability,
- update future AI context.

Do not create duplicate memory objects.

---

## 15. External Contributions

If one person adds a memory about the other, preserve perspective.

Example:

**Wisdom remembers Tunde as adventurous.**

Do not silently convert that into:

**Tunde is adventurous.**

### Personal Memento Acceptance
If supported later, the recipient may explicitly accept an external contribution into their personal Memento.

Until then, it remains Shared Space context only.

---

## 16. Edge Cases

### Connection Removed
- Shared Space becomes inaccessible.
- Follow existing retention rules.
- Do not merge shared memories into either private Memento automatically.

### User Deactivates Memento
- Talk becomes unavailable.
- Our Space remains intact.

### Story Made Private
- Remove it from affected Shared Spaces.
- Remove it from future connection-facing AI context.

### Group Membership Changes
Recalculate Shared Space access using existing group rules.

### Shared Item Deleted at Source
Follow existing deletion behavior.

Do not keep stale AI context from deleted content.

### Blocked User
Remove interaction access and prevent future connection activity under existing block rules.

---

## 17. Non-Goals

Do not build:
- direct user-to-user messaging,
- public profiles,
- public people discovery,
- followers/following,
- social feeds,
- online presence,
- read receipts,
- typing indicators,
- engagement metrics,
- group Shared Spaces,
- a new invite flow,
- a new group system,
- a new story-sharing system,
- mobile People redesign.

---

## 18. Product Rules

1. People is built around connections, not beneficiaries.
2. Every accepted connection gets one Shared Space.
3. Shared Space works whether either Memento is active or not.
4. Existing invite, group, and story-sharing flows must be reused.
5. Story visibility determines Shared Space availability.
6. Memento activation is explicit and optional.
7. Talk is available only when the selected person’s Memento is active.
8. Conversations with another person’s Memento are private from that person.
9. Shared items retain provenance.
10. External contributions do not automatically become authoritative personal facts.
11. Shared Space is chronological and simple by default.
12. People must not behave like a messenger.
13. This scope affects web only.
