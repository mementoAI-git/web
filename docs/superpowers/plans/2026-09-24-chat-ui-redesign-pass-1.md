# Chat UI Redesign Pass 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the main text-chat, first-time state, composer, and chat settings drawer to the supplied Figma design while preserving the existing chat, attachment, voice, ambience, and navigation behavior.

**Architecture:** Keep `Conversation` as the orchestration boundary and reuse the existing dashboard shell, message stream, composer logic, enrichment hook, voice catalog, and background-music hook. Add small presentational units for the empty state and drawer-only enrichment/insight/media content, then compose those units through the current conversation settings panel instead of introducing a new route or backend contract.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, Tailwind CSS 4 with Memento V3 semantic tokens, existing shadcn-style primitives, Vitest, Testing Library, Playwright.

---

## File map

- `src/pages/dashboard/component/dashboard-header.tsx`: Figma-aligned chat title/status, search, audio, voice, and settings actions.
- `src/pages/dashboard/component/dashboard-header.test.tsx`: chat-header content and accessible actions.
- `src/pages/dashboard/chat/conversation/chat-empty-state.tsx`: first-time education and prompt actions.
- `src/pages/dashboard/chat/conversation/chat-empty-state.test.tsx`: prompt rendering and send behavior.
- `src/pages/dashboard/chat/conversation/index.tsx`: place the empty state, narrow the transcript column, and retain existing send/stream state.
- `src/pages/dashboard/chat/conversation/history.tsx`: quiet date separators and centered transcript layout.
- `src/pages/dashboard/chat/conversation/bubble.tsx`: plain assistant messages, restrained user surfaces, and secondary metadata/actions.
- `src/pages/dashboard/chat/conversation/bubble.test.tsx`: user/assistant semantic presentation and message actions.
- `src/components/Chatinput/index.tsx`: compact Figma composer shell, autosizing field, attachment control, and mic/send primary-action swap.
- `src/components/Chatinput/conversation-chatinput.test.tsx`: autosizing composer controls and empty/typed action states.
- `src/components/modal/chat-settings/chat-preferences-panel.tsx`: ordered drawer composition.
- `src/components/modal/chat-settings/enrichment-summary.tsx`: qualitative enrichment state, distribution, CTA, media shortcuts, and insight rail.
- `src/components/modal/chat-settings/enrichment-summary.test.tsx`: qualitative labels, absence of percentages, shortcuts, and horizontal insights.
- `src/components/modal/chat-settings/voices.tsx`: Figma voice-card density and selected state while retaining save/preview behavior.
- `src/components/modal/chat-settings/background-music.tsx`: `Off` plus ambience cards and existing volume/playback behavior.
- `src/components/modal/chat-settings/chat-preferences-panel.test.tsx`: section order and complete drawer content.
- `src/components/memory/sidebar-details.tsx`: render the dedicated conversation settings composition for chat while retaining memory-detail behavior elsewhere.
- `src/components/memory/sidebar-details.test.tsx`: conversation settings variant and responsive drawer surface.

### Task 1: Lock the chat header and first-time-state contracts

**Files:**
- Modify: `src/pages/dashboard/component/dashboard-header.test.tsx`
- Create: `src/pages/dashboard/chat/conversation/chat-empty-state.test.tsx`
- Create: `src/pages/dashboard/chat/conversation/chat-empty-state.tsx`
- Modify: `src/pages/dashboard/component/dashboard-header.tsx`
- Modify: `src/pages/dashboard/chat/conversation/index.tsx`

- [ ] **Step 1: Write failing tests** asserting the chat header reads `Chat`, exposes the active-since subtitle and accessible Search/Audio/Voice/Settings actions, and the empty state renders the Figma copy plus two prompt buttons whose clicks call `onPrompt` with the visible text.
- [ ] **Step 2: Run the focused tests** with `npm test -- src/pages/dashboard/component/dashboard-header.test.tsx src/pages/dashboard/chat/conversation/chat-empty-state.test.tsx`; expect failures for the missing title/actions/component.
- [ ] **Step 3: Implement the minimal UI** by reusing the current conversation chrome callbacks, semantic icon buttons, and a focused `ChatEmptyState` component. Do not add API calls or routing.
- [ ] **Step 4: Run the same focused tests** and require a green result before continuing.

### Task 2: Migrate transcript and composer presentation

**Files:**
- Modify: `src/pages/dashboard/chat/conversation/bubble.test.tsx`
- Modify: `src/components/Chatinput/conversation-chatinput.test.tsx`
- Modify: `src/pages/dashboard/chat/conversation/history.tsx`
- Modify: `src/pages/dashboard/chat/conversation/bubble.tsx`
- Modify: `src/components/Chatinput/index.tsx`
- Modify: `src/pages/dashboard/chat/conversation/index.tsx`

- [ ] **Step 1: Write failing tests** for plain assistant messages, right-aligned neutral user messages, timestamp/copy/reply controls, a visible attachment control, microphone when empty, and send control when text exists.
- [ ] **Step 2: Run the focused tests** with `npm test -- src/pages/dashboard/chat/conversation/bubble.test.tsx src/components/Chatinput/conversation-chatinput.test.tsx`; expect failures only for the new presentation contract.
- [ ] **Step 3: Implement the Figma composition** with semantic tokens: a roughly 900px transcript, readable assistant measure, restrained user bubble, quiet centered date labels, and an autosizing composer with its controls pinned to the lower row.
- [ ] **Step 4: Preserve existing behavior** for attachments, paste upload, replies, slash commands, draft restoration, recording, voice route, sending, stopping, and error handling.
- [ ] **Step 5: Run the focused tests** and require a green result before continuing.

### Task 3: Build the dedicated chat-settings content

**Files:**
- Create: `src/components/modal/chat-settings/enrichment-summary.test.tsx`
- Create: `src/components/modal/chat-settings/enrichment-summary.tsx`
- Modify: `src/components/modal/chat-settings/chat-preferences-panel.test.tsx`
- Modify: `src/components/modal/chat-settings/chat-preferences-panel.tsx`
- Modify: `src/components/modal/chat-settings/voices.tsx`
- Modify: `src/components/modal/chat-settings/background-music.tsx`
- Modify: `src/components/memory/sidebar-details.test.tsx`
- Modify: `src/components/memory/sidebar-details.tsx`

- [ ] **Step 1: Write failing tests** that assert `Strong`, `Medium`, or `Weak` is shown instead of a percentage; the media shortcuts and insight cards render; and section headings appear in the required order: enrichment, shortcuts, deep dives, AI Voice, Background Ambience.
- [ ] **Step 2: Run the focused tests** with `npm test -- src/components/modal/chat-settings/enrichment-summary.test.tsx src/components/modal/chat-settings/chat-preferences-panel.test.tsx src/components/memory/sidebar-details.test.tsx`; expect failures for the new content structure.
- [ ] **Step 3: Implement the qualitative mapper and presentation** using existing `useEnrichmentStats`, category data where available, current navigation callbacks where already wired, and semantic token classes. Keep unavailable shortcuts as real buttons with clear non-destructive fallback behavior rather than inventing a file manager.
- [ ] **Step 4: Restyle voice and ambience cards** to the compact two-column Figma treatment while retaining their current persistence and preview/playback behavior; include `Off` as an explicit ambience option.
- [ ] **Step 5: Compose the chat-only drawer variant** inside `SidebarDetails` without changing ordinary memory-detail drawers.
- [ ] **Step 6: Run the focused tests** and require a green result before continuing.

### Task 4: Theme, accessibility, and responsive cleanup

**Files:**
- Modify only the files touched in Tasks 1–3.

- [ ] **Step 1: Review interactive semantics** so every icon-only action has an accessible name, the drawer retains a title, horizontal insight content is keyboard-scrollable, and focus states remain visible.
- [ ] **Step 2: Apply Emil-style interaction polish** with brief transform/opacity transitions, `:active` feedback, no slow keyboard-triggered motion, and reduced-motion-safe behavior.
- [ ] **Step 3: Run the project variable workflow** from `.cursor/commands/check-variables.md` and replace any raw UI colors with V3 semantic tokens.
- [ ] **Step 4: Run shadcn lint** against the changed TSX files and resolve avoidable raw-color/composition findings.

### Task 5: Verify the finished screen

**Files:**
- No production file changes unless verification exposes an in-scope mismatch.

- [ ] **Step 1: Run focused tests** for every changed chat and settings component.
- [ ] **Step 2: Run `npm run lint`** and resolve errors introduced by this work without touching unrelated existing failures.
- [ ] **Step 3: Run `npm run build`** and require exit code 0.
- [ ] **Step 4: Start the Vite app and use Playwright** to inspect desktop and mobile chat layouts, composer state switching, drawer open/close, light theme, and dark theme.
- [ ] **Step 5: Compare screenshots** against the three Figma targets and correct in-scope spacing, sizing, and alignment differences.
