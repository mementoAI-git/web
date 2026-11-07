import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { OnboardingNudgeBanner } from "./OnboardingNudgeBanner";
import type { IUser } from "@/utility/interface";

const mockNavigate = vi.fn();
let mockedUser: IUser | null = null;

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/use-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-store")>();
  return {
    ...actual,
    useStore: () => {
      const base = actual.useStore();
      return { ...base, user: mockedUser };
    },
  };
});

describe("OnboardingNudgeBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockedUser = null;
  });

  it("does not render when onboarding is complete", () => {
    mockedUser = { onboarding_status: "completed", onboarded: true };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("does not render when not skipped", () => {
    mockedUser = { onboarding_status: "never" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("does not render on /onboarding route", () => {
    mockedUser = { onboarding_status: "skipped" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/onboarding", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("renders when skipped and not complete", () => {
    mockedUser = { onboarding_status: "skipped" };
    const { container } = renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.getByText(/finish setting up your memento/i)).toBeInTheDocument();
    const banner = container.querySelector('[role="banner"]');
    expect(banner?.className).toMatch(/\bw-full\b/);
    expect(banner?.className).toMatch(/\bbg-fill-neutral-weak\b/);
    expect(banner?.className).toMatch(/\bborder-stroke-neutral-weak\b/);
    expect(banner?.className).not.toMatch(/-info-/);
  });

  it("navigates to /onboarding when Continue setup clicked and no nickname yet", async () => {
    const user = userEvent.setup();
    mockedUser = { onboarding_status: "skipped" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByText(/continue setup/i));
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding");
  });

  it("navigates to /onboarding when skipped and a nickname exists", async () => {
    const user = userEvent.setup();
    mockedUser = { onboarding_status: "skipped", nickname: "Alex" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByText(/continue setup/i));
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding");
  });

  it("dismisses when X clicked", async () => {
    const user = userEvent.setup();
    mockedUser = { onboarding_status: "skipped" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByLabelText(/dismiss/i));
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });
});
