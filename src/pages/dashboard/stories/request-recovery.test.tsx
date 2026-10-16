import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { storageKeys } from "@/utility/constant";
import StoriesPage from "./index";

vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));

describe("Stories request recovery with real SWR requests", () => {
  it.each(["list", "grid"])("recovers a failed %s request to a confirmed empty result", async (mode) => {
    localStorage.setItem(storageKeys.listmode, mode);
    let unavailable = true;
    let requests = 0;
    server.use(http.get(/\/memories\/stories/, () => {
      requests++;
      return unavailable
        ? HttpResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
        : HttpResponse.json({ success: true, data: { docs: [], page: 1, totalPages: 1, totalDocs: 0, hasNextPage: false } });
    }));
    const user = userEvent.setup();
    renderWithProviders(<SWRConfig value={{ shouldRetryOnError: false }}><StoriesPage /></SWRConfig>, { route: "/stories", auth: true });
    const retry = await screen.findByRole("button", { name: "Retry loading stories" });
    expect(screen.queryByText("No stories yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
    unavailable = false;
    await user.click(retry);
    expect(await screen.findByText("No stories yet")).toBeVisible();
    await waitFor(() => expect(requests).toBe(2));
  });
});
