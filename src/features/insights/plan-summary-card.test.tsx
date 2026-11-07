import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanSummaryCard } from "./plan-summary-card";

const useSubscriptionSummary = vi.hoisted(() => vi.fn());
vi.mock("@/features/pricing/use-subscription-summary", () => ({
  useSubscriptionSummary,
}));

const onNavigate = vi.fn();
beforeEach(() => onNavigate.mockClear());

function setup(summary: object | null) {
  useSubscriptionSummary.mockReturnValue({ summary });
  return render(<PlanSummaryCard onNavigate={onNavigate} />);
}

it("renders nothing until the plan is known", () => {
  const { container } = setup(null);
  expect(container).toBeEmptyDOMElement();
});

it.each([
  [{ tier: "pro", status: "active" }, "You’re on Memento Pro"],
  [{ tier: "pro", status: "trialing" }, "You’re on a Memento Pro trial"],
  [{ tier: "legacy", status: "active" }, "You’re on Memento Legacy"],
])("sends paid members to billing: %o", async (summary, title) => {
  const user = userEvent.setup();
  setup(summary);
  expect(screen.getByText(title)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Manage plan" }));
  expect(onNavigate).toHaveBeenCalledWith("/settings/billing");
});

it("offers free members an upgrade", async () => {
  const user = userEvent.setup();
  setup({ tier: "free", status: "active" });
  expect(screen.getByText("Unlock more with Pro")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Upgrade" }));
  expect(onNavigate).toHaveBeenCalledWith("/pricing");
});

it("lets free members upgrade by clicking anywhere on the card", async () => {
  const user = userEvent.setup();
  setup({ tier: "free", status: "active" });
  await user.click(screen.getByText("Unlock more with Pro"));
  expect(onNavigate).toHaveBeenCalledTimes(1);
  expect(onNavigate).toHaveBeenLastCalledWith("/pricing");
  await user.click(screen.getByRole("region", { name: "Your plan" }));
  expect(onNavigate).toHaveBeenCalledTimes(2);
  // The button still works and only navigates once.
  await user.click(screen.getByRole("button", { name: "Upgrade" }));
  expect(onNavigate).toHaveBeenCalledTimes(3);
});

it("keeps the paid card's body inert; only Manage plan navigates", async () => {
  const user = userEvent.setup();
  setup({ tier: "pro", status: "active" });
  await user.click(screen.getByText("You’re on Memento Pro"));
  expect(onNavigate).not.toHaveBeenCalled();
});
