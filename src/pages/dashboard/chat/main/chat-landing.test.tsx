import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, server } from "@/test";
import { http, HttpResponse } from "msw";
import ChatLandingPage from "./index";

const BASE_URL = "http://localhost:3000/api";

describe("ChatLandingPage", () => {
  it("renders the greeting headings", () => {
    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    const headings = screen.getAllByText((_, el) =>
      (el?.tagName === "H4" && el.textContent?.includes("on your mind today")) || false,
    );
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the chat input", () => {
    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    expect(
      screen.getByPlaceholderText("Type text here..."),
    ).toBeInTheDocument();
  });

  it("shows 'Suggested Conversations' section heading", async () => {
    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    await waitFor(() => {
      expect(screen.getByText("Suggested Conversations")).toBeInTheDocument();
    });
  });

  it("shows 'Recent Conversations' when API returns conversations", async () => {
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

    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    await waitFor(() => {
      expect(screen.getByText("Recent Conversations")).toBeInTheDocument();
    });
  });

  it("hides 'Recent Conversations' when no conversations exist", async () => {
    server.use(
      http.get(`${BASE_URL}/memories/conversations`, () => {
        return HttpResponse.json({
          success: true,
          data: { docs: [] },
        });
      }),
    );

    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    await waitFor(() => {
      expect(
        screen.queryByText("Recent Conversations"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows fallback nickname when user is not loaded", () => {
    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    expect(screen.getByText("User")).toBeInTheDocument();
  });
});
