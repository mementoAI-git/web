import posthog from "@/lib/posthog";
vi.mock("@/lib/posthog", () => ({ default: { __loaded: true, capture: vi.fn() } }));
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import SummaryPage from "./summary";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const navigate = vi.fn();
const trigger = vi.fn();
const setUser = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));
vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({ user: { _id: "user-123", nickname: "Jane" }, setUser }),
  StoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ trigger, isMutating: false }),
}));
vi.mock("swr", async (importOriginal) => ({
  ...(await importOriginal<typeof import("swr")>()),
  mutate: vi.fn().mockResolvedValue(undefined),
}));

describe("onboarding summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    trigger.mockResolvedValue({ success: true });
    sessionStorage.clear();
    sessionStorage.setItem(
      "memento:onboarding-flow:user-123",
      JSON.stringify({
        step: 3,
        reasons: ["memory_preservation"],
        about: "I care about family.",
        areas: ["identity_self", "passions_interests"],
      }),
    );
  });
  it("reviews the actual answers and saves the supported API payload on Continue", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SummaryPage />, { auth: true });
    expect(
      screen.getByRole("heading", {
        name: /Alright Jane, you’re ready to dive right in/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("I care about family.")).toBeInTheDocument();
    expect(screen.getByText("Identity and self")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/overview"));
    expect(trigger).toHaveBeenCalledWith(
      expect.objectContaining({
        self_description: "I care about family.",
        current_priority: ["identity_self", "passions_interests"],
        join_reasons: ["memory_preservation"],
        stepReached: 4,
      }),
    );
    expect(posthog.capture).toHaveBeenCalledWith("onboarding_completed", { life_area_count: 2, join_reason_count: 1, motivation_type: expect.any(String) });
    expect(setUser).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_status: "completed" }),
    );
    expect(
      sessionStorage.getItem("memento:onboarding-flow:user-123"),
    ).toBeNull();
  });
  it("keeps the draft and stays on the summary when saving fails", async () => {
    trigger.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderWithProviders(<SummaryPage />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(
      sessionStorage.getItem("memento:onboarding-flow:user-123"),
    ).not.toBeNull();
    trigger.mockResolvedValue({ success: true });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/overview"));
  });
  it("returns to the life area step for editing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SummaryPage />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(navigate).toHaveBeenCalledWith("/onboarding/misc");
    expect(trigger).not.toHaveBeenCalled();
  });
});
