import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { SidebarUpgradeCard } from "./sidebar-upgrade-card";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SidebarUpgradeCard", () => {
  it("renders headline, subtext, and upgrade control", () => {
    renderWithProviders(<SidebarUpgradeCard />, {
      route: "/overview",
      auth: true,
    });

    expect(screen.getByText("Unlock more with Pro")).toBeInTheDocument();
    expect(
      screen.getByText(/Advanced features, more storage/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upgrade/i }),
    ).toBeInTheDocument();
  });

  it("navigates to settings and calls onNavigate when Upgrade is pressed", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    mockNavigate.mockClear();

    renderWithProviders(
      <SidebarUpgradeCard onNavigate={onNavigate} />,
      { route: "/overview", auth: true },
    );

    await user.click(screen.getByRole("button", { name: /upgrade/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/pricing");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
