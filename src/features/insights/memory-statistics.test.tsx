import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test";
import { MemoryStatistics } from "./memory-statistics";

const base = "http://localhost:3000/api";
describe("MemoryStatistics", () => {
  it("shows the relocated metrics using current account data", async () => {
    server.use(
      http.get(`${base}/users/stats`, () =>
        HttpResponse.json({
          success: true,
          data: {
            enrichment_score: 64,
            streak_count: 5,
            top_dimension: "Relationships",
          },
        }),
      ),
      http.get(`${base}/memories/stats`, () =>
        HttpResponse.json({ success: true, data: { stories_count: 12 } }),
      ),
    );
    renderWithProviders(<MemoryStatistics />, { auth: true });
    const metrics = within(
      screen.getByRole("region", { name: "Memory statistics" }),
    );
    expect(await metrics.findByText("64%")).toBeInTheDocument();
    expect(await metrics.findByText("12")).toBeInTheDocument();
    expect(metrics.getByText("5")).toBeInTheDocument();
    expect(metrics.getByText("Relationships")).toBeInTheDocument();
    expect(metrics.getByText("Good progress")).toBeInTheDocument();
  });
  it("keeps the enrichment bar within its bounds", async () => {
    server.use(
      http.get(`${base}/users/stats`, () =>
        HttpResponse.json({ success: true, data: { enrichment_score: 140 } }),
      ),
    );
    const { container } = renderWithProviders(<MemoryStatistics />, {
      auth: true,
    });
    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(container.querySelector("[style]")).toHaveStyle({ width: "100%" });
  });
});
