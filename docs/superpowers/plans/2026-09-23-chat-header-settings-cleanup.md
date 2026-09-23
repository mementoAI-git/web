# Chat Header and Settings Drawer Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the conversation-header Share shortcut with Voice mode and consolidate memory details plus chat preferences into the existing Settings drawer.

**Architecture:** Keep the dashboard header responsible only for route-aware actions, using the current `/chat/:id/voice` route for Voice mode. Keep `SidebarDetails` as the single drawer implementation, but change its conversation-specific configuration from mutually exclusive memory/chat states to one scrollable composition containing both sections. Conversation state will only track whether that unified drawer is open.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS 4, existing shadcn-style `Button`, `Badge`, and `Separator` primitives, Vitest, Testing Library.

---

## File map

- `src/pages/dashboard/component/dashboard-header.tsx`: remove Share and Info actions; add the route-aware Voice mode link; preserve Search and Settings.
- `src/pages/dashboard/component/dashboard-header.test.tsx`: lock the conversation-header action set and Voice mode destination.
- `src/components/memory/sidebar-details.tsx`: compose memory details and chat preferences into one scroll surface for conversation settings.
- `src/components/memory/sidebar-details.test.tsx`: verify the unified content and desktop sizing.
- `src/pages/dashboard/chat/conversation/index.tsx`: remove memory/chat tab state and open one unified sidebar from Settings.
- `src/contexts/conversation-chrome.tsx`: remove the obsolete Info and export callbacks from conversation-header state.
- `src/pages/dashboard/chat/conversation/conversation-settings.test.tsx`: verify the Settings callback opens the unified drawer configuration.

### Task 1: Replace the conversation Share shortcut with Voice mode

**Files:**
- Modify: `src/pages/dashboard/component/dashboard-header.test.tsx`
- Modify: `src/pages/dashboard/component/dashboard-header.tsx`

- [ ] **Step 1: Write the failing header test**

Update the conversation chrome fixture to expose Search and Settings, then replace the existing settings-only assertion with the complete approved action contract:

```tsx
setChrome({
  memory: memory as IMemory,
  onOpenChatPreferences: () => {},
  hostChat: {
    title: "Your Memento",
    onSearch: () => {},
  },
});
```

```tsx
it("shows Search, Voice mode, and Settings without Share or Info", () => {
  renderWithProviders(
    <ChatSidebarProvider>
      <ConversationChromeProvider>
        <DashboardHeaderWithConversationChrome
          memory={{ _id: "m1", title: "Test thread", bookmarked: false }}
        />
      </ConversationChromeProvider>
    </ChatSidebarProvider>,
    { route: "/chat/m1", auth: true },
  );

  expect(screen.getByRole("button", { name: /search memories/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /voice mode/i })).toHaveAttribute(
    "href",
    "/chat/m1/voice",
  );
  expect(screen.getByRole("button", { name: /chat settings/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /share conversation/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /open memory sidebar/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npm test -- src/pages/dashboard/component/dashboard-header.test.tsx
```

Expected: FAIL because Share and Info still render and no `Voice mode` link exists.

- [ ] **Step 3: Implement the minimal header action change**

In `dashboard-header.tsx`, replace the `Share2` import with `Phone`, remove the `MemoryDropdown` import, and replace the Share block with:

```tsx
{chatConversationMatch?.params?.id ? (
  <Link
    to={`/chat/${chatConversationMatch.params.id}/voice`}
    className={cn(convHeaderActionGhost, "no-underline")}
    aria-label="Voice mode"
  >
    <Phone
      className="size-4 shrink-0"
      strokeWidth={1.75}
      aria-hidden
    />
  </Link>
) : null}
```

Delete the conversation-header `MemoryDropdown` block. Leave the `hostChat.onSearch` and `onOpenChatPreferences` blocks unchanged.

- [ ] **Step 4: Run the focused header test**

Run:

```bash
npm test -- src/pages/dashboard/component/dashboard-header.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the header change**

```bash
git add src/pages/dashboard/component/dashboard-header.tsx src/pages/dashboard/component/dashboard-header.test.tsx
git commit -m "fix: replace chat share action with voice mode"
```

### Task 2: Compose one unified Settings drawer

**Files:**
- Modify: `src/components/memory/sidebar-details.test.tsx`
- Modify: `src/components/memory/sidebar-details.tsx`

- [ ] **Step 1: Write the failing unified-drawer test**

Replace chat-tab-specific tests with a test that requests chat preferences and expects both content families in the same rendered surface:

```tsx
it("renders memory details and chat preferences in one settings drawer", () => {
  const { container } = renderSidebar({
    isOpen: true,
    includeChatPreferences: true,
  });

  const desktopPanel = container.querySelector(
    '[data-testid="memory-sidebar-desktop"]',
  ) as HTMLElement | null;

  expect(desktopPanel).toHaveStyle({ width: "400px" });
  expect(screen.getAllByText(/properties/i).length).toBeGreaterThan(0);
  expect(screen.getAllByTestId("mock-chat-preferences-panel").length).toBeGreaterThan(0);

  const content = desktopPanel?.querySelector('[data-testid="sidebar-details-content"]');
  expect(content).toHaveClass("overflow-y-auto");
});
```

Update the narrow-viewport width test to pass `includeChatPreferences: true` instead of the old tab props.

- [ ] **Step 2: Run the sidebar test and verify failure**

Run:

```bash
npm test -- src/components/memory/sidebar-details.test.tsx
```

Expected: FAIL because `includeChatPreferences` does not exist and the component still renders either memory content or chat preferences.

- [ ] **Step 3: Replace tab state props with a composition prop**

In `sidebar-details.tsx`, remove `SidebarPanelTab`, `enableChatPreferencesTab`, `activeTab`, and `onTabChange`. Add this prop to `SidebarDetailsProps` and `ContentProps`:

```tsx
/** Conversation settings append sound, voice, and upgrade controls after memory details. */
includeChatPreferences?: boolean;
```

Render the content as one scroll surface:

```tsx
<div
  data-testid="sidebar-details-content"
  className={cn(
    "flex h-full w-full min-w-0 max-w-full flex-col overflow-y-auto overflow-x-hidden bg-v3-bg p-3 sm:p-4 lg:p-6",
    includeChatPreferences ? "gap-0" : "min-w-[min(100%,287px)]",
    isDesktopOverlayCard &&
      "rounded-[24px] border border-v3-stroke-weak shadow-[0_8px_32px_rgba(15,23,42,0.08)]",
  )}
>
  <MemorySections
    memory={memory}
    isMobile={isMobile}
    source={source}
    quickActions={quickActions}
    open={open}
    runAndMaybeCloseMobile={runAndMaybeCloseMobile}
    enrichmentScore={enrichmentScore}
    deltaToday={deltaToday}
    categoryScores={categoryScores}
  />
  {includeChatPreferences ? (
    <>
      <Separator className="my-4 bg-v3-stroke-weak" />
      <ChatPreferencesPanel
        density="compact"
        className="h-auto flex-none overflow-visible pb-4"
      />
    </>
  ) : null}
</div>
```

Compute desktop width with:

```tsx
const desktopWidthPx = useAnimatedSidebarWidthPx(
  isOpen,
  Boolean(includeChatPreferences),
);
```

Pass `includeChatPreferences` through both the mobile and desktop `Content` render paths.

- [ ] **Step 4: Run the sidebar test**

Run:

```bash
npm test -- src/components/memory/sidebar-details.test.tsx
```

Expected: PASS, with both memory and preferences present and the unified desktop drawer capped at 400px.

- [ ] **Step 5: Commit the drawer composition**

```bash
git add src/components/memory/sidebar-details.tsx src/components/memory/sidebar-details.test.tsx
git commit -m "fix: unify chat details and settings drawer"
```

### Task 3: Simplify conversation drawer state and chrome wiring

**Files:**
- Modify: `src/pages/dashboard/chat/conversation/index.tsx`
- Modify: `src/contexts/conversation-chrome.tsx`
- Create: `src/pages/dashboard/chat/conversation/conversation-settings.test.tsx`

- [ ] **Step 1: Confirm obsolete state and callbacks**

Run:

```bash
rg -n "sidebarTab|setSidebarTab|onViewDetails|onExportConversation|enableChatPreferencesTab|activeTab|onTabChange" src
```

Expected: `sidebarTab` and old sidebar configuration occur only in the conversation/sidebar files. `ConversationChromeState.onViewDetails` and `ConversationChromeState.onExportConversation` have no remaining consumer after the header change.

- [ ] **Step 2: Write the failing Settings wiring test**

Create `conversation-settings.test.tsx` with the existing conversation API handlers and a sidebar mock that exposes its configuration:

```tsx
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import {
  ConversationChromeProvider,
  useConversationChrome,
} from "@/contexts/conversation-chrome";
import Conversation from "./index";

const API = "http://localhost:3000/api";

vi.mock("@/components/memory/sidebar-details", () => ({
  default: ({
    isOpen,
    includeChatPreferences,
  }: {
    isOpen: boolean;
    includeChatPreferences?: boolean;
  }) => (
    <div
      data-testid="settings-sidebar"
      data-open={String(isOpen)}
      data-unified={String(Boolean(includeChatPreferences))}
    />
  ),
}));

vi.mock("@/hooks/use-intersection-observer", () => ({
  default: () => false,
}));

vi.mock("@/features/enrichment", () => ({
  useEnrichmentStats: () => ({
    stats: null,
    isLoading: false,
    deltaToday: 0,
    milestoneJustReached: false,
    nudgeDimension: null,
    nudgeQuestion: null,
  }),
}));

function SettingsTrigger() {
  const { chrome } = useConversationChrome();
  return (
    <button
      type="button"
      disabled={!chrome?.onOpenChatPreferences}
      onClick={chrome?.onOpenChatPreferences}
    >
      Open settings
    </button>
  );
}

describe("Conversation settings drawer", () => {
  it("opens the unified drawer from conversation chrome", async () => {
    server.use(
      http.get(`${API}/memories/:id`, () =>
        HttpResponse.json({
          success: true,
          data: {
            _id: "m1",
            title: "Your Memento",
            body: "",
            user: "u1",
            attachments: [],
            tags: [],
            type: "conversation",
            status: "active",
            level: 0,
            refrence: "",
            last_opened: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <ConversationChromeProvider>
        <SettingsTrigger />
        <Conversation id="m1" />
      </ConversationChromeProvider>,
      { auth: true, route: "/chat/m1" },
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Open settings" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Open settings" }));

    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("settings-sidebar")).toHaveAttribute("data-unified", "true");
  });
});
```

- [ ] **Step 3: Run the Settings wiring test and verify failure**

Run:

```bash
npm test -- src/pages/dashboard/chat/conversation/conversation-settings.test.tsx
```

Expected: FAIL because the sidebar still receives tab props instead of `includeChatPreferences`.

- [ ] **Step 4: Remove mutually exclusive drawer state**

In `conversation/index.tsx`, delete:

```tsx
const [sidebarTab, setSidebarTab] = useState<"memory" | "chat">("memory");
```

Use one close callback and one toggle callback:

```tsx
const handleCloseSidebar = useCallback(() => {
  setIsSidebarOpen(false);
}, []);

const handleToggleSettingsDrawer = useCallback(() => {
  setIsSidebarOpen((previous) => !previous);
}, []);
```

Use `handleToggleSettingsDrawer` for `onOpenChatPreferences`. Keep `handleOpenSidebar` only if the in-content conversation header still consumes it; if retained, make it call the same unified toggle behavior without changing section state.

Configure the drawer with:

```tsx
<SidebarDetails
  memory={memory}
  onClose={handleCloseSidebar}
  isOpen={isSidebarOpen}
  desktopLayout="inline"
  source={type === "prompt" ? "prompt" : "conversation"}
  quickActions={{
    onViewFullDetails: () => push("view-memory-details", { memory }),
    onEditMemory: () => push("edit-memory", { memory }),
    onExportConversation: handleExportConversation,
    onDelete: () => push("delete-memory", { memory }),
  }}
  includeChatPreferences
  enrichmentScore={enrichmentStats?.enrichment_score ?? 5}
  deltaToday={deltaToday}
  categoryScores={enrichmentStats?.category_scores}
/>
```

Remove `onViewDetails` and `onExportConversation` from `ConversationChromeState` and every `setChrome` payload. Preserve `handleExportConversation` inside the `SidebarDetails.quickActions` object.

- [ ] **Step 5: Run conversation and context tests**

Run:

```bash
npm test -- src/pages/dashboard/chat/conversation src/contexts/conversation-chrome.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the state cleanup**

```bash
git add src/pages/dashboard/chat/conversation/index.tsx src/pages/dashboard/chat/conversation/conversation-settings.test.tsx src/contexts/conversation-chrome.tsx
git commit -m "refactor: simplify conversation settings state"
```

### Task 4: Validate UI tokens and regression safety

**Files:**
- Verify: `src/pages/dashboard/component/dashboard-header.tsx`
- Verify: `src/components/memory/sidebar-details.tsx`
- Verify: `src/pages/dashboard/chat/conversation/index.tsx`

- [ ] **Step 1: Run the project variable checker**

Follow `.cursor/commands/check-variables.md` against the changed JSX files.

Expected output:

```text
All variables applied correctly.
```

- [ ] **Step 2: Run all focused tests together**

Run:

```bash
npm test -- src/pages/dashboard/component/dashboard-header.test.tsx src/components/memory/sidebar-details.test.tsx src/pages/dashboard/chat/conversation src/contexts/conversation-chrome.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0. If unrelated pre-existing lint failures occur, report them separately and ensure none originate in the changed files.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: exit code 0 and a generated Vite production bundle.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git diff --check
git diff -- src/pages/dashboard/component/dashboard-header.tsx src/pages/dashboard/component/dashboard-header.test.tsx src/components/memory/sidebar-details.tsx src/components/memory/sidebar-details.test.tsx src/pages/dashboard/chat/conversation/index.tsx src/contexts/conversation-chrome.tsx
```

Expected: no whitespace errors; only the approved header action and unified drawer changes are present.
