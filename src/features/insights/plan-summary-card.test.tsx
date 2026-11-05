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
  expect(screen.getByText("You’re on Memento Free")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Upgrade" }));
  expect(onNavigate).toHaveBeenCalledWith("/pricing");
});
