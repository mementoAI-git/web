# People API contract

All routes below require the existing authenticated session and return the standard
`{success, message, data}` envelope. Participant/source IDs are 24-character
hexadecimal IDs. Every relationship operation checks accepted relationships, both
participants' availability, canonical SharedSpace removal and blocking.

## Connections and invitations

`GET /people` returns `connections` and outgoing `pending` invitations. Connections
include user_id, name, avatar_url, viewer-specific relationship and memento_state
(`private`, `ready`, `active`). Accepted directional beneficiary records resolve to
one canonical space per sorted user pair. Removed/blocked pairs are excluded.

Reuse beneficiary create, accept, resend and cancel endpoints. People invitations
use `access_scope: shared_only`; legacy defaults and response shapes remain intact.
That scope grants only selected stories, never a vault or capsule. Reciprocal
sharing reuses an accepted outgoing recipient or creates one deterministic safe
shared_only recipient after authorizing the accepted pair, without another invite.
Blocked pairs cannot create, accept or resend invitations. Unblocking alone does
not restore a connection; a fresh accepted invitation is required.

## Our Space and contributions

| Endpoint | Payload / result |
|---|---|
| GET /people/:personId/space | page 1–10000, limit 1–50, filter all/stories/photos/voice/videos/notes; items, total, page, has_next_page, shared_space_id |
| GET /people/sources | Own saved story picker; page/limit/search; items, page, has_next_page |
| POST /people/:personId/share | source_id; grants this pair access to an owned existing source without copying it |
| POST /people/:personId/items | title (1–300), body (up to 50000), kind story/note/photo/video/voice, owned attachment IDs (up to 20) |
| GET /people/:personId/items/:sourceId | Fresh permitted item detail |
| DELETE /people/:personId/items/:sourceId | Author only; removes this pair's direct recipient grants, retaining source and other grants |

Items include source_id, source_type, title, body, original_date, nullable known
shared_date, contributor (user_id/name/avatar_url), shared_via, can_remove and
attachments in the existing signed-URL format. An internal source_revision digest
supports invalidating Talk context after source or media changes. shared_via is
direct, share_from_memento, individual_visibility, group_visibility or
everyone_visibility. Shared timestamps sort newest first, falling back to original
creation dates for legacy sources with unknown sharing dates.

Original story visibility remains the access authority. Reference metadata does
not grant access. Evaluate direct recipients, current group membership and explicit
Everyone visibility on every request; exclude drafts, deleted sources, capsules
and AI conversations. Media filtering precedes pagination. Contributions reuse
existing memory creation and file ownership checks. They belong to their author
and do not enter the recipient's personal Memento automatically. Group/Everyone
access must be changed on the original source; the pair remove action cannot revoke
those broader grants. A removed connection does not make an Everyone story private.

## Settings and activation

| Endpoint | Payload / result |
|---|---|
| GET /people/:personId/settings | relationship label, current shared_item_count and privacy help |
| PATCH /people/:personId/settings | label (1–80), private to the viewer |
| POST /people/:personId/disconnect | block boolean; removes both directions, preserves original sources |
| GET /people/blocked | Only the viewer's blocked people |
| DELETE /people/blocked/:personId | Only the blocker may unblock; no access restored |
| GET /people/activation | Owner-only state, approved_context, updated_at |
| PUT /people/activation | approved_context (up to 6000), active boolean |

Default activation is private. Saving nonempty approved context without activation
sets ready; active requires explicit opt-in and nonempty context. Deactivation keeps
spaces and sources intact. Approved context is excluded from normal user queries;
it is not copied from personal chat history or personal identity extraction.

## Private Talk

`GET /people/:personId/talk` returns available and the viewer's most recent 50 turns.
`POST /people/:personId/talk` accepts text (1–4000), request_id (UUID), optional
is_voice boolean and optional source_id for a currently shared memory. Returns one
AI turn with id, role, text, created_at, is_voice, available and citations containing
source_id/title. The conversation key is derived from the authenticated viewer and
pair. The Memento owner cannot query the other participant's transcript.

Talk requires an active Memento and current accepted, unblocked pair. The existing
AI provider router receives only explicitly approved base context, up to 30 newest
permitted shared sources, an explicitly selected source when supplied, and recent
valid viewer-owned turns. Attached transcripts are limited to pair-owned live
files. No personal conversation, unrelated story or automatic identity context is
retrieved. Instructions preserve contributor perspective; citations are validated
against current permissions before saving. Context is rechecked after generation.
Revoked, edited, deleted or deactivated context invalidates old AI turns and excludes
them from future prompts. In-flight requests are serialized; retries deduplicate by
request UUID. Provider failures return a retryable error rather than fabricated text.

Voice dictation and spoken turn-based calls use supported browser speech recognition
and synthesis, sending text through this same scoped API. They do not use the
personal Gemini Live session. Unsupported browsers retain text. Live provider,
real microphone, playback and permission-denial QA remain external checks.

## Local preview

New-user preview starts with empty People and local pending invites. All People
reads/writes are isolated; unknown People routes fail locally. Optional exported
People fixtures support development review of active/private states, contributions,
settings and clearly labeled local Talk responses. Preview never uses real AI,
relationships, sources or transcripts and never sends invitation email.
