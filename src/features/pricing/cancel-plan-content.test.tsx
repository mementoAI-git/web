import posthog from "@/lib/posthog";
vi.mock("@/lib/posthog", () => ({ default: { __loaded: true, capture: vi.fn() } }));
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CancelPlanContent } from "./cancel-plan-content";
import { cancelSubscription } from "./subscription-actions";
import { toast } from "sonner";
vi.mock("./subscription-actions", () => ({ cancelSubscription: vi.fn() }));
function show() {
  const complete = vi.fn();
  render(
    <Dialog open>
      <DialogContent>
        <CancelPlanContent onBack={vi.fn()} onComplete={complete} />
      </DialogContent>
    </Dialog>,
  );
  return complete;
}
beforeEach(() => vi.clearAllMocks());
describe("plan cancellation", () => {
  it("requires confirmation and a reason before submitting to billing", async () => {
    vi.mocked(cancelSubscription).mockResolvedValue({
      success: true,
      data: null,
    });
    const complete = show();
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
    expect(cancelSubscription).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cancel plan" })).toBeDisabled();
    await userEvent.click(
      screen.getByRole("radio", { name: "It’s too expensive" }),
    );
    await userEvent.type(
      screen.getByLabelText("Tell us more (optional)"),
      "My budget changed",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel plan" }));
    expect(cancelSubscription).toHaveBeenCalledWith({
      reason: "too_expensive",
      comment: "It’s too expensive\nMy budget changed",
    });
    expect(complete).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledWith("subscription_cancelled", { cancellation_reason: "too_expensive" });
  });
  it("keeps feedback and allows retry when the provider rejects cancellation", async () => {
    vi.mocked(cancelSubscription).mockResolvedValue({
      success: false,
      message: "Provider unavailable",
      data: null,
    });
    const error = vi.spyOn(toast, "error");
    const complete = show();
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
    await userEvent.click(
      screen.getByRole("radio", { name: "I’m taking a break" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel plan" }));
    expect(error).toHaveBeenCalledWith("Provider unavailable");
    expect(complete).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(
      screen.getByRole("radio", { name: "I’m taking a break" }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: "Cancel plan" })).toBeEnabled();
  });
});
