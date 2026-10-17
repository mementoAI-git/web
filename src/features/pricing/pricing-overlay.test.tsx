import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PricingOverlay } from "./pricing-overlay";
import { openCustomerPortal } from "./open-customer-portal";
import { startCheckout } from "./start-checkout";
vi.mock("./open-customer-portal", () => ({ openCustomerPortal: vi.fn() }));
vi.mock("./start-checkout", () => ({ startCheckout: vi.fn() }));

const state = vi.hoisted(() => ({
  paid: false,
  loading: false,
  error: null as unknown,
  checkout: true,
  pricing: true,
  interval: "monthly",
  manageable: true,
  scheduled: false,
}));
const navigate = vi.hoisted(() => vi.fn());
vi.mock("@/contexts/subscription", () => ({
  useSubscription: () => ({
    isProOrAbove: state.paid,
    summary: {
      tier: state.paid ? "pro" : "free",
      billing_interval: state.paid ? state.interval : null,
      can_manage_subscription: state.paid && state.manageable,
      cancel_at_period_end: state.scheduled,
    },
    refresh: vi.fn(),
    isLoading: state.loading,
    error: state.error,
  }),
}));
vi.mock("@/contexts/feature-flags", () => ({
  useFeatureFlags: () => ({
    canUse: (key: string) =>
      key === "billing.checkout" ? state.checkout : state.pricing,
  }),
}));
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  )),
  useNavigate: () => navigate,
}));

function show(onOpenChange = vi.fn()) {
  render(
    <MemoryRouter>
      <PricingOverlay open onOpenChange={onOpenChange} />
    </MemoryRouter>,
  );
  return onOpenChange;
}

describe("PricingOverlay subscription states", () => {
  beforeEach(() => {
    Object.assign(state, {
      paid: false,
      loading: false,
      error: null,
      checkout: true,
      pricing: true,
      interval: "monthly",
      manageable: true,
      scheduled: false,
    });
    vi.clearAllMocks();
    navigate.mockClear();
  });
  it("shows two cards and switches the Pro interval without duplicating cards", async () => {
    state.paid = true;
    show();
    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
    expect(screen.getByText("$9.99")).toBeInTheDocument();
    expect(screen.queryByText("$79.00")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Annual" }));
    expect(screen.getByText("$79.00")).toBeInTheDocument();
    expect(screen.queryByText("$9.99")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeEnabled();
    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Downgrade to free" }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/Capture your story today/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Prices shown in US dollars/),
    ).not.toBeInTheDocument();
  });
  it("visibly highlights the selected billing period with adaptive tab tokens", async () => {
    show();
    const monthly = screen.getByRole("radio", { name: "Monthly" });
    const annual = screen.getByRole("radio", { name: "Annual" });
    expect(monthly).toHaveAttribute("data-state", "on");
    expect(monthly).toHaveClass(
      "data-[state=on]:bg-fill-tab-active",
      "data-[state=on]:text-text-tab-active",
      "aria-pressed:bg-fill-tab-active",
    );
    expect(annual).toHaveAttribute("data-state", "off");
    await userEvent.click(annual);
    expect(annual).toHaveAttribute("data-state", "on");
    expect(monthly).toHaveAttribute("data-state", "off");
  });
  it("removes the card captions and uses a compact dialog with a white Pro action", async () => {
    show();
    expect(
      screen.queryByText("A place for your everyday memories."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Billed monthly/)).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("sm:max-w-[880px]");
    expect(
      screen.getByRole("button", { name: "Start 14-day trial" }),
    ).toHaveClass(
      "bg-[var(--fill-billing-badge)]",
      "text-[var(--text-billing-badge)]",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Annual" }));
    expect(screen.queryByText(/Billed yearly/)).not.toBeInTheDocument();
  });
  it("routes an existing subscriber through the portal instead of creating another subscription", async () => {
    state.paid = true;
    vi.mocked(openCustomerPortal).mockRejectedValue(
      new Error("Portal unavailable"),
    );
    show();
    await userEvent.click(screen.getByRole("radio", { name: "Annual" }));
    await userEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(openCustomerPortal).toHaveBeenCalledWith(
      `${window.location.origin}/settings/billing`,
    );
    expect(startCheckout).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeEnabled();
  });
  it("marks annual as current and allows a monthly switch", async () => {
    state.paid = true;
    state.interval = "annual";
    show();
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Annual" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    expect(
      screen.getByRole("button", { name: "Switch to monthly" }),
    ).toBeEnabled();
  });
  it("opens confirmation before downgrading and allows going back", async () => {
    state.paid = true;
    show();
    await userEvent.click(
      screen.getByRole("button", { name: "Downgrade to free" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Cancel your subscription?" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
  });
  it("shows scheduled cancellation with a keep plan action", () => {
    state.paid = true;
    state.scheduled = true;
    show();
    expect(screen.getByText("Cancellation scheduled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep plan" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Downgrade to free" }),
    ).toBeDisabled();
  });
  it("does not offer cancellation for non-recurring Pro access", () => {
    state.paid = true;
    state.manageable = false;
    show();
    expect(screen.getByRole("button", { name: "Cancel plan" })).toBeDisabled();
  });
  it("prevents checkout while the subscription is loading or unavailable", () => {
    state.loading = true;
    show();
    expect(
      screen.getAllByRole("button", { name: /loading your plan/i })[0],
    ).toBeDisabled();
  });
  it("prevents checkout when subscription lookup fails", () => {
    state.error = new Error("Unavailable");
    show();
    expect(
      screen.getAllByRole("button", { name: "Plan unavailable" })[0],
    ).toBeDisabled();
  });
  it("respects the checkout and pricing access flags", () => {
    state.checkout = false;
    show();
    expect(
      screen.getAllByRole("button", { name: "Checkout unavailable" })[0],
    ).toBeDisabled();
  });
  it("closes with Escape", async () => {
    const close = show();
    await userEvent.keyboard("{Escape}");
    expect(close).toHaveBeenCalledWith(false);
  });
  it("hides plans when pricing is disabled", () => {
    state.pricing = false;
    show();
    expect(
      screen.getByRole("dialog", { name: "Pricing is currently unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("$9.99")).not.toBeInTheDocument();
  });
});

it("keeps checkout open while pending and unlocks after failure", async () => {
  let reject!: (error: Error) => void;
  vi.mocked(startCheckout).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  Object.assign(state, { paid: false, loading: false, error: null, checkout: true, pricing: true });
  const close = show();
  await userEvent.click(screen.getByRole("button", { name: "Start 14-day trial" }));
  expect(screen.getByRole("button", { name: /Opening billing/ })).toBeDisabled();
  await userEvent.keyboard("{Escape}");
  expect(close).not.toHaveBeenCalled();
  reject(new Error("Checkout unavailable"));
  expect(await screen.findByRole("button", { name: "Start 14-day trial" })).toBeEnabled();
  await userEvent.keyboard("{Escape}");
  expect(close).toHaveBeenCalledWith(false);
});
