import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { OnboardingNudgeBanner } from "./OnboardingNudgeBanner";

const mockNavigate = vi.fn();
let mockedUser: any = null;

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

  it("does not render on /onboard route", () => {
    mockedUser = { onboarding_status: "skipped" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/onboard", auth: true });
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });

  it("renders when skipped and not complete", () => {
    mockedUser = { onboarding_status: "skipped" };
    const { container } = renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    expect(screen.getByText(/finish setting up your memento/i)).toBeInTheDocument();
    const banner = container.querySelector('[role="banner"]');
    expect(banner?.className).toMatch(/\bw-full\b/);
    expect(banner?.className).toMatch(/\bbg-v3-fill-weak\b/);
    expect(banner?.className).toMatch(/\bborder-l-v3-stroke-strong\b/);
  });

  it("navigates to /onboard when Continue setup clicked and no nickname yet", async () => {
    const user = userEvent.setup();
    mockedUser = { onboarding_status: "skipped" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByText(/continue setup/i));
    expect(mockNavigate).toHaveBeenCalledWith("/onboard");
  });

  it("navigates to /onboarding/chat when skipped but nickname exists", async () => {
    const user = userEvent.setup();
    mockedUser = { onboarding_status: "skipped", nickname: "Alex" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByText(/continue setup/i));
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/chat");
  });

  it("dismisses when X clicked", async () => {
    const user = userEvent.setup();
    mockedUser = { onboarding_status: "skipped" };
    renderWithProviders(<OnboardingNudgeBanner />, { route: "/overview", auth: true });
    await user.click(screen.getByLabelText(/dismiss/i));
    expect(screen.queryByText(/finish setting up your memento/i)).not.toBeInTheDocument();
  });
});
