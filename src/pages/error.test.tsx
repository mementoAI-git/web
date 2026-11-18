import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import ErrorPage from "./error";


describe("ErrorPage", () => {
  const back = vi.fn();
  const assign = vi.fn();
  beforeEach(() => {
    back.mockClear();
    assign.mockClear();
    vi.spyOn(window.history, "back").mockImplementation(back);
    vi.stubGlobal("location", { ...window.location, assign });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders illustration, copy, and actions", () => {
    renderWithProviders(<ErrorPage />, { route: "/error", auth: false });

    expect(screen.getByRole("img", { name: /^error$/i })).toBeInTheDocument();
    expect(screen.getByText("Error 505")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sorry, we seem to be having an issue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we have been automatically notified of this issue/i),
    ).toHaveClass("font-rounded");
    expect(screen.getByTestId("error-state-panel")).toHaveClass("backdrop-blur-xl");

    expect(screen.getByRole("button", { name: /go back/i })).toHaveAttribute("data-variant", "outline");
    expect(screen.getByRole("button", { name: /^overview$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /homepage/i })).not.toBeInTheDocument();
  });

  it("goes back to the previous screen, or to the overview", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ErrorPage />, { route: "/error", auth: false });

    await user.click(screen.getByRole("button", { name: /go back/i }));
    expect(back).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /^overview$/i }));
    expect(assign).toHaveBeenCalledWith("/overview");
  });
});
