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
  it("shows Summary as default tab with summary in tab panel", () => {
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(screen.getByRole("tab", { name: /^summary$/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /^all$/i })).toHaveAttribute("aria-selected", "false");
  });

  it("shows empty summary when no context", async () => {
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: null,
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: {} }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Not enough context for a summary yet",
          data: { summary: null, generated_at: null, cached: false },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(
      await screen.findByText(/your summary is being built/i),
    ).toBeInTheDocument();
  });

  it("shows AI summary from endpoint when returned", async () => {
    const userWithContext = createMockUser({
      context: {
        self_description: "A creative person who loves storytelling.",
        current_priority: "Preserving family memories",
        join_reasons: ["legacy", "reflection"],
      },
    });
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: null,
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: userWithContext.context }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Memory insights summary generated",
          data: {
            summary:
              "I'm a creative person who loves storytelling.\n\nRight now I'm most focused on preserving family memories.",
            generated_at: "2026-05-01T12:00:00.000Z",
            cached: false,
          },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    expect(await screen.findByText(/A creative person who loves storytelling/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Right now I'm most focused on preserving family memories/i),
    ).toBeInTheDocument();
  });

  it("shows first-person AI summary and last updated from endpoint", async () => {
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: {
            user: "user-1",
            conversation_history_summary: "The user enjoys reading and quiet weekends.",
            updated_at: "2026-05-01T12:00:00.000Z",
          },
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: {} }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Memory insights summary generated",
          data: {
            summary: "I enjoy reading and quiet weekends.",
            generated_at: "2026-05-01T12:00:00.000Z",
            cached: false,
          },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    const summary = await screen.findByText(/I enjoy reading and quiet weekends/i);
    expect(summary.textContent ?? "").not.toMatch(/The user/i);
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });

  it("prefers GET /users/persona over context for insight lists", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: {
            user: "user-1",
            key_preferences: ["Persona-only preference"],
            join_reasons: ["memory_preservation"],
          },
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({
          success: true,
          data: {
            key_preferences: ["Should not appear — from context only."],
            join_reasons: [],
          },
        }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Not enough context for a summary yet",
          data: { summary: null, generated_at: null, cached: false },
        }),
      ),
    );
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    await user.click(screen.getByRole("tab", { name: /^all$/i }));
    expect(await screen.findByText("Persona-only preference")).toBeInTheDocument();
    expect(screen.queryByText("Should not appear — from context only.")).not.toBeInTheDocument();
  });

  it("shows insights under All when available", async () => {
    const userWithContext = createMockUser({
      context: {
        self_description: "Test",
        current_priority: "Test",
        join_reasons: [],
        key_preferences: ["Pref one"],
      },
    });
    server.use(
      http.get(`${API_BASE}/users/persona`, () =>
        HttpResponse.json({
          status: 200,
          message: "Persona retrieved successfully",
          data: null,
        }),
      ),
      http.get(`${API_BASE}/users/context`, () =>
        HttpResponse.json({ success: true, data: userWithContext.context }),
      ),
      http.get(`${API_BASE}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          status: 200,
          message: "Not enough context for a summary yet",
          data: { summary: null, generated_at: null, cached: false },
        }),
      ),
    );
    const u = userEvent.setup();
    renderWithProviders(<MemoryInsightsModal />, { route: "/overview", auth: true });
    await u.click(screen.getByRole("tab", { name: /^all$/i }));
    expect(await screen.findByText("Pref one")).toBeInTheDocument();
  });
});
