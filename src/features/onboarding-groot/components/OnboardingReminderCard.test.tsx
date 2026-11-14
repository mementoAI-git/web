import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingReminderCard } from "./OnboardingReminderCard";

const navigate = vi.fn();
const { useStore } = vi.hoisted(() => ({ useStore: vi.fn() }));
vi.mock("@/hooks/use-store", () => ({ useStore }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

const renderCard = () => render(<MemoryRouter><OnboardingReminderCard /></MemoryRouter>);

describe("OnboardingReminderCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["skipped", "never"])("shows for a %s account, with no way to dismiss it", async (status) => {
    useStore.mockReturnValue({ user: { _id: "u1", onboarding_status: status, onboarded: false } });
    renderCard();
    expect(screen.getByRole("region", { name: "Finish onboarding" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Complete onboarding" }));
    expect(navigate).toHaveBeenCalledWith("/onboarding");
  });

  it("is gone once onboarding is completed", () => {
    useStore.mockReturnValue({ user: { _id: "u1", onboarding_status: "completed", onboarded: true } });
    renderCard();
    expect(screen.queryByRole("region", { name: "Finish onboarding" })).not.toBeInTheDocument();
  });
});
