import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { ProfileDropdown } from "./profile-dropdown";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ProfileDropdown", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("opens menu and exposes Contact us, social links, and settings actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileDropdown />, { auth: true });

    const trigger = screen.getByRole("button", { name: /^user$/i });
    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();

    const tally = menu.querySelector('a[href="https://tally.so/r/kdb0Jj"]');
    expect(tally).toBeTruthy();
    expect(tally).toHaveAttribute("target", "_blank");

    expect(
      menu.querySelector('a[href="https://x.com/MementoAI"]'),
    ).toBeTruthy();
    expect(
      menu.querySelector('a[href="https://discord.gg/RzR7xJSwYg"]'),
    ).toBeTruthy();

    await user.click(screen.getByRole("menuitem", { name: /^settings$/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });
});
