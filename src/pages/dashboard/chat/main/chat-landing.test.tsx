import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, server } from "@/test";
import { http, HttpResponse } from "msw";
import ChatLandingPage from "./index";

const BASE_URL = "http://localhost:3000/api";

describe("ChatLandingPage", () => {
  it("renders the greeting headings with time-based message", () => {
    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    const headings = screen.getAllByRole("heading", { level: 3 });
    const greetingHeading = headings.find(
      (el) => (el.textContent?.length ?? 0) > 10 && el.textContent?.includes("?"),
    );
    expect(greetingHeading).toBeInTheDocument();
    expect(greetingHeading?.textContent?.length).toBeGreaterThan(10);
  });

  it("renders the chat input", () => {
    renderWithProviders(<ChatLandingPage />, {
      auth: true,
      route: "/chat",
    });

    expect(
      screen.getByPlaceholderText("Type text here... Type / for formatting"),
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

    const headingsWithUser = screen.getAllByText(/User/);
    expect(headingsWithUser.length).toBeGreaterThan(0);
    expect(headingsWithUser[0]).toBeInTheDocument();
  });
});
