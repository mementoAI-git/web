import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import DeleteAccount from "./delete-account";

// Radix's checkbox measures itself; jsdom has no ResizeObserver.
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const deleteAccount = vi.fn();
const logout = vi.fn();

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ trigger: deleteAccount, isMutating: false }),
}));
vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ logout }),
}));
vi.mock("@/hooks/use-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-store")>()),
  useStore: () => ({ user: { email: "grootxyz@gmail.com" } }),
}));
vi.mock("@/features/pricing/use-subscription-summary", () => ({
  useSubscriptionSummary: () => ({ summary: { tier: "pro" } }),
}));

describe("DeleteAccount", () => {
  beforeEach(() => {
    deleteAccount.mockReset().mockResolvedValue({ success: true });
    logout.mockReset().mockResolvedValue(undefined);
  });

  it("explains what happens, records a reason, then deletes only after DELETE is typed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccount open close={vi.fn()} />);

    expect(screen.getByText("Your Pro plan is active")).toBeInTheDocument();
    expect(screen.getByText(/14-day/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Choose a reason/ }));
    await user.click(screen.getByRole("radio", { name: "Something else" }));
    await user.type(screen.getByLabelText("Tell us more"), "Moving to paper");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Something else")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start deletion process" }));
    const submit = screen.getByRole("button", { name: "Log out and delete account" });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/groot\*\*\*gmail\.com/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/to confirm this action/), "DELETE");
    await user.click(screen.getByRole("checkbox"));
    await user.click(submit);

    await waitFor(() =>
      expect(deleteAccount).toHaveBeenCalledWith({
        reason: "other",
        details: "Moving to paper",
        export_data: true,
      }),
    );
    expect(logout).toHaveBeenCalledWith({ localOnly: true });
  });

  it("closing from the reason step keeps the earlier choice", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteAccount open close={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Choose a reason/ }));
    await user.click(screen.getByRole("radio", { name: "I’m taking a break" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByRole("button", { name: /Choose a reason/ })).toHaveTextContent("No reason");
  });
});
