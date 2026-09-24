# Chat UI Redesign Pass 2 — Design Specification

**Date:** 2026-09-24
**Status:** Approved design, awaiting specification review
**Scope:** Conversation media messages, link presentation, conversation-scoped All files modal, and file viewer

## Objective

Bring chat attachments and links in line with the supplied Figma designs while preserving the application's existing upload, storage, message persistence, and signed-media access behavior. The All files experience must show only files and links shared in the active conversation. It must never use the account-wide file library as its source.

## Product Decisions

- The active conversation is the sole data boundary for All files.
- Opening All files may load older pages from the existing conversation-history endpoint so that the result is complete even when the chat has not been scrolled to the beginning.
- That background history load is private to the modal and must not move the chat scroll position or duplicate messages in the visible timeline.
- No new backend endpoint, upload pipeline, metadata scraper, or persistence format will be introduced.
- Link previews use metadata only when it is already present in message data. Otherwise, links render as normal accessible links.
- The existing file-preview modal is upgraded rather than replaced by a second viewer.
- Viewer actions are limited to functionality already supported by the application: download, delete when the file can be deleted, and close.

## Delivery Strategy

### Pass 1 — Structure and behavior

Implement conversation asset normalization, message media grouping, captions, link fallbacks, the conversation-scoped All files modal, and correct viewer indexing/navigation. Establish component and integration tests before visual refinement.

### Pass 2 — Figma fidelity and resilience

Refine dimensions, spacing, radii, responsive behavior, dark mode, focus states, loading/error/empty states, media fitting, keyboard behavior, and semantic-token usage. Finish with project tests, lint, build, shadcn checks, and browser-based visual verification.

## Data Model and Flow

Create a UI-only conversation asset adapter that accepts message-shaped data and produces:

- `media`: images, videos, and audio shared as message attachments;
- `docs`: non-media document attachments;
- `links`: normalized URLs found in message text, optionally paired with existing metadata;
- `total`: the deduplicated total represented by the three tabs.

Each indexed asset retains its source message ID, message creation date as `sharedAt`, and its attachment index. Attachments are deduplicated by persistent file ID when available, then by normalized URL. Links are normalized and deduplicated by URL. Assets from another conversation cannot enter the index.

The modal receives the active conversation identifier and the messages already loaded in the timeline. On first open it immediately renders the current index, then follows the existing paginated conversation-history endpoint until no `next` page remains. Results are merged into a modal-local snapshot and deduplicated. This loading must not update the visible history list.

If older pages fail, the modal retains all successfully indexed assets and shows a non-blocking warning with retry. Reopening the modal may reuse a completed snapshot for the same conversation, but changing conversations invalidates it.

## Chat Message Presentation

Introduce a focused chat-media group rather than expanding the generic account gallery.

- One image uses a prominent aspect-preserving preview. It must not be cropped merely to fill a fixed thumbnail.
- Two or three images form one horizontal group with equal visual weight.
- Four or more images use a two-by-two preview. The fourth tile receives a dark overlay and `+N` count when additional items exist.
- Videos follow the same grouping rules and retain an unmistakable play affordance.
- Audio and document attachments use compact file rows with clear type, filename, and existing open/download behavior.
- Clicking any visual media item opens the viewer at that exact item, with the full message attachment collection available for navigation.

When a message contains both media and text, both belong to one message group. The caption sits immediately below the media surface. Timestamp, copy, and reply actions sit beneath the complete group, not between the attachment and caption.

The layout must remain readable with long filenames, mixed attachment types, missing thumbnails, failed signed URLs, and narrow screens.

## Links

URL handling has two modes:

1. When supported metadata already exists, render the compact Figma-style preview with title and site identity.
2. Without metadata, render the original URL as a normal underlined link with safe wrapping and an external destination.

The client must not fetch metadata from arbitrary URLs. Link rendering must preserve surrounding message text and must not display the same URL twice because of Markdown processing. The All files Links tab reuses the same normalized link presentation.

## All Files Modal

Register a conversation-files modal in the existing modal system and compose it from existing shadcn primitives where appropriate.

- Header: `All files (N)` and a circular close control.
- Tabs: Media, Docs, and Links with per-tab counts where designed.
- Search: client-side filtering within the selected tab across filename, document type, URL, title, and host.
- Media: dense four-column square grid for images and videos on desktop, reducing columns at narrower widths; previews use `object-cover` only inside this gallery grid. Audio remains in the Media tab but uses the existing compact audio rows beneath the visual grid rather than pretending to be an image tile.
- Docs: compact rows with file identity and supported action.
- Links: compact previews or plain URL cards using the same fallback rules as chat.
- Body: independently scrollable while header, tabs, and search remain usable.
- States: initial loading, progressive older-history loading, empty tab, no search results, partial-load warning, retry, and signed-media failure.

The chat-settings shortcuts open the appropriate initial tab: Images, Videos, and Audio open Media; Docs opens Docs; Links opens Links. The underlying result set always remains limited to the active conversation.

## File Viewer

Refactor the existing `file-preview` modal into the supplied near-fullscreen viewer:

- opaque/dimmed full-viewport overlay;
- fixed high-contrast header containing file identity and `Shared <date>` when the source message date is known;
- centered media constrained to the available viewport with `object-fit: contain` for images;
- previous/next controls and position dots only when multiple viewable items exist;
- the exact clicked attachment becomes the initial item;
- Left/Right Arrow navigate, Escape closes, and focus returns to the invoking control;
- download, conditional delete, and close are the only header actions unless existing application functionality expands later;
- videos and audio continue to use their existing players inside the new shell.

The global desktop `Cancel / ESC` affordance must be suppressed for the viewer and conversation-files modal where it conflicts with the Figma presentation.

## Visual and Accessibility Requirements

- Use semantic background, foreground, border, muted, destructive, and brand tokens; avoid new raw light-only colors.
- Support light and dark themes without transparency defects.
- Use consistent card radii and Figma-derived spacing.
- Icon-only controls require accessible names and visible focus states.
- Modal focus is trapped, Escape behavior is deterministic, and background content is inert.
- Touch targets remain usable on mobile, and grids reflow without horizontal page overflow.
- Reduced-motion preferences are respected; no animation is required for comprehension.

## Testing and Verification

Add unit and component coverage for:

- conversation-only indexing and exclusion of assets from other conversations;
- paginated merge, deduplication, and partial-load retry;
- URL extraction, normalization, metadata preview, and plain-link fallback;
- single, two/three, and four-plus media layouts including `+N`;
- captions and metadata placement as one message group;
- exact viewer start index, arrows, dots, keyboard navigation, and single-item navigation hiding;
- All files counts, initial tab, search, empty states, and chat-settings shortcut routing;
- viewer action visibility based on existing capabilities.

Verification includes targeted test files, the full relevant test suite, lint, production build, shadcn lint, and browser checks at desktop and mobile widths in light and dark themes.

## Out of Scope

- Account-wide media management;
- new upload or storage behavior;
- new backend APIs or database fields;
- remote link-metadata fetching;
- comments, image search, editing, or sharing actions that the application does not already support;
- redesigning life-area screens or unrelated chat-settings content.

## Acceptance Criteria

The feature is complete when media messages match the documented grouping behavior, text and actions form one coherent message unit, links degrade safely without metadata, All files contains every discoverable asset from only the active conversation, and the viewer opens the exact selected media with reliable mouse, touch, and keyboard navigation. The implementation must preserve existing upload/persistence behavior and pass the stated automated and visual checks.
