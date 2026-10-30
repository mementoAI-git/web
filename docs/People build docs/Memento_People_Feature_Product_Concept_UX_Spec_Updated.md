# Memento — People Feature
## Product Concept + UX Specification

_Last updated: October 10, 2026_

---

## 1. Feature Definition

**People** is Memento’s private relationship layer.

It allows users to:

- connect with people they trust,
- create a private Shared Space with each connection,
- intentionally add memories and media to that space,
- receive memories from the other person,
- and, when enabled, privately converse with that person’s Memento.

People is **not** a messaging product, social network, public profile system, or separate beneficiary experience.

Every person is a normal Memento user.

The core model is:

**My Memento + Your Memento + Our Space**

A relationship can exist and accumulate memories even when one or both Mementos are not activated for connection-facing AI conversations.

---

## 2. Core Principles

### Private
Memento is private by default.

Connections are intentional relationships, not followers or public profiles.

### Invitation-based
Users connect through explicit invitations and acceptance.

There is no public people directory or open discovery network in this scope.

### Memory-first
The relationship is grounded in stories, photos, recordings, notes, and shared life context.

AI conversation sits on top of that memory layer.

### Share this, not me
Connecting with someone does not expose a user’s entire Memento.

Users intentionally decide what enters a Shared Space.

### Shared context is explicit
Nothing enters a Shared Space automatically.

Anything available there was intentionally added by one of the two people.

### Conversations are private
A conversation with another person’s Memento belongs to the person having that conversation.

The Memento owner cannot read it.

---

## 3. Core Objects

### 3.1 Connection
A private relationship between two Memento users.

A connection:

- is created through invitation and acceptance,
- does not automatically expose private memories,
- does not automatically activate either person’s Memento,
- creates a Shared Space between the two users.

### 3.2 Shared Space
A private relationship archive between two connected users.

Example:

**Wisdom + Tunde**

The Shared Space contains only what either person intentionally contributes.

It exists independently of Memento activation.

### 3.3 Shared Item
Any item intentionally added to a Shared Space.

Supported types:

- Story
- Photo
- Video
- Voice memory
- Note
- Existing memory shared from personal Memento

Every item should preserve provenance:

- who added it,
- when it was added,
- whether it came from a personal Memento,
- its original source where relevant.

### 3.4 Memento Activation
Having a Memento account does not automatically make a user’s Memento available to connections.

The user must explicitly activate connection-facing conversation.

### 3.5 Private AI Conversation
A private conversation between a user and a connection’s active Memento.

It is not a shared chat and is not visible to the Memento owner.

---


## 4. Existing Systems to Reuse

Do **not** rebuild invite, group, or story-sharing flows.

Reuse the existing implementation and extend it so existing sharing decisions populate the relevant Shared Spaces.

### Invite
Use the current invite flow for:
- inviting a new person,
- connecting with an existing Memento user,
- pending invitations.

People should reference this existing flow rather than introduce a new invitation system.

### Groups
Use the current group system for:
- Family,
- Friends,
- custom groups.

Groups remain the mechanism for sharing one item with multiple people.

### Story Sharing
Keep the current story visibility options:
- Individuals
- Groups
- Everyone
- No one / Private

These decisions should determine which Shared Spaces receive access to the story.

Examples:

**Shared with Tunde**\
→ appears in **Wisdom + Tunde — Our Space**

**Shared with Family**\
→ appears in the Shared Space for each eligible Family member

**Shared with Everyone**\
→ appears in all eligible Shared Spaces under the existing sharing rule

**No one / Private**\
→ does not appear in any Shared Space

Changing an existing story’s sharing permissions should update Shared Space availability and future AI context accordingly.

Do not create duplicate memory objects. Shared Spaces should reference the existing source memory.

---

## 5. Connection Lifecycle

### Step 1 — Invite
A user selects **Invite someone**.

The recipient is invited to join Memento and connect.

They are not invited as a beneficiary or separate account type.

### Step 2 — Accept
The recipient:

- creates a Memento account or signs in,
- accepts the invitation.

### Step 3 — Shared Space Created
A private Shared Space is created automatically for the connection.

The space starts empty.

### Step 4 — Start Sharing
Either person can intentionally add something to the Shared Space.

### Step 5 — Optional Memento Activation
Each person independently chooses whether to activate their own Memento for connection-facing AI conversations.

Activation is not reciprocal.

One person may activate theirs while the other keeps theirs private.

---

## 6. Shared Space

### Purpose
**Our Space** is the shared memory layer of the relationship.

It should feel like a quiet chronological memory stream, not a dashboard, folder system, or social feed.

### Default Structure

**Relationship header**
- Person name
- Connection metadata
- `Talk`
- `Our Space`

**Our Space header**
- “Things you and Tunde have chosen to keep together.”
- `Add something`

**Filters**
- All
- Stories
- Photos
- Voice
- Videos
- Notes

**Timeline**
- Single chronological stream
- Newest first by default
- No separate Recent section
- No mandatory chapter browsing

### Timeline Item Anatomy
Each item should show:

- contributor,
- contribution type,
- date/time,
- content preview,
- source where relevant,
- overflow menu.

Examples:

**You added a photo**\
_May 18, 2026_\
**Lagos trip**

**Tunde shared a story**\
_April 3, 2026_\
_Shared from Tunde’s Memento_

**You recorded a voice memory**\
_May 12, 2026_\
[Voice player]

---

## 7. Adding to Our Space

`Add something` should remain lightweight.

Options:

- Record something
- Write something
- Add photos or video
- Share from my Memento

### Share from My Memento
Sharing an existing memory should not create a duplicate.

Instead, the original memory becomes intentionally available inside the Shared Space.

The system should preserve:

- original author,
- original source,
- original date where relevant.

---

## 8. Sharing With Someone Whose Memento Is Inactive

A connection does not need an active Memento to receive shared items.

Example:

Wisdom records:

> “Something I want Tunde to remember about our university years…”

That item is added immediately to **Wisdom + Tunde — Our Space**.

Tunde can view it normally.

The product should not describe the item as “waiting for AI.”

The Shared Space exists independently of the digital mind.

---

## 9. Contributions About Another Person

Memories contributed by someone else must retain their perspective.

Example:

Wisdom says:

> “Tunde was always the adventurous one.”

Memento may understand this as:

**Wisdom remembers Tunde as adventurous.**

It must not automatically convert it into:

**Tunde is adventurous.**

External contributions can enrich relationship context without automatically becoming authoritative facts in the recipient’s canonical personal understanding.

### Optional acceptance into personal Memento
A user may later choose to explicitly accept an external contribution into their personal Memento.

Until then:

- it remains valid Shared Space context,
- its provenance remains visible,
- it should not silently overwrite the user’s own understanding of themselves.

---

## 10. Relationship Context

The Shared Space is the primary source of relationship-specific context.

The simpler model is:

**Our Space → relationship context → AI can use it if activated**

Do not create a separate duplicated relationship-memory system unless technically necessary.

### Two context layers for connection-facing AI
When a Memento is active, a connection-facing conversation may use:

1. **Connection-facing base context**\
   Information the owner has chosen to make generally available to approved connections.

2. **Our Space context**\
   Memories and contributions specific to this relationship.

This keeps the model simple:

**One Memento + one general connection-facing layer + one Shared Space per relationship**

Private personal context outside these layers must remain inaccessible.

---

## 11. Talk

### Purpose
Talk allows a user to privately converse with a connection’s Memento.

When the connection’s Memento is active, Talk may be the default view.

### Inputs
- Text
- Voice input
- Voice call

### Memory References
If the AI uses a specific shared memory, it should surface that source inline.

Example:

> “You and Tunde talked about this during your Lagos trip.”

**View memory →**

Selecting it opens the relevant item in Our Space.

Conversation should help users move naturally between **talking** and **remembering**.

---

## 12. Private Conversation Rule

This is a hard product rule.

If Wisdom talks to Tunde’s Memento:

- Tunde cannot see the conversation.

If Tunde talks to Wisdom’s Memento:

- Wisdom cannot see the conversation.

The owner controls the context their Memento is allowed to use.

They do not get access to what another person privately asks it.

### Do Not Add
- Shared transcripts
- Read receipts
- User-to-user typing indicators
- Online status
- “Tunde asked your Memento…”
- Message notifications between connections
- Owner-facing chat surveillance

People must not behave like Messenger, WhatsApp, or Slack.

---

## 13. Inactive Memento State

A user can participate fully in Shared Spaces without activating their Memento.

### Available
- Shared Space
- Viewing shared items
- Adding new items
- Receiving items from connections

### Unavailable
- Text conversation with that user’s Memento
- Voice conversation with that user’s Memento

### UI

> **Tunde’s Memento isn’t available yet.**

Actions:

- `Leave something for Tunde`
- `Explore Our Space`

Do not simulate a partial AI personality when the Memento is inactive.

---

## 14. Memento Activation

Activation is explicit and opt-in.

Joining Memento is not consent to make an AI representation available to other people.

### States

#### Private
The user’s Memento is not available to connections.

#### Ready to activate
The system has enough approved context to support a useful connection-facing experience.

#### Active
Approved connections can privately converse with the user’s Memento.

### Principles
- Explicit consent
- Reversible
- Independent for each user
- Not automatically reciprocal
- Does not expose private conversation transcripts

---

## 15. Contribution Visibility

Users should be able to understand what they have contributed to a relationship.

A lightweight summary may show:

### Your contributions
- 8 stories
- 3 voice memories
- 24 photos

### Context they add
- University years
- Friendship
- Lagos
- Early career

### Status
Possible states:

**Shared in Our Space**

**Accepted into Tunde’s Memento**

Users should never be shown the other person’s complete private Memento understanding.

They should only see:

- what they contributed,
- where it exists,
- whether the owner explicitly accepted it into their personal Memento.

---

## 16. Web Information Architecture

This implementation is **web-only**.

The current mobile People experience remains unchanged in this scope.

### Column 1 — Global Navigation Rail
When People is open, the normal Memento sidebar collapses to icons only.

Suggested destinations:

- Home
- Memories
- Explore
- People
- Search
- Settings

### Column 2 — People Sidebar
Contains:

- People heading
- Search people
- Connection list
- Invite someone

Each connection row may show:

- avatar,
- name,
- relationship label or simple connection metadata.

Do not show:

- unread badges,
- last-message previews,
- conversation timestamps,
- online indicators.

These patterns make the feature feel like an inbox.

### Column 3 — Relationship Workspace
Contains:

- selected person,
- activation state,
- `Talk`,
- `Our Space`.

This is the main interaction area.

---

## 17. Talk Screen

### Header
- Avatar
- Name
- Connection metadata
- Memento activation state
- Voice call action
- Overflow menu

### Tabs
- Talk
- Our Space

### Conversation Area
- Calm message layout
- Inline Shared Space memory references
- No social presence mechanics

### Composer
- Text input
- Attachment
- Voice input
- Voice call entry point

---

## 18. Our Space Screen

### Header
- `Our Space`
- Short descriptor
- `Add something`

### Filters
- All
- Stories
- Photos
- Voice
- Videos
- Notes

### Timeline
One chronological stream.

Do not add:

- dashboard modules,
- large hero sections,
- mandatory chapters,
- analytics,
- engagement widgets.

Additional organization can be introduced later if scale creates a real need.

---

## 19. Empty States

### New Connection

> **Nothing here yet.**\
> Add something you want the two of you to keep together.

CTA:

`Add something`

### Inactive Memento

> **Tunde’s Memento isn’t available yet.**

Actions:

- `Leave something for Tunde`
- `Explore Our Space`

### Empty Active Talk

> **Start a private conversation with Tunde’s Memento.**

Supporting copy should explain that responses are grounded only in context Tunde has made available and the memories in Our Space.

---

## 20. Connection Settings

Keep connection settings lightweight.

Possible controls:

- Relationship label
- Memento access status
- Shared Space help/privacy
- Remove connection
- Block connection where required

Avoid rebuilding Direction A as a complex per-memory permissions dashboard.

---

## 21. Key Product Rules

1. Everyone is a normal Memento user.
2. Connections are private and invitation-based.
3. Every accepted connection gets one Shared Space.
4. Existing invite, group, and story-sharing flows must be reused and extended to populate Shared Spaces.
5. Shared Spaces exist independently of AI activation.
6. Nothing enters a Shared Space automatically outside explicit existing sharing decisions.
7. Contributions retain provenance.
8. Memories contributed by someone else are not automatically authoritative facts about the recipient.
9. External contributions can be explicitly accepted into the recipient’s personal Memento.
10. Memento activation is explicit and opt-in.
11. Having an account does not mean connections can chat with your Memento.
12. Talk is only available when that person’s Memento is active.
13. Connection-facing AI uses only approved base context plus that relationship’s Shared Space.
14. Conversations with another person’s Memento are private from the Memento owner.
15. Our Space is visible to both people in the connection.
16. AI may reference memories from Our Space inside conversation.
17. People is not a messaging product.
18. No public discovery, followers, DMs, presence, or engagement mechanics.
19. This implementation affects web only.

---

## 22. Non-Goals

This version does not include:

- Direct user-to-user messaging
- Public profiles
- Followers/following
- Public people discovery
- Social feeds
- Online status
- Read receipts
- Typing indicators
- Engagement metrics
- Public comments
- Likes/reactions as a primary mechanic
- Mobile People redesign
- Group Shared Spaces
- Full legacy/account succession flows
- Complex per-memory connection permissions

---

## 23. Product Mental Model

The simplest explanation of People is:

> **Connect with someone you trust, keep the parts of your shared life you want to remember together, and—if they choose to activate it—have private conversations with their Memento grounded in that shared history.**

The People architecture is:

**Connection → Our Space → Relationship context → Optional Memento conversation**

The broader product model is:

**My Memento + Your Memento + Our Space**
