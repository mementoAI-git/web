import { fireEvent, screen, waitFor } from "@testing-library/react";
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

describe("Conversation deep dive", () => {
  it("requests a follow-up prompt when deep dive starts", async () => {
    let requestBody: Record<string, unknown> | null = null;

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
      http.post(`${API}/ai/tasks/run`, async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          success: true,
          data: {
            result: {
              dimension: "relationships_people",
              question:
                "Who in that relationship changed the way you see yourself?",
              summary: "Follow up on the person behind the memory.",
            },
            summary: "Generated a deep-dive question.",
          },
          message: "ok",
        });
      }),
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

    expect(
      await screen.findByText("Want to go deeper on an important relationship?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    await waitFor(() => {
      expect(requestBody).toEqual({
        task: "chat.deep_dive_followup",
        mode: "assist",
        context: {
          text: "Your Memento\n\nI keep thinking about the people who shaped me.",
          dimension: "relationships_people",
        },
      });
    });

    expect(
      await screen.findByText(
        "Who in that relationship changed the way you see yourself?",
      ),
    ).toBeInTheDocument();
  });
});
