# Memento — People Technical / Data Model Specification

_Last updated: October 10, 2026_

## 1. Purpose

Define the minimum technical model required to implement the web-only People feature without rebuilding existing invite, group, story-sharing, or memory systems.

This document should be used together with:
- People Product Concept + UX Specification
- People UX Flow + Screen Specification
- People Agent Implementation Prompt

---

## 2. Core Entities

### 2.1 User
Use the existing Memento user model.

A user may:
- have connections,
- have Shared Spaces,
- activate or deactivate connection-facing Memento access,
- contribute shared items,
- privately converse with active connection Mementos.

Do not create a separate beneficiary user type.

---

### 2.2 Connection

Represents an accepted relationship between two users.

Suggested fields:

- `id`
- `user_a_id`
- `user_b_id`
- `status`
- `relationship_label` if already supported
- `created_at`
- `updated_at`

Suggested status values:
- `pending`
- `accepted`
- `removed`
- `blocked`

Rules:
- A Shared Space is created only after acceptance.
- One active connection should exist per user pair.
- Existing invite logic should create or resolve this relationship.

---

### 2.3 Shared Space

Represents the private relationship archive between two connected users.

Suggested fields:

- `id`
- `connection_id`
- `created_at`
- `updated_at`

Rules:
- One Shared Space per accepted connection.
- Exists independently of Memento activation.
- Remains the canonical relationship context container.
- Does not duplicate source memories.

---

### 2.4 Shared Item Reference

Represents an item intentionally available inside a Shared Space.

Prefer references to existing source objects instead of duplicated content.

Suggested fields:

- `id`
- `shared_space_id`
- `source_type`
- `source_id`
- `contributor_user_id`
- `shared_via`
- `shared_at`
- `removed_at` nullable
- `metadata` only where needed

Suggested `source_type` values:
- `story`
- `photo`
- `video`
- `voice`
- `note`
- `memory`

Suggested `shared_via` values:
- `direct`
- `individual_visibility`
- `group_visibility`
- `everyone_visibility`
- `share_from_memento`

Rules:
- Preserve provenance.
- Keep the source object authoritative.
- Do not copy content unless existing architecture requires it.
- If source access is revoked, the Shared Item Reference must stop being available.

---

### 2.5 Memento Activation

Represents whether the user allows connections to converse with their Memento.

Prefer adding this to the existing user/profile/settings model unless a separate model is required.

Suggested fields:

- `connection_memento_state`
- `activated_at`
- `deactivated_at`

Suggested states:
- `private`
- `ready`
- `active`

Rules:
- Default should not imply connection-facing access.
- Activation is explicit.
- Deactivation disables Talk but does not remove Shared Spaces.
- Activation is independent of another user’s activation state.

---

### 2.6 Private Connection Conversation

Represents a user’s private conversation with a connection’s active Memento.

Suggested fields:

- `id`
- `viewer_user_id`
- `memento_owner_user_id`
- `connection_id`
- `created_at`
- `updated_at`

Rules:
- Only the viewer can access the conversation transcript.
- The Memento owner must not have transcript visibility.
- Conversation ownership is not shared.
- Do not expose message activity to the Memento owner.

If the existing AI chat model can support scoped conversations, extend it instead of creating a parallel chat system.

---

## 3. Context Model

A connection-facing Memento should use only:

### Layer 1 — Approved connection-facing base context
Information the Memento owner has explicitly allowed for connection-facing use.

### Layer 2 — Relationship context
Items in the Shared Space for the current connection.

The model should be:

**Owner Memento → approved base context + Shared Space context → connection-facing response**

Do not allow:
- unrelated private memories,
- private stories,
- revoked shared content,
- deleted source content.

---

## 4. Story Sharing → Shared Space Mapping

Reuse the existing story visibility system.

### Individuals
When a story is shared with User B:
- ensure the accepted connection exists,
- expose the story in that connection’s Shared Space.

### Groups
When shared with a group:
- resolve eligible group members,
- expose the story in each accepted member relationship’s Shared Space.

### Everyone
Expose the story to every eligible accepted connection under the existing Everyone rule.

### No One / Private
Do not expose the story to any Shared Space.

### Important
Do not create separate copies of the story.

Use Shared Item References or the closest equivalent supported by the existing data model.

---

## 5. Permission Propagation

Sharing state must stay synchronized with Shared Spaces.

### Story becomes more permissive
Create or restore the required Shared Item References.

### Story becomes more restrictive
Remove access from affected Shared Spaces.

### Story becomes Private
Remove it from:
- Shared Space queries,
- connection-facing AI context,
- future generated responses.

### Group membership changes
Recalculate relationship access for content shared through that group.

### Connection removed
Disable Shared Space access for both users.

Follow existing retention/deletion rules for underlying records.

---

## 6. Source Deletion

If the original source memory is deleted:

- remove it from Shared Space results,
- remove it from connection-facing AI context,
- invalidate cached references,
- prevent future source citations.

Do not keep stale derived context based on deleted content unless an explicit retained-data rule already exists in Memento.

---

## 7. External Contributions

A contribution about another user must preserve perspective.

Store:
- contributor,
- recipient/relationship context,
- source,
- timestamp.

Example semantic interpretation:

**Wisdom remembers Tunde as adventurous**

Do not silently promote it to:

**Tunde is adventurous**

If later accepted into the recipient’s personal Memento, that should be a separate explicit action/state.

---

## 8. Contribution Acceptance

Optional future capability.

If implemented, add a state such as:

- `shared_only`
- `accepted_into_personal_memento`

Acceptance should:
- be controlled by the recipient,
- preserve original provenance,
- not destroy the original Shared Space relationship.

Do not block V1 People implementation on this capability.

---

## 9. Query Requirements

### People Sidebar
Query:
- accepted connections,
- pending invites,
- basic person metadata,
- activation state.

Do not query message activity.

### Our Space
Query by:
- `shared_space_id`
- item type filter
- chronological order

Default:
- newest first.

### Talk
Resolve:
- selected connection,
- owner activation state,
- allowed base context,
- current Shared Space context,
- viewer-owned private conversation history.

---

## 10. AI Retrieval Rules

Before sending context to the model:

1. Resolve the active connection.
2. Confirm the Memento owner is active.
3. Load approved connection-facing base context.
4. Load permitted Shared Space items.
5. Exclude deleted or revoked items.
6. Keep source IDs for citation/reference.
7. Do not load unrelated private context.

When an answer uses a shared item, return enough metadata for:

**From Our Space → View memory**

---

## 11. Privacy Boundaries

### Owner may access
- their own Memento,
- their own private chats,
- Shared Spaces they belong to,
- their own contribution summaries.

### Owner may not access
- another user’s private conversation with their Memento.

### Connection may access
- their own conversation with the owner’s active Memento,
- Shared Space content available to that relationship.

### Connection may not access
- owner’s unrelated private memories,
- revoked content,
- owner’s private chat history,
- other relationship Shared Spaces.

---

## 12. Mobile Isolation

This implementation is web-only.

Requirements:
- Do not change existing mobile routes or UI behavior.
- New backend fields may exist globally if required.
- Mobile clients should safely ignore unsupported People fields.
- Avoid schema changes that break older mobile clients.
- Gate new web-only UI by platform or route, not by destructive shared component changes.

---

## 13. Suggested Implementation Order

1. Audit existing user, beneficiary, invite, group, sharing, memory, and AI-chat models.
2. Map existing entities to:
   - Connection
   - Shared Space
   - Shared Item Reference
   - Memento Activation
   - Private Connection Conversation
3. Add only missing schema/state.
4. Extend accepted connection creation to create Shared Space.
5. Extend current story-sharing logic to populate Shared Spaces.
6. Implement Shared Space queries and filtering.
7. Implement activation state.
8. Implement Talk context scoping.
9. Add inline source references.
10. Handle permission changes, deletions, group changes, connection removal.
11. Verify mobile remains unchanged.

---

## 14. Migration Guidance

Do not perform large migrations unless required.

Prefer:
- extending existing beneficiary/connection data where compatible,
- reusing existing group and visibility relations,
- backfilling Shared Spaces only for accepted existing relationships,
- avoiding duplicate memories.

If existing beneficiary records already represent accepted relationships, map or migrate them into Connections rather than maintaining two parallel systems.

---

## 15. Acceptance Criteria

Technical implementation is correct when:

- one accepted connection maps to one Shared Space,
- existing invites are reused,
- existing groups are reused,
- existing story visibility determines Shared Space access,
- no shared memory copies are created unnecessarily,
- revoked/private items disappear from Shared Space and AI context,
- active state gates Talk,
- inactive state does not affect Shared Space,
- private connection chats are inaccessible to the Memento owner,
- AI retrieval is limited to approved base context plus Shared Space,
- source references can open the correct memory,
- group membership changes recalculate access,
- source deletion removes stale access,
- mobile behavior remains unchanged.
