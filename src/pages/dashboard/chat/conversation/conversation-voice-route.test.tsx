import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import Conversation from "./index";

const API = "http://localhost:3000/api";

vi.mock("@/components/Chatinput/Voiceinput", () => ({
  default: function VoiceinputMock() {
    return <div data-testid="voice-input-mock">Voice mode</div>;
  },
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

vi.mock("@/components/memory/sidebar-details", () => ({
  default: () => null,
}));

describe("Conversation voice route", () => {
  const proSubscription = http.get(`${API}/billing/subscription`, () =>
    HttpResponse.json({
      success: true,
      data: { tier: "pro", status: "active", features: [] },
    }),
  );

  it("renders voice UI while memory is still loading (does not block on Loader)", async () => {
    server.use(
      proSubscription,
      http.get(`${API}/memories/:id`, () => new Promise(() => {})),
    );

    renderWithProviders(
      <ConversationChromeProvider>
        <Conversation id="mem-voice-1" />
      </ConversationChromeProvider>,
      {
        auth: true,
        route: "/chat/mem-voice-1/voice",
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("voice-input-mock")).toBeInTheDocument();
    });
  });

  it("renders voice UI after memory loads", async () => {
    server.use(
      proSubscription,
      http.get(`${API}/memories/:id`, () =>
        HttpResponse.json({
          success: true,
          data: {
            _id: "mem-voice-2",
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
          message: "ok",
        }),
      ),
    );

    renderWithProviders(
      <ConversationChromeProvider>
        <Conversation id="mem-voice-2" />
      </ConversationChromeProvider>,
      {
        auth: true,
        route: "/chat/mem-voice-2/voice",
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("voice-input-mock")).toBeInTheDocument();
    });
  });
});
