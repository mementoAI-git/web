import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { OnboardingNudgeBanner } from "./OnboardingNudgeBanner";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("OnboardingNudgeBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("does not render when onboarding is complete", () => {
    localStorage.setItem("memento_onboarding_complete", "true");
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("does not render when not skipped", () => {
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("does not render on /onboard route", () => {
    localStorage.setItem("memento_onboarding_skipped", "true");
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/onboard", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("renders when skipped and not complete", () => {
    localStorage.setItem("memento_onboarding_skipped", "true");
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.getByText(/finish setting up your memento/i)).toBeInTheDocument();
  });

  it("navigates to /onboard when Continue setup clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem("memento_onboarding_skipped", "true");
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByText(/continue setup/i));
    expect(mockNavigate).toHaveBeenCalledWith("/onboard");
  });

  it("dismisses when X clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem("memento_onboarding_skipped", "true");
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByLabelText(/dismiss/i));
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });
});
