import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
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

  it("renders trigger avatar with full rounding", () => {
    renderWithProviders(<ProfileDropdown />, { auth: true });
    const avatar = document.querySelector(".user-avatar");
    expect(avatar).toBeTruthy();
    expect(avatar).toHaveClass("!rounded-full");
  });

  it("shows plan label under the name when subscription is loaded", async () => {
    renderWithProviders(<ProfileDropdown />, { auth: true });
    const trigger = await screen.findByRole("button", { name: /user/i });
    expect(within(trigger).getByText("Free")).toBeInTheDocument();
  });

  it("lets the sidebar trigger and account name fill the available width", async () => {
    renderWithProviders(<ProfileDropdown />, { auth: true });

    const trigger = await screen.findByRole("button", { name: /user/i });
    expect(trigger).toHaveClass("w-full");

    const accountRow = trigger.querySelector(
      ".flex.min-w-0.flex-1.items-center.gap-2",
    );
    expect(accountRow).toHaveClass("w-full");

    expect(within(trigger).getByText("User")).toHaveClass("w-full");
  });

  it("opens menu and exposes Contact us, social links, and settings actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileDropdown />, { auth: true });

    const trigger = screen.getByRole("button", { name: /user/i });
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

  it("lets the user select and persist Dark from the Theme submenu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileDropdown />, { auth: true });

    await user.click(screen.getByRole("button", { name: /user/i }));
    await user.hover(screen.getByRole("menuitem", { name: "Theme" }));

    const options = await screen.findByRole("menu", { name: "Theme" });
    expect(options).toHaveAttribute("aria-label", "Theme options");
    expect(
      within(options).getByRole("menuitemradio", { name: "Light" }),
    ).toBeInTheDocument();
    expect(
      within(options).getByRole("menuitemradio", { name: "Dark" }),
    ).toBeInTheDocument();
    expect(
      within(options).getByRole("menuitemradio", { name: "System" }),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowRight}{ArrowDown}{Enter}");
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("memento:theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: /user/i }));
    await user.hover(screen.getByRole("menuitem", { name: "Theme" }));
    const reopenedOptions = await screen.findByRole("menu", { name: "Theme" });
    expect(
      within(reopenedOptions).getByRole("menuitemradio", { name: "Dark" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("uses compact account menu spacing and label typography", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileDropdown />, { auth: true });

    await user.click(screen.getByRole("button", { name: /user/i }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveAttribute("aria-label", "Account menu");

    expect(menu).toHaveClass("gap-0");

    const settingsItem = screen.getByRole("menuitem", { name: /^settings$/i });
    expect(settingsItem).toHaveClass("min-h-8", "py-0.5");
    const label = settingsItem.querySelector("span.flex-1.text-left");
    expect(label).toBeTruthy();
    expect(label).toHaveClass("text-[13px]");
    expect(label).toHaveTextContent("Settings");
  });
});
