import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
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
  default: () => null,
}));

vi.mock("@/features/enrichment", () => ({
  useEnrichmentStats: () => ({
    stats: null,
    isLoading: false,
    deltaToday: 0,
    milestoneJustReached: false,
    nudgeDimension: "relationships_people",
    nudgeQuestion: "Want to go deeper on an important relationship?",
  }),
}));

describe("Conversation host chat tools", () => {
  it("does not render the host chat tools section", async () => {
    server.use(
      http.get(`${API}/memories/:id`, () =>
        HttpResponse.json({
          success: true,
          data: {
            _id: "mem-deep-dive-1",
            title: "Your Memento",
            body: "I keep thinking about the people who shaped me.",
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
      http.get(`${API}/ai/prompt/messages/:id`, () =>
        HttpResponse.json({
          success: true,
          data: {
            messages: [],
            next: null,
          },
          message: "ok",
        }),
      ),
    );

    renderWithProviders(
      <ConversationChromeProvider>
        <Conversation id="mem-deep-dive-1" />
      </ConversationChromeProvider>,
      {
        auth: true,
        route: "/chat/mem-deep-dive-1",
      },
    );

    await screen.findByPlaceholderText(/type text here/i);

    expect(
      screen.queryByRole("toolbar", { name: /host chat tools/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Want to go deeper on an important relationship?"),
    ).not.toBeInTheDocument();
  });
});
