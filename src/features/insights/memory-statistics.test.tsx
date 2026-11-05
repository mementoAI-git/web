import { expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test";
import { MemoryStatistics } from "./memory-statistics";

it("shows the four reference metrics from current account data", async () => {
  server.use(
    http.get("http://localhost:3000/api/users/stats", () =>
      HttpResponse.json({
        success: true,
        data: {
          enrichment_score: 80,
          streak_count: 21,
          reflections_count: 1200,
        },
      }),
    ),
    http.get("http://localhost:3000/api/memories/stats", () =>
      HttpResponse.json({ success: true, data: { stories_count: 240 } }),
    ),
  );
  renderWithProviders(<MemoryStatistics />, { auth: true });
  const metrics = within(
    screen.getByRole("region", { name: "Memory statistics" }),
  );
  expect(await metrics.findByText("240")).toBeInTheDocument();
  expect(await metrics.findByText("1200")).toBeInTheDocument();
  expect(metrics.getByText("21")).toBeInTheDocument();
  expect(metrics.getByText("Strong")).toBeInTheDocument();
  for (const label of [
    "Memories saved",
    "Reflections replied",
    "Current streak",
    "Your enrichment score",
  ])
    expect(metrics.getByText(label)).toBeVisible();
});
