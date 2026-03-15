import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { createMockUser } from "@/test/fixtures";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import MemoryInsightsModal from "./index";

const API_BASE = "http://localhost:3000/api";

describe("MemoryInsightsModal", () => {
  it("shows Summary as default category", () => {
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(screen.getByRole("button", { name: /summary/i })).toHaveClass(/bg-v3-fill-weak/);
  });

  it("shows empty state when no context and Summary selected", () => {
    server.use(
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: {} }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(screen.getByText(/your summary is being built/i)).toBeInTheDocument();
  });

  it("shows summary content when context exists", async () => {
    const userWithContext = createMockUser({
      context: {
        self_description: "A creative person who loves storytelling.",
        current_priority: "Preserving family memories",
        join_reasons: ["legacy", "reflection"],
      },
    });
    server.use(
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: userWithContext.context }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(await screen.findByText(/A creative person who loves storytelling/i)).toBeInTheDocument();
    expect(screen.getByText(/Currently focused on: Preserving family memories/i)).toBeInTheDocument();
  });

  it("switches to All category and shows insights when available", async () => {
    const user = userEvent.setup();
    const userWithContext = createMockUser({
      context: {
        self_description: "Test",
        current_priority: "Test",
        join_reasons: [],
        key_preferences: ["Pref one"],
      },
    });
    server.use(
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: userWithContext.context }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    await user.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getByText("Pref one")).toBeInTheDocument();
  });
});
