import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, server } from "@/test";
import { http, HttpResponse } from "msw";
import RecentConversations from "./recent-conversation";

const BASE_URL = "http://localhost:3000/api";

describe("RecentConversations", () => {
  it("uses full width up to 560px max on the section shell", async () => {
    server.use(
      http.get(`${BASE_URL}/memories/conversations`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            docs: [
              {
                _id: "conv-1",
                title: "First chat",
                updated_at: new Date().toISOString(),
                type: "conversation",
              },
            ],
          },
        });
      }),
    );

    renderWithProviders(<RecentConversations />, { auth: true, route: "/chat" });

    await waitFor(() => {
      expect(screen.getByText("Recent Conversations")).toBeInTheDocument();
    });

    const heading = screen.getByText("Recent Conversations");
    const shell = heading.parentElement?.parentElement;
    expect(shell?.className).toMatch(/w-full/);
    expect(shell?.className).toMatch(/max-w-\[560px\]/);
  });
});
