import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { openCustomerPortal } from "@/features/pricing/open-customer-portal";
import Billing from "./billing";
import { Routes, Route } from "react-router-dom";

vi.mock("@/features/pricing/open-customer-portal", () => ({
  openCustomerPortal: vi.fn(),
}));
const base = "http://localhost:3000/api/billing";
function pro(status = "active") {
  server.use(
    http.get(`${base}/subscription`, () =>
      HttpResponse.json({
        success: true,
        data: {
          tier: "pro",
          status,
          usage: {
            storage_used_bytes: 3.5 * 1024 ** 3,
            storage_limit_bytes: 10 * 1024 ** 3,
          },
        },
      }),
    ),
    http.get(`${base}/account`, () =>
      HttpResponse.json({
        success: true,
        data: {
          has_customer: true,
          email: "billing@example.com",
          name: "Bill User",
          address: { line1: "1 Memory Lane", city: "Lagos", country: "NG" },
          payment_methods: [
            {
              id: "pm_1",
              brand: "mastercard",
              last4: "1312",
              is_default: true,
            },
          ],
        },
      }),
    ),
  );
}
beforeEach(() => vi.clearAllMocks());
describe("Billing", () => {
  it("shows the free design, empty payment methods and theme-adaptive promo button", async () => {
    renderWithProviders(<Billing />, { auth: true });
    expect(await screen.findByText("Unlock more with Pro")).toBeInTheDocument();
    expect(
      await screen.findByText("No payment methods added yet."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redeem" })).toHaveClass(
      "bg-fill-neutral-weak",
      "text-text-neutral-strong",
    );
  });
  it("shows real Pro usage, billing details and masked cards", async () => {
    pro();
    renderWithProviders(<Billing />, { auth: true });
    expect(
      await screen.findByText("You’re on Memento Pro"),
    ).toBeInTheDocument();
    expect(await screen.findByText("billing@example.com")).toBeInTheDocument();
    expect(screen.getByText("•••• 1312")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("3.5 GB / 10.0 GB Used")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Storage used" }),
    ).toHaveAttribute("aria-valuenow", "35");
  });
  it("uses actual past due status instead of displaying Active", async () => {
    pro("past_due");
    renderWithProviders(<Billing />, { auth: true });
    expect(await screen.findByText("Past due")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
  it("opens plan selection from the banner and retains portal controls", async () => {
    pro();
    vi.mocked(openCustomerPortal).mockRejectedValue(
      new Error("Portal unavailable"),
    );
    const error = vi.spyOn(toast, "error");
    const user = userEvent.setup();
    renderWithProviders(<Billing />, { auth: true });
    await screen.findByText("billing@example.com");
    await user.click(screen.getByRole("button", { name: "Manage plan" }));
    expect(
      screen.getByRole("dialog", { name: "Manage plan" }),
    ).toBeInTheDocument();
    expect(openCustomerPortal).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add new" }));
    expect(openCustomerPortal).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith("Portal unavailable");
  });
  it("shows recent invoices with real amounts and links", async () => {
    server.use(
      http.get(`${base}/invoices`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: "inv_1",
              label: "INV-001",
              amount: 1500,
              currency: "USD",
              status: "paid",
              url: "https://billing.example/invoice",
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<Billing />, { auth: true });
    await user.click(screen.getByRole("tab", { name: "Recent invoices" }));
    expect(await screen.findByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("$15.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View invoice" })).toHaveAttribute(
      "href",
      "https://billing.example/invoice",
    );
  });
  it("reports billing errors without inventing account details", async () => {
    server.use(
      http.get(`${base}/account`, () =>
        HttpResponse.json(
          { success: false, message: "Unavailable" },
          { status: 503 },
        ),
      ),
    );
    renderWithProviders(<Billing />, { auth: true });
    expect(
      await screen.findByRole("button", { name: "Retry billing details" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
  });
  it("submits a trimmed promo code and clears it after success", async () => {
    let submitted: unknown;
    server.use(
      http.post(`${base}/promo/redeem`, async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ success: true, data: {} });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<Billing />, { auth: true });
    await user.type(screen.getByRole("textbox", { name: "Code" }), "  PRO20  ");
    await user.click(screen.getByRole("button", { name: "Redeem" }));
    expect(submitted).toEqual({ code: "PRO20" });
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue("");
  });
  it("routes upgrades and first payment setup to checkout plan selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Billing />} />
        <Route path="/pricing" element={<p>Choose a plan</p>} />
      </Routes>,
      { auth: true },
    );
    await screen.findByText("Unlock more with Pro");
    await user.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(await screen.findByText("Choose a plan")).toBeInTheDocument();
  });
  it("keeps rejected promo codes available for correction", async () => {
    server.use(
      http.post(`${base}/promo/redeem`, () =>
        HttpResponse.json({
          success: false,
          message: "Promo code has expired",
        }),
      ),
    );
    const error = vi.spyOn(toast, "error");
    const user = userEvent.setup();
    renderWithProviders(<Billing />, { auth: true });
    await user.type(screen.getByRole("textbox", { name: "Code" }), "EXPIRED");
    await user.click(screen.getByRole("button", { name: "Redeem" }));
    expect(error).toHaveBeenCalledWith("Promo code has expired");
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      "EXPIRED",
    );
    expect(screen.getByRole("button", { name: "Redeem" })).toBeEnabled();
  });
});

it("handles checkout return without claiming a completed payment", async () => {
  const info = vi.spyOn(toast, "info");
  const success = vi.spyOn(toast, "success");
  renderWithProviders(<Billing />, { auth: true, route: "/settings/billing?checkout=success" });
  await screen.findByText("Unlock more with Pro");
  expect(info).toHaveBeenCalledWith(
    "Checkout returned. Your plan will update when payment is confirmed.", expect.anything(),
  );
  expect(success).not.toHaveBeenCalled();
});

it("keeps checking after checkout until the payment unlocks Pro", async () => {
  // Polar's webhook usually lands after the redirect back, so the first
  // check still says Free.
  let calls = 0;
  server.use(
    http.get(`${base}/subscription`, () => {
      calls += 1;
      return HttpResponse.json({
        success: true,
        data: { tier: calls >= 3 ? "pro" : "free", status: "active", usage: {} },
      });
    }),
  );
  const success = vi.spyOn(toast, "success");
  renderWithProviders(<Billing />, { auth: true, route: "/settings/billing?checkout=success" });

  await waitFor(() => expect(success).toHaveBeenCalledWith("Payment confirmed. Welcome to Pro."), { timeout: 8000 });
  expect(calls).toBeGreaterThanOrEqual(3);
}, 15000);

it("reports cancelled checkout without claiming plan changes", async () => {
  const info = vi.spyOn(toast, "info");
  renderWithProviders(<Billing />, { auth: true, route: "/settings/billing?checkout=cancelled" });
  await screen.findByText("Unlock more with Pro");
  expect(info).toHaveBeenCalledWith("Checkout cancelled. You can try again whenever you’re ready.");
});


it("prevents overlapping promo submissions and preserves failed input", async () => {
  let finish!: () => void;
  let requests = 0;
  server.use(http.post(base + "/promo/redeem", async () => {
    requests++;
    await new Promise<void>(resolve => { finish = resolve; });
    return HttpResponse.json({ success: false, message: "Try later" });
  }));
  renderWithProviders(<Billing />, { auth: true });
  const input = screen.getByRole("textbox", { name: "Code" });
  await userEvent.type(input, "PROMO");
  fireEvent.submit(input.closest("form")!);
  fireEvent.submit(input.closest("form")!);
  await waitFor(() => expect(requests).toBe(1));
  expect(input).toBeDisabled();
  finish();
  await waitFor(() => expect(input).toBeEnabled());
  expect(input).toHaveValue("PROMO");
});
