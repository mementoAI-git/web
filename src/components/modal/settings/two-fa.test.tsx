import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { mockUser, renderWithProviders } from "@/test";
import { useStore } from "@/hooks/use-store";
import TwoFactorAuthenticator from "./two-fa";

vi.mock("@/hooks/use-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-store")>();
  return { ...actual, useStore: vi.fn() };
});

function renderStatus(enabled: boolean) {
  vi.mocked(useStore).mockReturnValue({
    hydrated: true,
    user: { ...mockUser, two_factor: { secret: "", enabled } },
    auth: null,
    headerTitle: null,
  });
  renderWithProviders(<TwoFactorAuthenticator />);
}

describe("Two-factor authentication status", () => {
  it("shows the current enabled status and turn-off action without duplicate instructions", () => {
    renderStatus(true);
    expect(screen.getByText("On")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Turn off 2FA" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Setup 2FA" })).not.toBeInTheDocument();
    expect(screen.queryByText(/adds a verification step/)).not.toBeInTheDocument();
  });

  it("shows the current disabled status and setup action", () => {
    renderStatus(false);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Setup 2FA" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Turn off 2FA" })).not.toBeInTheDocument();
  });
});
