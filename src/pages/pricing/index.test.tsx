import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/test";
import PricingPage from "./index";

const checkout = vi.fn().mockRejectedValue(new Error("Checkout unavailable"));
const navigate = vi.fn();
vi.mock("@/features/pricing/start-checkout", () => ({
  startCheckout: (...args: unknown[]) => checkout(...args),
}));
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  )),
  useNavigate: () => navigate,
}));

describe("Pricing overlay", () => {
  beforeEach(() => {
    checkout.mockClear();
    navigate.mockClear();
  });
  it("shows mobile's Free and Pro plans in an accessible overlay", () => {
    renderWithProviders(<PricingPage />, { route: "/pricing", auth: true });
    const dialog = screen.getByRole("dialog", { name: /plans that grow/i });
    expect(
      within(dialog).getByRole("heading", { name: "Free" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Pro" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/200 MB/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/10 GB/)[0]).toBeInTheDocument();
    expect(within(dialog).getByText("$9.99")).toBeInTheDocument();
    expect(within(dialog).queryByText("$79.00")).not.toBeInTheDocument();
  });
  it("uses the selected mobile billing interval for Pro checkout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingPage />, { route: "/pricing", auth: true });

    await user.click(screen.getByRole("radio", { name: "Annual" }));
    await user.click(
      await screen.findByRole("button", { name: /start 14-day trial/i }),
    );
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "pro", interval: "annual" }),
    );
    expect(
      await screen.findByRole("button", { name: /start 14-day trial/i }),
    ).toBeEnabled();
  });
  it("closes the route overlay to overview when opened directly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingPage />, { route: "/pricing", auth: true });
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(navigate).toHaveBeenCalledWith("/overview", { replace: true });
  });
  it.each([
    "/stories?tab=bookmarked#saved",
    "/explore/categories/work_purpose",
    "/chat/memory-1",
    "/settings/billing",
  ])("returns to %s when closing pricing", async (returnTo) => {
    renderWithProviders(<PricingPage />, {
      auth: true,
      routerProps: {
        initialEntries: [{ pathname: "/pricing", state: { returnTo } }],
      },
    });
    await userEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(navigate).toHaveBeenCalledWith(returnTo, { replace: true });
  });

  it("returns to the URL carried through a full-page upgrade link", async () => {
    renderWithProviders(<PricingPage />, {
      route: "/pricing?returnTo=%2Fchat%2Fm1%3Fvoice%3D1",
      auth: true,
    });
    await userEvent.keyboard("{Escape}");
    expect(navigate).toHaveBeenCalledWith("/chat/m1?voice=1", {
      replace: true,
    });
  });
  it.each([
    "https://example.com",
    "//example.com",
    "/pricing",
    "/pricing?interval=annual",
  ])("ignores an invalid return destination %s", async (returnTo) => {
    renderWithProviders(<PricingPage />, {
      auth: true,
      routerProps: {
        initialEntries: [{ pathname: "/pricing", state: { returnTo } }],
      },
    });
    await userEvent.keyboard("{Escape}");
    expect(navigate).toHaveBeenCalledWith("/overview", { replace: true });
  });
});
