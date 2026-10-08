import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import PricingPage from "./index";

describe("Mobile pricing parity", () => {
  it("does not offer retired tiers or infer Naira prices from browser language", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-NG");
    renderWithProviders(<PricingPage />, { route: "/pricing", auth: true });
    expect(
      screen.queryByRole("heading", { name: "Legacy" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/lifetime/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/on the roadmap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Annual" }));
    expect(screen.getByText("$79.00")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
