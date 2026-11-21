import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { VoiceMinutesCards } from "./voice-minutes-cards";

function usage(data: Record<string, unknown>) {
  server.use(http.get("*/ai/voice/usage", () => HttpResponse.json({ success: true, data })));
}

describe("VoiceMinutesCards", () => {
  it("shows this month with the free allowance left, and all time", async () => {
    usage({ month: "2026-11", month_seconds: 45 * 60, all_time_seconds: 3 * 3600 + 5 * 60, month_resets_at: "2026-11-30T23:00:00.000Z", free_seconds_limit: 5400, free_seconds_left: 45 * 60 });
    renderWithProviders(<VoiceMinutesCards />, { route: "/insights", auth: true });
    expect(await screen.findByRole("region", { name: "Voice mode this month: 45 min" })).toBeInTheDocument();
    expect(screen.getByText("45 of 90 free min left")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Free voice minutes used" })).toHaveAttribute("aria-valuenow", "45");
    expect(screen.getByRole("region", { name: "Voice mode all time: 3 h 5 min" })).toBeInTheDocument();
  });

  it("has no allowance on a paid plan", async () => {
    usage({ month: "2026-11", month_seconds: 600, all_time_seconds: 600, month_resets_at: null, free_seconds_limit: null, free_seconds_left: null });
    renderWithProviders(<VoiceMinutesCards />, { route: "/insights", auth: true });
    expect(await screen.findByRole("region", { name: "Voice mode this month: 10 min" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
