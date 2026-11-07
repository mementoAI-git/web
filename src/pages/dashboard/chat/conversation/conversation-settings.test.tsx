import { fireEvent, screen, waitFor } from "@testing-library/react";
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

Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

vi.mock("@/hooks/use-intersection-observer", () => ({
  default: () => false,
}));

vi.mock("@/components/memory/sidebar-details", () => ({
  default: ({
    isOpen,
    includeChatPreferences,
    desktopLayout,
    onOpenConversationFiles,
  }: {
    isOpen: boolean;
    includeChatPreferences?: boolean;
    desktopLayout?: "overlay" | "inline";
    onOpenConversationFiles?: (request: unknown) => void;
  }) => (
    <div
      data-testid="sidebar-details"
      data-open={String(isOpen)}
      data-unified={String(Boolean(includeChatPreferences))}
      data-layout={desktopLayout}
      data-has-files={String(Boolean(onOpenConversationFiles))}
    />
  ),
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
      Settings
    </button>
  );
}

describe("Conversation settings", () => {
  it("opens the unified details drawer from the settings trigger", async () => {
    server.use(
      http.get(`${API}/memories/:id`, ({ params }) =>
        HttpResponse.json({
          success: true,
          data: {
            _id: String(params.id),
            title: "Your Memento",
            body: "",
            user: "mock-user",
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
          message: "Memory fetched",
        }),
      ),
      http.get(`${API}/ai/prompt/messages/:id`, () =>
        HttpResponse.json({
          success: true,
          data: { messages: [], next: null },
          message: "Messages fetched",
        }),
      ),
    );

    renderWithProviders(
      <ConversationChromeProvider>
        <SettingsTrigger />
        <Conversation id="m1" />
      </ConversationChromeProvider>,
      { auth: true, route: "/chat/m1" },
    );

    const settings = screen.getByRole("button", { name: "Settings" });
    await waitFor(() => expect(settings).toBeEnabled());
    fireEvent.click(settings);

    expect(screen.getByTestId("sidebar-details")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(screen.getByTestId("sidebar-details")).toHaveAttribute(
      "data-unified",
      "true",
    );
    expect(screen.getByTestId("sidebar-details")).toHaveAttribute(
      "data-layout",
      "inline",
    );
    expect(screen.getByTestId("sidebar-details")).toHaveAttribute(
      "data-has-files",
      "true",
    );
  });
});
